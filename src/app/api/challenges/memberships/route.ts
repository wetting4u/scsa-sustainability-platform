import { listChallengeMemberships } from "@/features/challenges/server/service";

export function GET() {
  return listChallengeMemberships();
}