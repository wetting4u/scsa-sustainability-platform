"use client";

import { validateChallengeText } from "../../lib/validation/content.ts";

import type { Challenge, ChallengeInput } from "./domain";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

type MembershipResult = {
  data: {
    challengeId: string;
    joined: boolean;
  };
};

async function request<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  if (
    path.startsWith("/api/admin/challenges") &&
    (method === "POST" || method === "PATCH")
  ) {
    const values = body as Record<string, unknown>;
    const validation = validateChallengeText(values);
    if (!validation.ok) throw new Error(validation.message);
    body = { ...values, ...validation.value };
  }
  const response = await fetch(path, {
    method,
    headers:
      body === undefined
        ? undefined
        : {
            "Content-Type": "application/json",
          },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody | undefined;

    throw new Error(
      errorBody?.error?.message ??
        `Challenges API request failed (${response.status}).`,
    );
  }

  return payload as T;
}

export const challengesApi = {
  list: () => request<{ data: Challenge[] }>("/api/challenges", "GET"),

  memberships: () =>
    request<{ data: string[] }>("/api/challenges/memberships", "GET"),

  join: (challengeId: string) =>
    request<MembershipResult>(
      `/api/challenges/${encodeURIComponent(challengeId)}/membership`,
      "POST",
    ),

  leave: (challengeId: string) =>
    request<MembershipResult>(
      `/api/challenges/${encodeURIComponent(challengeId)}/membership`,
      "DELETE",
    ),
};

export const adminChallengesApi = {
  create: (challenge: ChallengeInput) =>
    request<{ data: Challenge }>("/api/admin/challenges", "POST", challenge),

  update: (challengeId: string, challenge: ChallengeInput) =>
    request<{ data: Challenge }>(
      `/api/admin/challenges/${encodeURIComponent(challengeId)}`,
      "PATCH",
      challenge,
    ),

  remove: (challengeId: string) =>
    request<{ data: { id: string } }>(
      `/api/admin/challenges/${encodeURIComponent(challengeId)}`,
      "DELETE",
    ),
};
