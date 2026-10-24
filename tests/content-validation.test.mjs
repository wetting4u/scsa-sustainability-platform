import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Exercise real services without cloud credentials or writes. Auth is the only
// business dependency replaced; any attempted database access fails the test.
const authSource = `
const supabase = { from() { throw new Error("DATABASE_REACHED"); } };
export async function requireActiveUser() { return { ok: true, userId: "test-user", supabase }; }
export const requireAdmin = requireActiveUser;
export function tryCreateAdminClient() { throw new Error("DATABASE_REACHED"); }
`;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only")
      return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (
      [
        "@/features/auth/server/authorization",
        "@/features/admin/server/authorization",
        "@/lib/supabase/admin",
      ].includes(specifier)
    ) {
      return {
        url: `data:text/javascript,${encodeURIComponent(authSource)}`,
        shortCircuit: true,
      };
    }
    if (specifier.startsWith("@/"))
      specifier = pathToFileURL(resolve("src", specifier.slice(2))).href;
    if (specifier.startsWith("file:") || specifier.startsWith(".")) {
      const url = new URL(specifier, context.parentURL);
      if (
        !existsSync(fileURLToPath(url)) &&
        existsSync(fileURLToPath(url) + ".ts")
      )
        url.pathname += ".ts";
      return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".ts"))
      return {
        format: "module",
        shortCircuit: true,
        source: stripTypeScriptTypes(readFileSync(new URL(url), "utf8"), {
          mode: "transform",
        }),
      };
    return nextLoad(url, context);
  },
});
const { validateGoalTitle, validateChallengeText } =
  await import("../src/lib/validation/content.ts");
const { createGoal, updateGoal } =
  await import("../src/features/goals/server/service.ts");
const { createAdminChallenge, updateAdminChallenge } =
  await import("../src/features/challenges/server/admin-service.ts");
const { goalsApi } = await import("../src/features/goals/client.ts");
const { adminChallengesApi } =
  await import("../src/features/challenges/client.ts");
const { monthContaining, adelaideToday } =
  await import("../src/lib/periods.ts");
const range = monthContaining(adelaideToday());
const goal = {
  title: "Use less water",
  resource: "water",
  target: 100,
  ...range,
};
const challenge = {
  ...goal,
  rewardPoints: 50,
  description: "Save water together",
  tag: "WATER SAVERS",
  icon: "drop",
};
const request = (body) =>
  new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const cases = [
  [
    "goal create",
    (b) => createGoal(request(b)),
    (b) => goalsApi.create(b),
    goal,
    "title",
  ],
  [
    "goal edit",
    (b) => updateGoal(request(b), "test-id"),
    (b) => goalsApi.update("test-id", b),
    goal,
    "title",
  ],
  ...["title", "description", "tag"].flatMap((field) => [
    [
      `challenge create ${field}`,
      (b) => createAdminChallenge(request(b)),
      (b) => adminChallengesApi.create(b),
      challenge,
      field,
    ],
    [
      `challenge edit ${field}`,
      (b) => updateAdminChallenge(request(b), "test-id"),
      (b) => adminChallengesApi.update("test-id", b),
      challenge,
      field,
    ],
  ]),
];
for (const [name, server, client, body, field] of cases) {
  test(`${name}: browser and direct API reject blocked content before I/O`, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => {
      throw new Error("NETWORK_REACHED");
    };
    try {
      for (const blocked of ["FUCK", "go back   to your country"]) {
        const invalid = { ...body, [field]: blocked };
        await assert.rejects(
          () => client(invalid),
          /contains a sensitive term/,
        );
        const response = await server(invalid);
        assert.equal(response.status, 400);
        assert.match(
          (await response.json()).error.message,
          /contains a sensitive term/,
        );
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  test(`${name}: valid text reaches storage and browser submits normalized values`, async () => {
    await assert.rejects(() => server(body), /DATABASE_REACHED/);
    const originalFetch = globalThis.fetch;
    let submitted;
    globalThis.fetch = async (_url, options) => {
      submitted = JSON.parse(options.body);
      return Response.json({ data: {} });
    };
    try {
      await client({ ...body, [field]: `  ${body[field]}  ` });
      assert.equal(submitted[field], body[field]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test("field validators enforce types and boundaries without substring false positives", () => {
  for (const validator of [validateGoalTitle]) {
    for (const value of [undefined, null, 123, [], {}, " "])
      assert.equal(validator(value).ok, false);
    assert.equal(validator("Scunthorpe household").ok, true);
  }
  assert.equal(validateGoalTitle("a".repeat(80)).ok, true);
  assert.equal(validateGoalTitle("a".repeat(81)).ok, false);
  for (const [field, max] of [
    ["title", 100],
    ["description", 500],
    ["tag", 50],
  ]) {
    assert.equal(
      validateChallengeText({ ...challenge, [field]: "a".repeat(max) }).ok,
      true,
    );
    assert.equal(
      validateChallengeText({ ...challenge, [field]: "a".repeat(max + 1) }).ok,
      false,
    );
    assert.equal(
      validateChallengeText({ ...challenge, [field]: {} }).ok,
      false,
    );
  }
});
