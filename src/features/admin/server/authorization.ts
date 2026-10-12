import "server-only";

import { getAdminAccessFailure } from "@/features/admin/authorization";
import { requireActiveUser } from "@/features/auth/server/authorization";
import { apiError } from "@/lib/api/response";

type SupabaseClient = Extract<
  Awaited<ReturnType<typeof requireActiveUser>>,
  { ok: true }
>["supabase"];

export type AdminAuthorization =
  | {
      ok: true;
      supabase: SupabaseClient;
      userId: string;
    }
  | {
      ok: false;
      response: Response;
    };

function accessDenied(
  failure: NonNullable<ReturnType<typeof getAdminAccessFailure>>,
) {
  return apiError(failure.status, failure.code, failure.message);
}

export async function requireAdmin(): Promise<AdminAuthorization> {
  const account = await requireActiveUser();

  if (!account.ok) {
    return account;
  }

  const { data: roleRecord, error: roleError } = await account.supabase
    .from("account_roles")
    .select("role")
    .eq("user_id", account.userId)
    .maybeSingle();

  const authorizationFailure = getAdminAccessFailure({
    authenticated: true,
    role: roleRecord?.role,
    roleCheckFailed: Boolean(roleError),
  });

  if (authorizationFailure) {
    return {
      ok: false,
      response: accessDenied(authorizationFailure),
    };
  }

  return {
    ok: true,
    supabase: account.supabase,
    userId: account.userId,
  };
}
