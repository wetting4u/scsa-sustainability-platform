"use client";

import type {
  AdminManagedUser,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from "./domain";

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
      body === undefined
        ? undefined
        : {
            "Content-Type": "application/json",
          },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
    cache: "no-store",
  });

  const result = (await response.json()) as T & ApiErrorBody;

  if (!response.ok) {
    throw new Error(
      result.error?.message ??
        `Users API request failed (${response.status}).`,
    );
  }

  return result;
}

export const adminUsersApi = {
  list: () =>
    request<{ data: AdminManagedUser[] }>(
      "/api/admin/users",
      "GET",
    ),

  create: (user: CreateAdminUserInput) =>
    request<{ data: AdminManagedUser }>(
      "/api/admin/users",
      "POST",
      user,
    ),

  update: (
    userId: string,
    changes: UpdateAdminUserInput,
  ) =>
    request<{ data: { id: string } }>(
      `/api/admin/users/${encodeURIComponent(userId)}`,
      "PATCH",
      changes,
    ),

  remove: (userId: string) =>
    request<{ data: { id: string } }>(
      `/api/admin/users/${encodeURIComponent(userId)}`,
      "DELETE",
    ),
};