import {
  deleteAdminChallenge,
  updateAdminChallenge,
} from "@/features/challenges/server/admin-service";

type RouteContext = {
  params: Promise<{
    challengeId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const { challengeId } = await context.params;

  return updateAdminChallenge(request, challengeId);
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const { challengeId } = await context.params;

  return deleteAdminChallenge(challengeId);
}