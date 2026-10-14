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

export class AdminUsersApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminUsersApiError";
  }
}

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
        : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
    cache: "no-store",
  });

  const result = (await response.json().catch(() => null)) as
    | (T & ApiErrorBody)
    | null;

  if (!response.ok) {
    const code = result?.error?.code ?? "UNKNOWN_ERROR";

    const errorMessages: Record<string, string> = {
      UNAUTHENTICATED:
        "Your session has expired. Please sign in again.",

      ACCOUNT_DISABLED:
        "Your account has been disabled. Please contact an administrator.",

      FORBIDDEN:
        "You do not have permission to perform this action.",

      ACCOUNT_STATUS_UNAVAILABLE:
        "Unable to verify account status. Please try again later.",

      ADMIN_SERVICE_UNAVAILABLE:
        "Administrator service is temporarily unavailable.",
    };

    throw new AdminUsersApiError(
      code,
      response.status,
      errorMessages[code] ??
        result?.error?.message ??
        `Users API request failed (${response.status}).`,
    );
  }

  if (!result) {
    throw new Error("The server returned an invalid response.");
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