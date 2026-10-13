import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { Shell } from "@/components/shell";
import { requireActiveUser } from "@/features/auth/server/authorization";

export const dynamic = "force-dynamic";

export default async function HouseholdLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    const payload = (await authorization.response
      .clone()
      .json()
      .catch(() => null)) as
      | {
          error?: {
            code?: string;
          };
        }
      | null;

    if (payload?.error?.code === "ACCOUNT_FROZEN") {
      redirect("/account-frozen");
    }

    redirect("/sign-in");
  }

  const { supabase, userId } = authorization;

  const { data: profile } = await supabase
    .from("household_profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: accountRole } = await supabase
    .from("account_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const householdName = profile?.display_name ?? "My household";
  const isAdmin = accountRole?.role === "admin";

  return (
    <Shell householdName={householdName} isAdmin={isAdmin}>
      {children}
    </Shell>
  );
}
