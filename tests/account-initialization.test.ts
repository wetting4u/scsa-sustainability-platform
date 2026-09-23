import assert from "node:assert/strict";
import test from "node:test";

import { inspectAccountInitialization } from "../src/features/account/domain.ts";

const userId = "10000000-0000-4000-8000-000000000001";

test("accepts a new household account with private defaults", () => {
  assert.deepEqual(
    inspectAccountInitialization(
      userId,
      {
        user_id: userId,
        share_analytics: false,
        display_leaderboard: false,
      },
      {
        user_id: userId,
        role: "household",
      },
    ),
    {
      ready: true,
      checks: {
        profileExists: true,
        roleExists: true,
        householdRole: true,
        analyticsPrivate: true,
        leaderboardPrivate: true,
      },
    },
  );
});

test("rejects missing initialization rows", () => {
  const status = inspectAccountInitialization(userId, null, null);

  assert.equal(status.ready, false);
  assert.equal(status.checks.profileExists, false);
  assert.equal(status.checks.roleExists, false);
});

test("rejects elevated roles and non-private defaults", () => {
  const status = inspectAccountInitialization(
    userId,
    {
      user_id: userId,
      share_analytics: true,
      display_leaderboard: true,
    },
    {
      user_id: userId,
      role: "admin",
    },
  );

  assert.equal(status.ready, false);
  assert.equal(status.checks.householdRole, false);
  assert.equal(status.checks.analyticsPrivate, false);
  assert.equal(status.checks.leaderboardPrivate, false);
});
