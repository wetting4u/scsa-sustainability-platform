import "server-only";

import { getAdminAccessFailure } from "@/features/admin/authorization";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function accessDenied(
  failure: NonNullable<ReturnType<typeof getAdminAccessFailure>>,
) {
  return Response.json(
    {
      error: {
        code: failure.code,
        message: failure.message,
      },
    },
    {
      status: failure.status,
      headers: noStoreHeaders,
    },
  );
}

export async function requireAdmin(): Promise<AdminAuthorization> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

    if (authError || !user) {
    return {
      ok: false,
      response: accessDenied({
        status: 401,
        code: "UNAUTHENTICATED",
        message: "You must sign in before using administrator features.",
      }),
    };
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("account_roles")
    .select("role")
    .eq("user_id", user!.id)
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
    supabase,
    userId: user!.id,
  };
}
