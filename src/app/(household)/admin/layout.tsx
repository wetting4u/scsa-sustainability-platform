import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/features/admin/server/authorization";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authorization = await requireAdmin();

  if (!authorization.ok) {
    redirect(authorization.response.status === 401 ? "/sign-in" : "/overview");
  }

  return <>{children}</>;
}
