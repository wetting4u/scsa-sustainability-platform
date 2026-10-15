import assert from "node:assert/strict";
import test from "node:test";

import {
  findSensitiveWord,
  SENSITIVE_WORDS,
  validateAllowedValue,
  validateNumberRange,
  validateText,
} from "../src/lib/validation/index.ts";

test("validates trimmed text length and format", () => {
  assert.deepEqual(
    validateText("  ABC-123  ", {
      field: "Reference",
      minLength: 3,
      maxLength: 12,
      pattern: /^[A-Z]+-\d+$/,
    }),
    { ok: true, value: "ABC-123" },
  );
  assert.equal(validateText("ab", { field: "Name", minLength: 3 }).ok, false);
  assert.equal(
    validateText("toolong", { field: "Name", maxLength: 4 }).ok,
    false,
  );
  assert.equal(
    validateText("not valid", {
      field: "Reference",
      pattern: /^[A-Z]+-\d+$/,
    }).ok,
    false,
  );
});

test("validates finite integer number ranges", () => {
  assert.deepEqual(
    validateNumberRange(20, {
      field: "Household size",
      min: 1,
      max: 20,
      integer: true,
    }),
    { ok: true, value: 20 },
  );
  assert.equal(
    validateNumberRange(21, { field: "Value", min: 1, max: 20 }).ok,
    false,
  );
  assert.equal(
    validateNumberRange(1.5, { field: "Value", integer: true }).ok,
    false,
  );
  assert.equal(validateNumberRange(Number.NaN, { field: "Value" }).ok, false);
});

test("validates values against an explicit allow-list", () => {
  const resources = ["water", "electricity", "waste"] as const;

  assert.deepEqual(validateAllowedValue("water", resources, "Resource"), {
    ok: true,
    value: "water",
  });
  assert.equal(validateAllowedValue("gas", resources, "Resource").ok, false);
});

test("blocks approved terms regardless of letter case", () => {
  for (const word of SENSITIVE_WORDS) {
    assert.equal(findSensitiveWord(word.toUpperCase()), word);
  }
  for (const input of ["bitch", "BITCH", "BiTch", "You are a BiTch!"]) {
    assert.deepEqual(validateText(input, { field: "Title" }), {
      ok: false,
      code: "SENSITIVE_WORD",
      message: "Title contains a disallowed term.",
    });
  }
});

test("matches complete words and phrases without blocking ordinary words", () => {
  for (const input of [
    "spice",
    "spicy",
    "Scunthorpe",
    "shitake",
    "bitchin",
    "black",
    "women",
    "gay",
    "transgender",
  ]) {
    assert.equal(findSensitiveWord(input), null);
  }
  assert.equal(findSensitiveWord("(BITCH)"), "bitch");
  assert.equal(
    findSensitiveWord("Women   BELONG\nin the Kitchen!"),
    "women belong in the kitchen",
  );
  assert.equal(findSensitiveWord("women are inferiorities"), null);
});

test("supports custom lists and treats their regex characters literally", () => {
  assert.equal(findSensitiveWord("A blocked phrase", ["blocked"]), "blocked");
  assert.equal(
    validateText("A blocked phrase", {
      field: "Title",
      sensitiveWords: ["blocked"],
    }).ok,
    false,
  );
  assert.equal(findSensitiveWord("bitch", []), null);
  assert.equal(findSensitiveWord("(a+b)", ["a+b"]), "a+b");
  assert.equal(findSensitiveWord("aaab", ["a+b"]), null);
  assert.equal(findSensitiveWord("anything", [" "]), null);
});
