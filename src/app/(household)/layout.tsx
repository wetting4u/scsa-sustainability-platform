import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { Shell } from "@/components/shell";
import { createClient } from "@/lib/supabase/server";

export default async function HouseholdLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }
  const { data: profile } = await supabase
  .from("household_profiles")
  .select("display_name")
  .eq("user_id", user.id)
  .maybeSingle();

const householdName = profile?.display_name ?? "My household";

  return (
  <Shell householdName={householdName}>
    {children}
  </Shell>
);
}
