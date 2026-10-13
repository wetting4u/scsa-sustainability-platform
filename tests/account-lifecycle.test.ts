import assert from "node:assert/strict";
import test from "node:test";

import { withAccountFrozenMetadata } from "../src/features/account/lifecycle.ts";
import {
  getAccountAccessFailure,
  isAccountFrozen,
} from "../src/features/auth/authorization.ts";

test("freezes an account without removing existing app metadata", () => {
  const metadata = withAccountFrozenMetadata(
    { provider: "email", existing: "kept" },
    true,
    new Date("2026-10-13T00:00:00Z"),
  );

  assert.deepEqual(metadata, {
    provider: "email",
    existing: "kept",
    account_frozen: true,
    account_frozen_at: "2026-10-13T00:00:00.000Z",
  });
  assert.equal(isAccountFrozen(metadata), true);
});

test("unfreezes an account while preserving identity metadata", () => {
  const metadata = withAccountFrozenMetadata(
    { account_frozen: true, account_frozen_at: "old", existing: "kept" },
    false,
  );

  assert.equal(metadata.account_frozen, false);
  assert.equal(metadata.account_frozen_at, null);
  assert.equal(metadata.existing, "kept");
  assert.equal(isAccountFrozen(metadata), false);
});

test("blocks frozen accounts with a dedicated error", () => {
  assert.deepEqual(
    getAccountAccessFailure({ authenticated: true, accountFrozen: true }),
    {
      status: 403,
      code: "ACCOUNT_FROZEN",
      message: "This account is frozen. Unfreeze it before continuing.",
    },
  );
});

test("administrator disable takes precedence over self freeze", () => {
  assert.deepEqual(
    getAccountAccessFailure({
      authenticated: true,
      accountFrozen: true,
      bannedUntil: "2099-01-01T00:00:00Z",
      now: Date.parse("2026-10-13T00:00:00Z"),
    })?.code,
    "ACCOUNT_DISABLED",
  );
});
