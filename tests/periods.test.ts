import test from "node:test";
import assert from "node:assert/strict";
import {
  adelaideToday,
  monthContaining,
  weekContaining,
  periodKind,
  periodOptions,
  validatePeriod,
  validatePeriodChange,
} from "../src/lib/periods.ts";

test("October goals offer current through final starting week, and current month only", () => {
  const today = "2026-10-09";
  assert.deepEqual(periodOptions("weekly", "2026-10", "goal", today), [
    { start: "2026-10-05", end: "2026-10-11" },
    { start: "2026-10-12", end: "2026-10-18" },
    { start: "2026-10-19", end: "2026-10-25" },
    { start: "2026-10-26", end: "2026-11-01" },
  ]);
  assert.deepEqual(periodOptions("monthly", "2026-10", "goal", today), [
    { start: "2026-10-01", end: "2026-10-31" },
  ]);
  assert.ok(
    validatePeriod({ start: "2026-11-02", end: "2026-11-08" }, "goal", today),
  );
  assert.ok(
    validatePeriod({ start: "2026-11-01", end: "2026-11-30" }, "goal", today),
  );
  assert.equal(
    validatePeriod(
      { start: "2027-11-01", end: "2027-11-30" },
      "challenge",
      today,
    ),
    null,
  );
});

test("current cross-month week remains selectable, expired weeks do not", () => {
  assert.deepEqual(
    periodOptions("weekly", "2026-10", "goal", "2026-10-01")[0],
    { start: "2026-09-28", end: "2026-10-04" },
  );
  assert.equal(
    validatePeriod(
      { start: "2026-09-28", end: "2026-10-04" },
      "goal",
      "2026-10-04",
    ),
    null,
  );
  assert.ok(
    validatePeriod(
      { start: "2026-09-28", end: "2026-10-04" },
      "challenge",
      "2026-10-05",
    ),
  );
});

test("rejects arbitrary ranges, fortnightly, invalid dates and partial months", () => {
  for (const range of [
    { start: "2026-10-06", end: "2026-10-12" },
    { start: "2026-09-28", end: "2026-10-11" },
    { start: "2026-10-01", end: "2026-10-30" },
    { start: "2026-02-01", end: "2026-02-29" },
    { start: "bad", end: "2026-10-31" },
    { start: "2026-10-05", end: "2026-10-04" },
  ])
    assert.ok(validatePeriod(range, "challenge", "2026-01-01"));
});

test("calendar weeks cross years and February follows leap-year rules", () => {
  assert.deepEqual(weekContaining("2027-01-01"), {
    start: "2026-12-28",
    end: "2027-01-03",
  });
  assert.deepEqual(monthContaining("2028-02-15"), {
    start: "2028-02-01",
    end: "2028-02-29",
  });
  assert.equal(
    periodKind({ start: "2028-02-01", end: "2028-02-29" }),
    "monthly",
  );
  assert.equal(
    validatePeriod(
      { start: "2026-12-28", end: "2027-01-03" },
      "goal",
      "2026-12-30",
    ),
    null,
  );
  assert.equal(
    validatePeriod(
      { start: "2026-12-28", end: "2027-01-03" },
      "goal",
      "2027-01-01",
    ),
    null,
  );
});

test("uses Adelaide date at midnight in standard time and daylight time", () => {
  assert.equal(adelaideToday(new Date("2026-10-08T13:29:59Z")), "2026-10-08");
  assert.equal(adelaideToday(new Date("2026-10-08T13:30:00Z")), "2026-10-09");
  assert.equal(adelaideToday(new Date("2026-07-08T14:29:59Z")), "2026-07-08");
  assert.equal(adelaideToday(new Date("2026-07-08T14:30:00Z")), "2026-07-09");
  assert.deepEqual(
    weekContaining(adelaideToday(new Date("2026-10-03T18:00:00Z"))),
    { start: "2026-09-28", end: "2026-10-04" },
  );
});

test("only unchanged stored dates are preserved on edits", () => {
  const existing = { start: "2026-09-02", end: "2026-09-17" };
  assert.equal(
    validatePeriodChange(existing, existing, "goal", "2026-10-09"),
    null,
  );
  assert.ok(validatePeriodChange(existing, undefined, "goal", "2026-10-09"));
  assert.ok(
    validatePeriodChange(
      { ...existing, end: "2026-09-18" },
      existing,
      "goal",
      "2026-10-09",
    ),
  );
  assert.equal(
    validatePeriodChange(
      { start: "2026-10-05", end: "2026-10-11" },
      existing,
      "goal",
      "2026-10-09",
    ),
    null,
  );
});
