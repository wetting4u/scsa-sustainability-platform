import assert from "node:assert/strict";
import test from "node:test";

import {
  validateCreateAdminUser,
  validateUpdateAdminUser,
} from "../src/features/admin-users/domain.ts";

test("accepts and normalizes an administrator-created household account", () => {
  assert.deepEqual(
    validateCreateAdminUser({
      email: "  Household@Example.com ",
      password: "Strong1!",
      householdName: "  Green household ",
      householdSize: 3,
    }),
    {
      data: {
        email: "household@example.com",
        password: "Strong1!",
        householdName: "Green household",
        householdSize: 3,
      },
      error: null,
    },
  );
});

test("requires the same strong password rules as normal registration", () => {
  for (const password of [
    "Short1!",
    "lowercase1!",
    "UPPERCASE1!",
    "NoNumber!",
    "NoSpecial1",
  ]) {
    assert.equal(
      validateCreateAdminUser({
        email: "household@example.com",
        password,
        householdName: "Green household",
        householdSize: 3,
      }).error?.code,
      "INVALID_PASSWORD",
    );
  }
});

test("rejects role, password, ownership, and unknown management fields", () => {
  for (const input of [
    { role: "admin" },
    { password: "Replacement1!" },
    { userId: "another-user" },
    { user_id: "another-user" },
    { shareAnalytics: true },
  ]) {
    assert.equal(
      validateUpdateAdminUser(input).error?.code,
      "UNSUPPORTED_FIELD",
    );
  }
});

test("accepts only valid editable account fields", () => {
  assert.deepEqual(
    validateUpdateAdminUser({
      email: " Updated@Example.com ",
      householdName: " Updated household ",
      householdSize: 5,
      disabled: true,
    }),
    {
      data: {
        email: "updated@example.com",
        householdName: "Updated household",
        householdSize: 5,
        disabled: true,
      },
      error: null,
    },
  );

  for (const input of [
    {},
    { email: 123 },
    { householdName: " " },
    { householdSize: 2.5 },
    { disabled: "true" },
  ]) {
    assert.notEqual(validateUpdateAdminUser(input).error, null);
  }
});

test("rejects sensitive household names before administrator create and update", () => {
  for (const householdName of [
    "bitch",
    "BITCH",
    "BiTch",
    "The FUCK household",
    "Women ARE inferior",
  ]) {
    const create = validateCreateAdminUser({
      email: "household@example.com",
      password: "Strong1!",
      householdName,
      householdSize: 3,
    });
    const update = validateUpdateAdminUser({ householdName });
    for (const result of [create, update]) {
      assert.equal(result.data, null);
      assert.equal(result.error?.code, "SENSITIVE_WORD");
    }
  }
});

test("preserves normal names and does not apply content checks to credentials", () => {
  assert.equal(
    validateCreateAdminUser({
      email: "bitch@example.com",
      password: "Bitch123!",
      householdName: "Spice household",
      householdSize: 3,
    }).error,
    null,
  );
  assert.equal(
    validateUpdateAdminUser({ email: "bitch@example.com" }).error,
    null,
  );
  assert.equal(
    validateUpdateAdminUser({ householdName: "Spicy household" }).error,
    null,
  );
});
