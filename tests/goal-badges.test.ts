import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateGoal,
  goalUsageIndicator,
} from "../src/features/badges/domain.ts";
import type { Goal, UsageRecord } from "../src/features/records/domain.ts";
const goal: Goal = {
  id: "g1",
  title: "Water goal",
  resource: "water",
  target: 100,
  start: "2026-10-05",
  end: "2026-10-11",
};
const record: UsageRecord = {
  id: "r1",
  resource: "water",
  amount: 100,
  start: goal.start,
  end: goal.end,
};
const evaluate = (records: UsageRecord[], today = "2026-10-12") =>
  evaluateGoal(goal, records, today);

test("awards at equality only after the Adelaide period ends", () => {
  assert.equal(evaluate([record], "2026-10-04").status, "upcoming");
  assert.equal(evaluate([record], "2026-10-11").status, "within_limit");
  assert.equal(evaluate([record]).status, "achieved");
  assert.equal(evaluate([{ ...record, amount: 100.01 }]).status, "exceeded");
});
test("requires full coverage; zero is valid only with explicit complete records", () => {
  assert.equal(evaluate([]).status, "no_data");
  assert.equal(evaluate([{ ...record, amount: 0 }]).status, "achieved");
  assert.equal(
    evaluate([{ ...record, end: "2026-10-10", amount: 0 }]).status,
    "insufficient_data",
  );
  const split = [
    { ...record, end: "2026-10-07", amount: 40 },
    { ...record, id: "r2", start: "2026-10-08", amount: 60 },
  ];
  assert.equal(evaluate(split).status, "achieved");
  assert.equal(
    evaluate([split[0], { ...split[1], start: "2026-10-09" }]).coveredDays,
    6,
  );
  assert.equal(
    evaluate([split[0], { ...split[1], start: "2026-10-09" }]).status,
    "insufficient_data",
  );
});
test("ignores other resources and excludes partial overlaps without granting a badge", () => {
  assert.equal(
    evaluate([{ ...record, resource: "electricity" }]).status,
    "no_data",
  );
  const month = { ...goal, start: "2026-10-01", end: "2026-10-31" };
  const records = [
    { ...record, start: "2026-10-01", end: "2026-10-25", amount: 20 },
    { ...record, id: "r2", start: "2026-10-26", end: "2026-11-01", amount: 10 },
  ];
  const result = evaluateGoal(month, records, "2026-11-01");
  assert.equal(result.usage, 20);
  assert.equal(result.coveredDays, 25);
  assert.equal(result.status, "insufficient_data");
});
test("invalid values and duplicate overlapping records cannot earn achievements", () => {
  assert.notEqual(evaluate([{ ...record, amount: NaN }]).status, "achieved");
  assert.notEqual(evaluate([{ ...record, amount: -1 }]).status, "achieved");
  assert.equal(
    evaluate([
      { ...record, amount: 1 },
      { ...record, id: "duplicate", amount: 1 },
    ]).status,
    "insufficient_data",
  );
  assert.equal(
    evaluateGoal({ ...goal, target: 0 }, [record], "2026-10-12").status,
    "insufficient_data",
  );
});
test("past achievements survive later periods but respond to source edits and deletes", () => {
  assert.equal(
    evaluate(
      [
        record,
        {
          ...record,
          id: "later",
          start: "2026-10-12",
          end: "2026-10-18",
          amount: 999,
        },
      ],
      "2026-11-01",
    ).status,
    "achieved",
  );
  assert.equal(evaluate([{ ...record, amount: 101 }]).status, "exceeded");
  assert.equal(evaluate([]).status, "no_data");
});
test("coverage works across leap days and year boundaries", () => {
  for (const [start, end, today, days] of [
    ["2028-02-01", "2028-02-29", "2028-03-01", 29],
    ["2026-12-28", "2027-01-03", "2027-01-04", 7],
  ] as const) {
    const result = evaluateGoal(
      { ...goal, start, end },
      [{ ...record, start, end }],
      today,
    );
    assert.equal(result.totalDays, days);
    assert.equal(result.status, "achieved");
  }
});

test("traffic lights show recorded usage independently from achievement", () => {
  const partial = evaluate([{ ...record, amount: 76, end: "2026-10-08" }]);
  assert.equal(partial.status, "insufficient_data");
  assert.deepEqual(goalUsageIndicator(partial), {
    color: "green",
    label: "Within recorded limit",
  });
  assert.equal(goalUsageIndicator(evaluate([record])).color, "green");
  assert.equal(
    goalUsageIndicator(evaluate([{ ...record, amount: 101 }])).color,
    "red",
  );
  assert.equal(goalUsageIndicator(evaluate([])).color, "grey");
  assert.equal(
    goalUsageIndicator(evaluate([record], "2026-10-04")).color,
    "grey",
  );
});
