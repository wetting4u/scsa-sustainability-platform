import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ApiError,
  parseGoal,
  goalUsage,
  uuid,
} from "../src/features/goals/domain.ts";
const input = {
  title: " Water ",
  resource: "water",
  target: 100,
  start: "2026-09-01",
  end: "2026-09-30",
};
test("goal validation rejects impossible dates, protected fields and unsafe values", () => {
  assert.equal(parseGoal(input).title, "Water");
  for (const patch of [
    { start: "2026-02-30" },
    { start: "2025-02-29" },
    { end: "2026-08-01" },
    { start: "0000-01-01" },
    { resource: "toString" },
    { resource: "gas" },
    { target: "100" },
    { target: Infinity },
    { target: 0 },
    { target: -1 },
    { target: 10000001 },
    { title: " " },
    { title: "x".repeat(121) },
    { user_id: "another-user" },
  ]) {
    assert.throws(() => parseGoal({ ...input, ...patch }), ApiError);
  }
  for (const v of [null, [], "text", 1])
    assert.throws(() => parseGoal(v), ApiError);
  assert.equal(
    parseGoal({ ...input, start: "2024-02-29" }).start,
    "2024-02-29",
  );
  assert.throws(() => uuid("c1"), ApiError);
});
test("usage distinguishes missing from zero and excludes partial periods and other resources", () => {
  const goal = { id: "goal", ...parseGoal(input) };
  assert.deepEqual(goalUsage(goal, []), {
    amount: 0,
    recordCount: 0,
    hasRecords: false,
    percentUsed: null,
    status: "no_records",
  });
  const record = {
    id: "r",
    resource: "water" as const,
    start: input.start,
    end: input.end,
    amount: 0,
  };
  assert.equal(goalUsage(goal, [record]).status, "within_recorded_limit");
  const result = goalUsage(goal, [
    { ...record, amount: 101 },
    { ...record, resource: "waste", amount: 500 },
    { ...record, start: "2026-08-31", amount: 900 },
  ]);
  assert.equal(result.amount, 101);
  assert.equal(result.recordCount, 1);
  assert.equal(result.status, "over_limit");
});
