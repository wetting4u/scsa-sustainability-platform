import {
  deleteGoal,
  updateGoal,
} from "@/features/goals/server/service";

type RouteContext = {
  params: Promise<{
    goalId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { goalId } = await context.params;

  return updateGoal(request, goalId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { goalId } = await context.params;

  return deleteGoal(goalId);
}