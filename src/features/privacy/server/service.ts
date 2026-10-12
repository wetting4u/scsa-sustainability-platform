import "server-only";

import {
  validateProfilePatch,
  type HouseholdProfile,
} from "@/features/privacy/domain";
import { requireActiveUser } from "@/features/auth/server/authorization";

type HouseholdProfileRow = {
  display_name: string;
  household_size: number;
  share_analytics: boolean;
  display_leaderboard: boolean;
};

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function apiError(status: number, code: string, message: string) {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: noStoreHeaders,
    },
  );
}

function mapProfile(row: HouseholdProfileRow): HouseholdProfile {
  return {
    displayName: row.display_name,
    householdSize: Number(row.household_size),
    shareAnalytics: row.share_analytics,
    displayLeaderboard: row.display_leaderboard,
  };
}

async function authenticatedProfileClient() {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return {
      error: authorization.response,
    } as const;
  }

  return {
    supabase: authorization.supabase,
    userId: authorization.userId,
    error: null,
  } as const;
}

export async function getProfile() {
  const authorization = await authenticatedProfileClient();

  if (authorization.error) {
    return authorization.error;
  }

  const { data, error } = await authorization.supabase
    .from("household_profiles")
    .select(
      "display_name, household_size, share_analytics, display_leaderboard",
    )
    .eq("user_id", authorization.userId)
    .maybeSingle();

  if (error) {
    return apiError(
      500,
      "PROFILE_QUERY_FAILED",
      "Unable to load your profile.",
    );
  }

  if (!data) {
    return apiError(
      404,
      "PROFILE_NOT_FOUND",
      "Your household profile has not been initialized.",
    );
  }

  return Response.json(
    { data: mapProfile(data as HouseholdProfileRow) },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}

export async function updateProfile(request: Request) {
  const authorization = await authenticatedProfileClient();

  if (authorization.error) {
    return authorization.error;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Enter valid profile information.");
  }

  const validation = validateProfilePatch(body);

  if (validation.data === null) {
    return apiError(400, "VALIDATION_ERROR", validation.error);
  }

  const changes = validation.data;
  const databaseChanges: Record<string, string | number | boolean> = {};

  if (changes.displayName !== undefined) {
    databaseChanges.display_name = changes.displayName;
  }

  if (changes.householdSize !== undefined) {
    databaseChanges.household_size = changes.householdSize;
  }

  if (changes.shareAnalytics !== undefined) {
    databaseChanges.share_analytics = changes.shareAnalytics;
  }

  if (changes.displayLeaderboard !== undefined) {
    databaseChanges.display_leaderboard = changes.displayLeaderboard;
  }

  const { data, error } = await authorization.supabase
    .from("household_profiles")
    .update(databaseChanges)
    .eq("user_id", authorization.userId)
    .select(
      "display_name, household_size, share_analytics, display_leaderboard",
    )
    .maybeSingle();

  if (error) {
    return apiError(
      500,
      "PROFILE_UPDATE_FAILED",
      "Unable to update your profile.",
    );
  }

  if (!data) {
    return apiError(
      404,
      "PROFILE_NOT_FOUND",
      "Your household profile has not been initialized.",
    );
  }

  return Response.json(
    { data: mapProfile(data as HouseholdProfileRow) },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}
