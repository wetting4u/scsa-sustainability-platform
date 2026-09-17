import type { ReactNode } from "react";
import { DemoProvider } from "@/features/demo/provider";
import { Shell } from "@/components/shell";

// Shared across household routes, so client navigation preserves demo state.
// This layout is presentation only; it does not enforce authentication.
export default function HouseholdLayout({ children }: { children: ReactNode }) {
  return (
    <DemoProvider>
      <Shell>{children}</Shell>
    </DemoProvider>
  );
}
