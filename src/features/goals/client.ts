"use client";

import type { Goal } from "@/features/records/domain";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

async function request<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const payload =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody | undefined;

    throw new Error(
      errorBody?.error?.message ??
        `Goals API request failed (${response.status}).`,
    );
  }

  return payload as T;
}

export const goalsApi = {
  list: () => request<{ data: Goal[] }>("/api/goals", "GET"),

  create: (goal: Omit<Goal, "id">) =>
    request<{ data: Goal }>("/api/goals", "POST", goal),

  update: (id: string, goal: Omit<Goal, "id">) =>
    request<{ data: Goal }>(
      `/api/goals/${encodeURIComponent(id)}`,
      "PATCH",
      goal,
    ),

  remove: (id: string) =>
    request<{ data: { id: string } }>(
      `/api/goals/${encodeURIComponent(id)}`,
      "DELETE",
    ),
};