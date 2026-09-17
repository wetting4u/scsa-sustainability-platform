"use client";
import type { UsageRecord } from "./domain";

// Prepared for the future API integration. Records currently uses DemoProvider.
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
  if (!response.ok) {
    throw new Error(
      `Records API request failed (${response.status}). Persistent records are not enabled yet.`,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
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
    request<void>(`/api/records/${encodeURIComponent(id)}`, "DELETE"),
};
