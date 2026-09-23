import { getAccountInitialization } from "@/features/account/server/initialization";

export function GET() {
  return getAccountInitialization();
}
