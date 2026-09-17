import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
