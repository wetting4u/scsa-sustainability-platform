import "server-only";

import type { User } from "@supabase/supabase-js";

import { getAccountAccessFailure } from "@/features/auth/authorization";
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

function accessDenied(
  failure: NonNullable<ReturnType<typeof getAccountAccessFailure>>,
) {
  return apiError(failure.status, failure.code, failure.message);
}

export async function requireActiveUser(): Promise<ActiveUserAuthorization> {
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
    user,
    userId: user.id,
  };
}
