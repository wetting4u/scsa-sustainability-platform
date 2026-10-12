import assert from "node:assert/strict";
import test from "node:test";

import {
  getAccountAccessFailure,
  isAccountBanned,
} from "../src/features/auth/authorization.ts";
import { authErrorMessage } from "../src/features/auth/domain.ts";

const now = Date.parse("2026-10-12T00:00:00Z");

test("rejects requests without an authenticated account", () => {
  assert.deepEqual(getAccountAccessFailure({ authenticated: false }), {
    status: 401,
    code: "UNAUTHENTICATED",
    message: "You must sign in before using this feature.",
  });
});

test("fails closed when current account status cannot be verified", () => {
  assert.deepEqual(
    getAccountAccessFailure({
      authenticated: false,
      statusCheckFailed: true,
    }),
    {
      status: 503,
      code: "ACCOUNT_STATUS_UNAVAILABLE",
      message: "Account access cannot be verified right now.",
    },
  );
});

test("blocks a ban that expires in the future", () => {
  const bannedUntil = "2026-10-13T00:00:00Z";

  assert.equal(isAccountBanned(bannedUntil, now), true);
  assert.deepEqual(
    getAccountAccessFailure({ authenticated: true, bannedUntil, now }),
    {
      status: 403,
      code: "ACCOUNT_DISABLED",
      message: "This account has been disabled by an administrator.",
    },
  );
});

test("preserves a disabled response when the auth provider rejects the session", () => {
  assert.deepEqual(
    getAccountAccessFailure({
      authenticated: false,
      providerRejectedAsBanned: true,
    }),
    {
      status: 403,
      code: "ACCOUNT_DISABLED",
      message: "This account has been disabled by an administrator.",
    },
  );
});

test("allows restored and expired bans", () => {
  assert.equal(isAccountBanned(null, now), false);
  assert.equal(isAccountBanned("2026-10-11T00:00:00Z", now), false);
  assert.equal(
    getAccountAccessFailure({ authenticated: true, bannedUntil: null, now }),
    null,
  );
});

test("maps disabled login errors without exposing provider details", () => {
  assert.equal(
    authErrorMessage({ code: "user_banned" }, "fallback"),
    "This account has been disabled by an administrator.",
  );
});
