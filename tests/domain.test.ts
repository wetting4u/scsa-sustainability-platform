import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRecord, totalFor } from "../src/features/records/domain.ts";
test("rejects invalid dates, reversed periods and invalid amounts", () => {
  const valid = {
    resource: "water" as const,
    start: "2026-09-01",
    end: "2026-09-07",
    amount: 150,
  };
  assert.equal(validateRecord(valid), null);
  for (const patch of [
    { amount: -1 },
    { amount: NaN },
    { amount: Infinity },
    { end: "2026-08-01" },
    { start: "not-a-date" },
  ])
    assert.ok(validateRecord({ ...valid, ...patch }));
});
test("totals keep resource units separate and exclude periods outside the window", () => {
  const records = [
    {
      id: "1",
      resource: "electricity" as const,
      start: "2026-09-01",
      end: "2026-09-07",
      amount: 10,
    },
    {
      id: "2",
      resource: "water" as const,
      start: "2026-09-01",
      end: "2026-09-07",
      amount: 100,
    },
    {
      id: "3",
      resource: "electricity" as const,
      start: "2026-08-28",
      end: "2026-09-02",
      amount: 40,
    },
  ];
  assert.equal(totalFor(records, "electricity"), 10);
  assert.equal(totalFor(records, "water"), 100);
  assert.equal(totalFor([], "waste"), 0);
});
