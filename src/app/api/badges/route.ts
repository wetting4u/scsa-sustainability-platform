import { listGoalBadges } from "@/features/badges/server/service";
export function GET() {
  return listGoalBadges();
}
