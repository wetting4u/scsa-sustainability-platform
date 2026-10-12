import "server-only";

import {
  inspectAccountInitialization,
  type AccountRoleInitializationRow,
  type HouseholdInitializationRow,
} from "@/features/account/domain";
import { requireActiveUser } from "@/features/auth/server/authorization";

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

export async function getAccountInitialization() {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { supabase, userId } = authorization;

  const [profileResult, roleResult] = await Promise.all([
    supabase
      .from("household_profiles")
      .select("user_id, share_analytics, display_leaderboard")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("account_roles")
      .select("user_id, role")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (profileResult.error || roleResult.error) {
    return apiError(
      500,
      "INITIALIZATION_CHECK_FAILED",
      "Unable to verify the new account setup.",
    );
  }

  const status = inspectAccountInitialization(
    userId,
    profileResult.data as HouseholdInitializationRow | null,
    roleResult.data as AccountRoleInitializationRow | null,
  );

  if (!status.ready) {
    return Response.json(
      {
        data: status,
        error: {
          code: "ACCOUNT_INITIALIZATION_INCOMPLETE",
          message:
            "Your account was confirmed, but its private household profile is not ready.",
        },
      },
      {
        status: 409,
        headers: noStoreHeaders,
      },
    );
  }

  return Response.json(
    {
      data: status,
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}
