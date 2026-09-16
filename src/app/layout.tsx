import type { Metadata } from "next";
import { DemoProvider } from "@/features/demo/provider";
import { Shell } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: "SCSA | Small steps. Shared future.",
  description:
    "A household sustainability prototype for Sustainable Communities SA.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body>
        <DemoProvider>
          <Shell>{children}</Shell>
        </DemoProvider>
      </body>
    </html>
  );
}
