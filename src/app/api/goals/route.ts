import {
  createGoal,
  listGoals,
} from "@/features/goals/server/service";

export function GET() {
  return listGoals();
}

export function POST(request: Request) {
  return createGoal(request);
}