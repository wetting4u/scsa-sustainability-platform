import assert from "node:assert/strict";
import test from "node:test";

import { validateProfilePatch } from "../src/features/privacy/domain.ts";

test("accepts and normalizes allowed profile changes", () => {
  assert.deepEqual(
    validateProfilePatch({
      displayName: "  Green household  ",
      householdSize: 4,
      shareAnalytics: true,
      displayLeaderboard: false,
    }),
    {
      data: {
        displayName: "Green household",
        householdSize: 4,
        shareAnalytics: true,
        displayLeaderboard: false,
      },
      error: null,
    },
  );
});

test("rejects empty, long, and invalid household values", () => {
  for (const input of [
    {},
    { displayName: "   " },
    { displayName: "a".repeat(61) },
    { householdSize: 0 },
    { householdSize: 2.5 },
    { householdSize: "3" },
  ]) {
    assert.notEqual(validateProfilePatch(input).error, null);
  }
});

test("requires boolean privacy preferences", () => {
  assert.notEqual(validateProfilePatch({ shareAnalytics: "true" }).error, null);
  assert.notEqual(validateProfilePatch({ displayLeaderboard: 1 }).error, null);
});

test("rejects ownership, role, pseudonym, and unknown fields", () => {
  for (const input of [
    { userId: "another-user" },
    { user_id: "another-user" },
    { role: "admin" },
    { pseudonym: "Real household name" },
    { unexpected: true },
  ]) {
    assert.notEqual(validateProfilePatch(input).error, null);
  }
});
