"use client";

import type { HouseholdProfile, HouseholdProfilePatch } from "./domain";

type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

async function requestProfile(
  method: "GET" | "PATCH",
  body?: HouseholdProfilePatch,
) {
  const response = await fetch("/api/profile", {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => undefined)) as
    { data: HouseholdProfile } | ApiErrorBody | undefined;

  if (!response.ok) {
    throw new Error(
      (payload as ApiErrorBody | undefined)?.error?.message ??
        `Profile request failed (${response.status}).`,
    );
  }

  return payload as { data: HouseholdProfile };
}

export const profileApi = {
  get: () => requestProfile("GET"),
  update: (changes: HouseholdProfilePatch) => requestProfile("PATCH", changes),
};
