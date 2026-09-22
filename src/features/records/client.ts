"use client";

import type { UsageRecord } from "./domain";

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
        `Records API request failed (${response.status}).`,
    );
  }

  return payload as T;
}

export const recordsApi = {
  list: () => request<{ data: UsageRecord[] }>("/api/records", "GET"),

  create: (record: Omit<UsageRecord, "id">) =>
    request<{ data: UsageRecord }>("/api/records", "POST", record),

  update: (id: string, record: Omit<UsageRecord, "id">) =>
    request<{ data: UsageRecord }>(
      `/api/records/${encodeURIComponent(id)}`,
      "PATCH",
      record,
    ),

  remove: (id: string) =>
    request<{ data: { id: string } }>(
      `/api/records/${encodeURIComponent(id)}`,
      "DELETE",
    ),
};