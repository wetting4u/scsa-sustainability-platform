import "server-only";

import { requireActiveUser } from "@/features/auth/server/authorization";
import type { Resource } from "@/features/records/domain";
import type { Challenge } from "../domain";

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

export async function listChallenges() {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { supabase } = authorization;

  const { data, error } = await supabase
    .from("challenges")
    .select(
      "id, title, description, resource, target, start_date, end_date, tag, icon, reward_points, min_household_size, max_household_size",
    )
    .order("start_date", { ascending: true });

  if (error) {
    return apiError(
      500,
      "CHALLENGES_QUERY_FAILED",
      "Unable to load challenges.",
    );
  }

  return Response.json(
    {
      data: ((data ?? []) as ChallengeRow[]).map(mapChallenge),
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}

export async function listChallengeMemberships() {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { supabase, userId } = authorization;

  const { data, error } = await supabase
    .from("challenge_memberships")
    .select("challenge_id")
    .eq("user_id", userId);

  if (error) {
    return apiError(
      500,
      "MEMBERSHIPS_QUERY_FAILED",
      "Unable to load challenge memberships.",
    );
  }

  return Response.json(
    {
      data: (data ?? []).map((membership) => membership.challenge_id),
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}

export async function joinChallenge(challengeId: string) {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { supabase, userId } = authorization;

  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id")
    .eq("id", challengeId)
    .maybeSingle();

  if (challengeError) {
    return apiError(
      500,
      "CHALLENGE_QUERY_FAILED",
      "Unable to check the challenge.",
    );
  }

  if (!challenge) {
    return apiError(404, "CHALLENGE_NOT_FOUND", "Challenge not found.");
  }

  const { error } = await supabase.from("challenge_memberships").upsert(
    {
      user_id: userId,
      challenge_id: challengeId,
    },
    {
      onConflict: "user_id,challenge_id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    return apiError(
      500,
      "CHALLENGE_JOIN_FAILED",
      error.code === "42501"
        ? "This challenge has ended or your household does not meet its size requirements."
        : "Unable to join the challenge.",
    );
  }

  return Response.json(
    {
      data: {
        challengeId,
        joined: true,
      },
    },
    {
      status: 201,
      headers: noStoreHeaders,
    },
  );
}

export async function leaveChallenge(challengeId: string) {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { supabase, userId } = authorization;

  const { error } = await supabase
    .from("challenge_memberships")
    .delete()
    .eq("user_id", userId)
    .eq("challenge_id", challengeId);

  if (error) {
    return apiError(
      500,
      "CHALLENGE_LEAVE_FAILED",
      "Unable to leave the challenge.",
    );
  }

  return Response.json(
    {
      data: {
        challengeId,
        joined: false,
      },
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}

export async function listChallengeRewards() {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  const rows: { challenge_id: string; points: number; awarded_at: string }[] =
    [];
  for (;;) {
    const { data, error } = await auth.supabase
      .from("challenge_rewards")
      .select("challenge_id, points, awarded_at")
      .eq("user_id", auth.userId)
      .order("challenge_id")
      .range(rows.length, rows.length + 999);
    if (error)
      return apiError(
        500,
        "REWARDS_QUERY_FAILED",
        "Unable to load challenge rewards.",
      );
    if (!data?.length) break;
    rows.push(...data);
  }
  return Response.json({ data: rows }, { headers: noStoreHeaders });
}

export async function claimChallengeReward(challengeId: string) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      challengeId,
    )
  )
    return apiError(400, "INVALID_CHALLENGE", "Invalid challenge ID.");
  const { data, error } = await auth.supabase.rpc("claim_challenge_reward", {
    p_challenge_id: challengeId,
  });
  if (error)
    return apiError(
      500,
      "REWARD_FAILED",
      "Unable to claim points. Please try again.",
    );
  const messages: Record<string, string> = {
    profile_required: "Set up your household profile first.",
    not_found: "This challenge is no longer available.",
    not_joined: "Join this challenge before claiming points.",
    not_ended: "Points can be claimed after the challenge ends.",
    no_records: "Add usage records for this challenge period first.",
    incomplete_data:
      "Records must cover the entire challenge period. Partially overlapping records do not count.",
    failed: "Your recorded usage exceeds this challenge's limit.",
    reward_not_configured:
      "An administrator needs to configure the reward points first.",
  };
  if (!data || !["awarded", "already_awarded"].includes(data.status))
    return apiError(
      409,
      "REWARD_NOT_ELIGIBLE",
      messages[data?.status] ?? "Points could not be awarded.",
    );
  return Response.json({ data }, { headers: noStoreHeaders });
}
