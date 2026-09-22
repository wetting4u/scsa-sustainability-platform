import {
  joinChallenge,
  leaveChallenge,
} from "@/features/challenges/server/service";

type RouteContext = {
  params: Promise<{
    challengeId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const { challengeId } = await context.params;
  return joinChallenge(challengeId);
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const { challengeId } = await context.params;
  return leaveChallenge(challengeId);
}