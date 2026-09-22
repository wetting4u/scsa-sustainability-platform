import {
  resources,
  totalFor,
  type UsageRecord,
  type Goal,
  type GoalUsage,
} from "../records/domain.ts";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function invalid(message: string): never {
  throw new ApiError(400, "INVALID_INPUT", message);
}
export function uuid(value: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    invalid("Invalid identifier.");
  return value;
}
function validDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < "0001-01-01" ||
    value > "9999-12-31"
  )
    return false;
  const date = new Date(value + "T00:00:00Z");
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
// PATCH deliberately accepts the same complete input as POST, like Records.
export function parseGoal(value: unknown): Omit<Goal, "id"> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid("Expected a JSON object.");
  const v = value as Record<string, unknown>;
  if (
    Object.keys(v).some(
      (k) => !["title", "resource", "target", "start", "end"].includes(k),
    )
  )
    invalid("Unknown or protected field.");
  if (
    typeof v.title !== "string" ||
    !v.title.trim() ||
    [...v.title.trim()].length > 120
  )
    invalid("Title must contain 1–120 characters.");
  if (typeof v.resource !== "string" || !Object.hasOwn(resources, v.resource))
    invalid("Invalid resource.");
  const resource = v.resource as Goal["resource"];
  if (
    typeof v.target !== "number" ||
    !Number.isFinite(v.target) ||
    v.target <= 0 ||
    v.target > resources[resource].max
  )
    invalid("Target is outside the allowed range.");
  if (!validDate(v.start) || !validDate(v.end) || v.end < v.start)
    invalid("Enter valid dates in ascending order.");
  return {
    title: v.title.trim(),
    resource,
    target: v.target,
    start: v.start,
    end: v.end,
  };
}
export function goalUsage(goal: Goal, records: UsageRecord[]): GoalUsage {
  const matching = records.filter(
    (r) =>
      r.resource === goal.resource &&
      r.start >= goal.start &&
      r.end <= goal.end,
  );
  const amount = totalFor(matching, goal.resource, goal.start, goal.end);
  return {
    amount,
    recordCount: matching.length,
    hasRecords: matching.length > 0,
    percentUsed: matching.length ? (amount / goal.target) * 100 : null,
    status:
      matching.length === 0
        ? "no_records"
        : amount > goal.target
          ? "over_limit"
          : "within_recorded_limit",
  };
}
