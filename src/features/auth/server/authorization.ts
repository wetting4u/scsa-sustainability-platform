import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  getAccountAccessFailure,
  isAccountFrozen,
} from "@/features/auth/authorization";
import { apiError } from "@/lib/api/response";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ActiveUserAuthorization =
  | {
      ok: true;
      supabase: SupabaseClient;
      user: User;
      userId: string;
    }
  | {
      ok: false;
      response: Response;
    };

export type AuthenticatedAccountAuthorization = ActiveUserAuthorization;

function accessDenied(
  failure: NonNullable<ReturnType<typeof getAccountAccessFailure>>,
) {
  return apiError(failure.status, failure.code, failure.message);
}

async function authorizeAccount(
  allowFrozen: boolean,
): Promise<ActiveUserAuthorization> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: accessDenied(
        getAccountAccessFailure({
          authenticated: false,
          providerRejectedAsBanned: authError?.code === "user_banned",
        })!,
      ),
    };
  }

  const adminResult = tryCreateAdminClient();

  if (!adminResult.ok) {
    return {
      ok: false,
      response: accessDenied(
        getAccountAccessFailure({
          authenticated: true,
          statusCheckFailed: true,
        })!,
      ),
    };
  }

  const { data, error: statusError } =
    await adminResult.client.auth.admin.getUserById(user.id);

  const failure = getAccountAccessFailure({
    authenticated: Boolean(data.user),
    accountFrozen: !allowFrozen && isAccountFrozen(data.user?.app_metadata),
    bannedUntil: data.user?.banned_until,
    statusCheckFailed: Boolean(statusError && statusError.status !== 404),
  });

  if (failure) {
    return {
      ok: false,
      response: accessDenied(failure),
    };
  }

  return {
    ok: true,
    supabase,
    user: data.user ?? user,
    userId: user.id,
  };
}

export function requireActiveUser(): Promise<ActiveUserAuthorization> {
  return authorizeAccount(false);
}

export function requireAuthenticatedAccount(): Promise<AuthenticatedAccountAuthorization> {
  return authorizeAccount(true);
}
