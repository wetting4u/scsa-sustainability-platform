import { resetOwnAccountProgress } from "@/features/account/server/lifecycle";

export function POST() {
  return resetOwnAccountProgress();
}
