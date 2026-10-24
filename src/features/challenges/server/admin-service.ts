import { validateChallengeText } from "@/lib/validation/content";
import "server-only";
import { validatePeriod, validatePeriodChange } from "@/lib/periods";

import { requireAdmin } from "@/features/admin/server/authorization";
import { resources, type Resource } from "@/features/records/domain";
import { apiError, noStoreHeaders } from "@/lib/api/response";
import type { Challenge, ChallengeInput } from "../domain";

type ChallengeRow = {
  id: string;
  title: string;
  description: string;
  resource: Resource;
  target: number | string;
  reward_points: number | null;
  min_household_size: number | null;
  max_household_size: number | null;
  start_date: string;
  end_date: string;
  tag: string;
  icon: string;
};

type InputResult =
  | {
      ok: true;
      value: ChallengeInput;
    }
  | {
      ok: false;
      response: Response;
    };

function mapChallenge(row: ChallengeRow): Challenge {
  const days =
    Math.round(
      (Date.parse(row.end_date) - Date.parse(row.start_date)) / 86400000,
    ) + 1;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    resource: row.resource,
    target: Number(row.target),
    rewardPoints: row.reward_points,
    minHouseholdSize: row.min_household_size,
    maxHouseholdSize: row.max_household_size,
    start: row.start_date,
    end: row.end_date,
    tag: row.tag,
    icon: row.icon,
    duration: `${days} days`,
  };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

async function readChallengeInput(request: Request): Promise<InputResult> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError(
        400,
        "INVALID_JSON",
        "Enter valid challenge information.",
      ),
    };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      response: apiError(
        400,
        "INVALID_CHALLENGE",
        "Enter valid challenge information.",
      ),
    };
  }

  const values = body as Record<string, unknown>;
  const textValidation = validateChallengeText(values);
  if (!textValidation.ok)
    return {
      ok: false,
      response: apiError(400, textValidation.code, textValidation.message),
    };

  const resource = String(values.resource ?? "") as Resource;

  const input: ChallengeInput = {
    title: textValidation.value.title,
    description: textValidation.value.description,
    resource,
    target: Number(values.target),
    rewardPoints:
      typeof values.rewardPoints === "number" ? values.rewardPoints : null,
    start: String(values.start ?? ""),
    end: String(values.end ?? ""),
    tag: textValidation.value.tag,
    icon: String(values.icon ?? "").trim(),
  };

  const resourceExists = Object.prototype.hasOwnProperty.call(
    resources,
    input.resource,
  );

  const iconExists = ["sprout", "bolt", "drop"].includes(input.icon);

  if (
    input.rewardPoints === null ||
    !Number.isInteger(input.rewardPoints) ||
    input.rewardPoints < 0 ||
    input.rewardPoints > 1000000 ||
    !input.title ||
    input.title.length > 100 ||
    !input.description ||
    input.description.length > 500 ||
    !input.tag ||
    input.tag.length > 50 ||
    !resourceExists ||
    !iconExists ||
    !Number.isFinite(input.target) ||
    input.target <= 0 ||
    input.target > resources[input.resource].max ||
    !isValidDate(input.start) ||
    !isValidDate(input.end) ||
    input.end < input.start
  ) {
    return {
      ok: false,
      response: apiError(
        400,
        "VALIDATION_ERROR",
        "Enter valid challenge details, target and dates.",
      ),
    };
  }

  return {
    ok: true,
    value: input,
  };
}

export async function createAdminChallenge(request: Request) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.response;
  }

  const input = await readChallengeInput(request);

  if (!input.ok) {
    return input.response;
  }

  const challenge = input.value;

  const periodError = validatePeriod(challenge, "challenge");
  if (periodError) return apiError(400, "INVALID_PERIOD", periodError);

  const { data, error } = await admin.supabase
    .from("challenges")
    .insert({
      title: challenge.title,
      description: challenge.description,
      resource: challenge.resource,
      target: challenge.target,
      reward_points: challenge.rewardPoints,
      start_date: challenge.start,
      end_date: challenge.end,
      tag: challenge.tag,
      icon: challenge.icon,
    })
    .select(
      "id, title, description, resource, target, start_date, end_date, tag, icon, reward_points, min_household_size, max_household_size",
    )
    .single();

  if (error) {
    return apiError(
      500,
      "CHALLENGE_CREATE_FAILED",
      "Unable to create the challenge.",
    );
  }

  return Response.json(
    {
      data: mapChallenge(data as ChallengeRow),
    },
    {
      status: 201,
      headers: noStoreHeaders,
    },
  );
}

export async function updateAdminChallenge(
  request: Request,
  challengeId: string,
) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.response;
  }

  const input = await readChallengeInput(request);

  if (!input.ok) {
    return input.response;
  }

  const challenge = input.value;

  const { data: existing, error: existingError } = await admin.supabase
    .from("challenges")
    .select("start_date, end_date")
    .eq("id", challengeId)
    .maybeSingle();
  if (existingError)
    return apiError(
      500,
      "CHALLENGE_QUERY_FAILED",
      "Unable to check the saved challenge.",
    );
  if (!existing)
    return apiError(404, "CHALLENGE_NOT_FOUND", "Challenge not found.");
  const periodError = validatePeriodChange(
    challenge,
    { start: existing.start_date, end: existing.end_date },
    "challenge",
  );
  if (periodError) return apiError(400, "INVALID_PERIOD", periodError);

  const { data, error } = await admin.supabase
    .from("challenges")
    .update({
      title: challenge.title,
      description: challenge.description,
      resource: challenge.resource,
      target: challenge.target,
      reward_points: challenge.rewardPoints,
      start_date: challenge.start,
      end_date: challenge.end,
      tag: challenge.tag,
      icon: challenge.icon,
    })
    .eq("id", challengeId)
    .select(
      "id, title, description, resource, target, start_date, end_date, tag, icon, reward_points, min_household_size, max_household_size",
    )
    .maybeSingle();

  if (error) {
    return apiError(
      500,
      "CHALLENGE_UPDATE_FAILED",
      "Unable to update the challenge.",
    );
  }

  if (!data) {
    return apiError(404, "CHALLENGE_NOT_FOUND", "Challenge not found.");
  }

  return Response.json(
    {
      data: mapChallenge(data as ChallengeRow),
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}

export async function deleteAdminChallenge(challengeId: string) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.response;
  }

  const { data, error } = await admin.supabase
    .from("challenges")
    .delete()
    .eq("id", challengeId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23503")
      return apiError(
        409,
        "CHALLENGE_HAS_REWARDS",
        "This challenge has awarded points and cannot be deleted.",
      );
    return apiError(
      500,
      "CHALLENGE_DELETE_FAILED",
      "Unable to delete the challenge.",
    );
  }

  if (!data) {
    return apiError(404, "CHALLENGE_NOT_FOUND", "Challenge not found.");
  }

  return Response.json(
    {
      data: {
        id: challengeId,
      },
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}
