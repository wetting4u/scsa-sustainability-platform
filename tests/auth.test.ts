import assert from "node:assert/strict";
import test from "node:test";

import {
  authErrorMessage,
  isStrongPassword,
  passwordRequirements,
} from "../src/features/auth/domain.ts";

test("registration password rules match the sign-up guidance", () => {
  assert.equal(isStrongPassword("Strong1!"), true);
  assert.equal(isStrongPassword("short1!"), false);
  assert.equal(isStrongPassword("lowercase1!"), false);
  assert.equal(isStrongPassword("UPPERCASE1!"), false);
  assert.equal(isStrongPassword("NoNumber!"), false);
  assert.equal(isStrongPassword("NoSpecial1"), false);

  assert.deepEqual(
    passwordRequirements("Strong1!").map((requirement) => requirement.valid),
    [true, true, true, true, true],
  );
});

test("authentication errors are stable and do not expose provider details", () => {
  assert.equal(
    authErrorMessage({ code: "email_not_confirmed" }, "fallback"),
    "Confirm your email before signing in.",
  );
  assert.equal(
    authErrorMessage({ code: "otp_expired" }, "fallback"),
    "The verification code is invalid or expired.",
  );
  assert.equal(
    authErrorMessage({ status: 429 }, "fallback"),
    "Too many attempts. Please wait and try again.",
  );
  assert.equal(
    authErrorMessage(
      { code: "unknown", message: "Sensitive provider detail" },
      "Safe fallback",
    ),
    "Safe fallback",
  );
});
