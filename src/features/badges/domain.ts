import type { Goal, UsageRecord } from "../records/domain.ts";
import { adelaideToday, validDate } from "../../lib/periods.ts";

export type GoalBadgeStatus =
  | "achieved"
  | "within_limit"
  | "exceeded"
  | "insufficient_data"
  | "no_data"
  | "upcoming";
export type GoalBadge = Goal & {
  status: GoalBadgeStatus;
  usage: number;
  coveredDays: number;
  totalDays: number;
};
const day = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86400000;

export function evaluateGoal(
  goal: Goal,
  records: UsageRecord[],
  today = adelaideToday(),
): GoalBadge {
  const validGoal =
    validDate(goal.start) &&
    validDate(goal.end) &&
    goal.start <= goal.end &&
    Number.isFinite(goal.target) &&
    goal.target > 0;
  const totalDays = validGoal ? day(goal.end) - day(goal.start) + 1 : 0;
  const included = records.filter(
    (r) =>
      r.resource === goal.resource &&
      r.start >= goal.start &&
      r.end <= goal.end,
  );
  const valid = included
    .filter(
      (r) =>
        validDate(r.start) &&
        validDate(r.end) &&
        r.start <= r.end &&
        Number.isFinite(r.amount) &&
        r.amount >= 0,
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  let cursor = validGoal ? day(goal.start) : 0;
  let coveredDays = 0;
  let overlap = false;
  let usage = 0;
  for (const record of valid) {
    const start = day(record.start),
      end = day(record.end);
    if (start < cursor) overlap = true;
    coveredDays += Math.max(0, end - Math.max(cursor, start) + 1);
    cursor = Math.max(cursor, end + 1);
    usage += record.amount;
  }
  const complete =
    validGoal &&
    included.length === valid.length &&
    !overlap &&
    coveredDays === totalDays;
  let status: GoalBadgeStatus;
  if (!validGoal || !Number.isFinite(usage)) status = "insufficient_data";
  else if (today < goal.start) status = "upcoming";
  else if (!valid.length) status = "no_data";
  else if (usage > goal.target) status = "exceeded";
  else if (goal.end < today)
    status = complete ? "achieved" : "insufficient_data";
  else status = "within_limit";
  return {
    ...goal,
    status,
    usage: Number.isFinite(usage) ? usage : 0,
    coveredDays,
    totalDays,
  };
}

export const badgeStatusLabels: Record<GoalBadgeStatus, string> = {
  achieved: "Goal achieved",
  within_limit: "Within limit so far",
  exceeded: "Limit exceeded",
  insufficient_data: "Insufficient data",
  no_data: "No data",
  upcoming: "Not started",
};

// Usage colour and earned achievement are independent: partial data may be under the limit.
export function goalUsageIndicator(badge: GoalBadge): {
  color: "green" | "red" | "grey";
  label: string;
} {
  if (badge.status === "upcoming")
    return { color: "grey", label: "Not started" };
  if (
    badge.coveredDays <= 0 ||
    badge.totalDays <= 0 ||
    !Number.isFinite(badge.target) ||
    badge.target <= 0
  )
    return { color: "grey", label: "No data" };
  return badge.usage > badge.target
    ? { color: "red", label: "Limit exceeded" }
    : { color: "green", label: "Within recorded limit" };
}
