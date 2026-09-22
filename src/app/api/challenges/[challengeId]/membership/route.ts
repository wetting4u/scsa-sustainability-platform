import { ApiError, databaseError, handle, json, session } from "@/lib/api";
import { uuid } from "@/features/goals/domain";
type Context = { params: Promise<{ challengeId: string }> };
export function POST(request: Request, context: Context) {
  return handle(async () => {
    const { db } = await session(request);
    const id = uuid((await context.params).challengeId);
    const challenge = await db
      .from("challenges")
      .select("id")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();
    databaseError(challenge.error);
    if (!challenge.data)
      throw new ApiError(404, "NOT_FOUND", "Active challenge not found.");
    // Only challenge_id is writable; user_id comes from auth.uid(), protected by RLS.
    const result = await db
      .from("challenge_memberships")
      .insert({ challenge_id: id })
      .select("challenge_id,joined_at")
      .single();
    databaseError(result.error);
    return json(
      { challengeId: id, joined: true, joinedAt: result.data!.joined_at },
      201,
    );
  });
}
export function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const { db, userId } = await session(request);
    const result = await db
      .from("challenge_memberships")
      .delete()
      .eq("challenge_id", uuid((await context.params).challengeId))
      .eq("user_id", userId);
    databaseError(result.error);
    return json({
      challengeId: (await context.params).challengeId,
      joined: false,
    });
  });
}
