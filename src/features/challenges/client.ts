"use client";

import type { Challenge } from "./domain";

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
): Promise<T> {
  const response = await fetch(path, {
    method,
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
  list: () =>
    request<{ data: Challenge[] }>("/api/challenges", "GET"),

  memberships: () =>
    request<{ data: string[] }>(
      "/api/challenges/memberships",
      "GET",
    ),

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