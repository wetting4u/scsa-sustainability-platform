import "server-only";
import { requireActiveUser } from "@/features/auth/server/authorization";
import { apiError, noStoreHeaders } from "@/lib/api/response";
export async function getResourceLeaderboard(request: Request) {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  const period = new URL(request.url).searchParams.get("period") ?? "weekly";
  if (!["weekly", "monthly"].includes(period))
    return apiError(400, "INVALID_PERIOD", "Choose Weekly or Monthly.");
  const { data, error } = await auth.supabase.rpc("get_resource_leaderboard", {
    p_period_type: period,
  });
  if (error)
    return apiError(
      500,
      "LEADERBOARD_FAILED",
      "Unable to load the leaderboard. Please try again.",
    );
  return Response.json({ data }, { headers: noStoreHeaders });
}
