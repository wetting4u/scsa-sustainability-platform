import { evaluateGoal } from "../badges/domain.ts";
import type { Challenge } from "./domain.ts";
import type { UsageRecord } from "../records/domain.ts";

export type ChallengeProgressStatus =
  | "upcoming"
  | "no_data"
  | "within_limit"
  | "exceeded"
  | "incomplete"
  | "achieved"
  | "completed";

export function evaluateChallengeProgress(
  challenge: Challenge,
  records: UsageRecord[],
  reward: { points: number } | undefined,
  today: string,
) {
  // Goals and challenges share the same fully-enclosed record/coverage rule.
  // This is a UI preview; the database rechecks eligibility when points are claimed.
  const result = evaluateGoal(challenge, records, today);
  const ended = challenge.end < today;
  const status: ChallengeProgressStatus = reward
    ? "completed"
    : result.status === "insufficient_data" ||
        (ended && result.status === "no_data")
      ? "incomplete"
      : result.status;
  const labels: Record<ChallengeProgressStatus, string> = {
    upcoming: "Upcoming",
    no_data: "No records yet",
    within_limit: "Within limit so far",
    exceeded: "Limit exceeded",
    incomplete: "Incomplete records",
    achieved: "Achieved",
    completed: "Completed",
  };
  const percentage =
    challenge.target > 0 ? (result.usage / challenge.target) * 100 : 0;
  return {
    ...result,
    status,
    label: labels[status],
    percentage,
    canClaim: status === "achieved" && challenge.rewardPoints !== null,
    awardedPoints: reward?.points,
  };
}
