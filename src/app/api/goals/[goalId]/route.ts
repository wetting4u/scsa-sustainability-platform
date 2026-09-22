import {
  ApiError,
  body,
  databaseError,
  handle,
  json,
  session,
} from "@/lib/api";
import { parseGoal, uuid } from "@/features/goals/domain";
import { goalColumns, goalRow, goalWrite } from "@/features/goals/server";
type Context = { params: Promise<{ goalId: string }> };
export function PATCH(request: Request, context: Context) {
  return handle(async () => {
    const { db, userId } = await session(request);
    const id = uuid((await context.params).goalId);
    const goal = parseGoal(await body(request));
    const result = await db
      .from("goals")
      .update(goalWrite(goal))
      .eq("id", id)
      .eq("user_id", userId)
      .select(goalColumns)
      .maybeSingle();
    databaseError(result.error);
    if (!result.data) throw new ApiError(404, "NOT_FOUND", "Goal not found.");
    return json(goalRow(result.data));
  });
}
export function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const { db, userId } = await session(request);
    const result = await db
      .from("goals")
      .delete()
      .eq("id", uuid((await context.params).goalId))
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    databaseError(result.error);
    if (!result.data) throw new ApiError(404, "NOT_FOUND", "Goal not found.");
    return json({ id: result.data.id });
  });
}
