import assert from "node:assert/strict";
import test from "node:test";
import { evaluateChallengeProgress } from "../src/features/challenges/progress.ts";
import type { Challenge } from "../src/features/challenges/domain.ts";
import type { UsageRecord } from "../src/features/records/domain.ts";
const challenge: Challenge = {
  id: "c",
  title: "Save",
  description: "Save water",
  resource: "water",
  target: 100,
  start: "2026-10-05",
  end: "2026-10-11",
  tag: "TEST",
  icon: "drop",
  duration: "7 days",
  rewardPoints: 25,
};
const record: UsageRecord = {
  id: "r",
  resource: "water",
  start: challenge.start,
  end: challenge.end,
  amount: 100,
};
const progress = (records: UsageRecord[], today = "2026-10-12") =>
  evaluateChallengeProgress(challenge, records, undefined, today);

test("joined challenge progress distinguishes upcoming, no records, ongoing and achieved", () => {
  assert.equal(progress([], "2026-10-04").status, "upcoming");
  assert.equal(progress([], "2026-10-08").status, "no_data");
  assert.equal(progress([record], "2026-10-11").status, "within_limit");
  assert.equal(progress([record], "2026-10-11").canClaim, false);
  const achieved = progress([record]);
  assert.equal(achieved.status, "achieved");
  assert.equal(achieved.canClaim, true);
  assert.equal(achieved.coveredDays, 7);
  assert.equal(achieved.percentage, 100);
});
test("missing days and partial overlap never display achieved", () => {
  assert.equal(progress([]).status, "incomplete");
  assert.equal(
    progress([{ ...record, end: "2026-10-10", amount: 50 }]).status,
    "incomplete",
  );
  const partial = progress([{ ...record, start: "2026-10-04" }]);
  assert.equal(partial.coveredDays, 0);
  assert.equal(partial.canClaim, false);
  assert.equal(
    progress([{ ...record, resource: "waste" }]).status,
    "incomplete",
  );
});
test("above-limit usage is red and explicit complete zero usage can qualify", () => {
  const exceeded = progress([{ ...record, amount: 120 }]);
  assert.equal(exceeded.status, "exceeded");
  assert.equal(exceeded.percentage, 120);
  assert.equal(exceeded.canClaim, false);
  assert.equal(progress([{ ...record, amount: 0 }]).status, "achieved");
});
test("awarded snapshot stays completed after edits and points configuration gates claiming", () => {
  const completed = evaluateChallengeProgress(
    challenge,
    [{ ...record, amount: 200 }],
    { points: 15 },
    "2026-10-12",
  );
  assert.equal(completed.status, "completed");
  assert.equal(completed.awardedPoints, 15);
  assert.equal(completed.canClaim, false);
  const unconfigured = evaluateChallengeProgress(
    { ...challenge, rewardPoints: null },
    [record],
    undefined,
    "2026-10-12",
  );
  assert.equal(unconfigured.status, "achieved");
  assert.equal(unconfigured.canClaim, false);
});
