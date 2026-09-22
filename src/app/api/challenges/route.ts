import { listChallenges } from "@/features/challenges/server/service";

export function GET() {
  return listChallenges();
}