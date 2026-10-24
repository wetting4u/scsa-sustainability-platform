import { claimChallengeReward } from "@/features/challenges/server/service";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ challengeId: string }> },
) {
  return claimChallengeReward((await params).challengeId);
}
