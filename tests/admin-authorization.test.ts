import assert from "node:assert/strict";
import test from "node:test";

import { getAdminAccessFailure } from "../src/features/admin/authorization.ts";

test("rejects unauthenticated administrator requests", () => {
  assert.deepEqual(getAdminAccessFailure({ authenticated: false }), {
    status: 401,
    code: "UNAUTHENTICATED",
    message: "You must sign in before using administrator features.",
  });
});

test("rejects household users and missing roles", () => {
  for (const role of ["household", null, undefined]) {
    assert.deepEqual(getAdminAccessFailure({ authenticated: true, role }), {
      status: 403,
      code: "FORBIDDEN",
      message: "Administrator access is required.",
    });
  }
});

test("returns a safe error when the role lookup fails", () => {
  assert.deepEqual(
    getAdminAccessFailure({
      authenticated: true,
      roleCheckFailed: true,
    }),
    {
      status: 500,
      code: "ROLE_CHECK_FAILED",
      message: "Unable to verify administrator access.",
    },
  );
});

test("allows a verified administrator role", () => {
  assert.equal(
    getAdminAccessFailure({ authenticated: true, role: "admin" }),
    null,
  );
});
