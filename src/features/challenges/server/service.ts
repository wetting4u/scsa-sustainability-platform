import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Resource } from "@/features/records/domain";
import type { Challenge } from "../domain";

type ChallengeRow = {
  id: string;
  title: string;
  description: string;
  resource: Resource;
  target: number | string;
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
    start: row.start_date,
    end: row.end_date,
    tag: row.tag,
    icon: row.icon,
    duration: `${days} days`,
  };
}

export async function listChallenges() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError(
      401,
      "UNAUTHENTICATED",
      "You must sign in before viewing challenges.",
    );
  }

  const { data, error } = await supabase
    .from("challenges")
    .select(
      "id, title, description, resource, target, start_date, end_date, tag, icon",
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
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError(
      401,
      "UNAUTHENTICATED",
      "You must sign in before viewing challenge memberships.",
    );
  }

  const { data, error } = await supabase
    .from("challenge_memberships")
    .select("challenge_id")
    .eq("user_id", user.id);

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
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError(
      401,
      "UNAUTHENTICATED",
      "You must sign in before joining a challenge.",
    );
  }

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

  const { error } = await supabase
    .from("challenge_memberships")
    .upsert(
      {
        user_id: user.id,
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
      "Unable to join the challenge.",
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
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError(
      401,
      "UNAUTHENTICATED",
      "You must sign in before leaving a challenge.",
    );
  }

  const { error } = await supabase
    .from("challenge_memberships")
    .delete()
    .eq("user_id", user.id)
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