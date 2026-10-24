import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Exercise real services without cloud credentials or writes. Auth is the only
// business dependency replaced; any attempted database access fails the test.
const authSource = `export async function requireActiveUser() { return globalThis.__badgeAuth; }`;
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
const { listGoalBadges } =
  await import("../src/features/badges/server/service.ts");
const goal = {
  id: "g1",
  user_id: "alice",
  title: "Private goal",
  resource: "water",
  target: 100,
  start_date: "2026-01-01",
  end_date: "2026-01-07",
};
const record = {
  id: "r1",
  user_id: "alice",
  resource: "water",
  amount: 100,
  start_date: "2026-01-01",
  end_date: "2026-01-07",
};
function authorize(rows, fail = false) {
  const calls = [];
  globalThis.__badgeAuth = {
    ok: true,
    userId: "alice",
    supabase: {
      from(table) {
        let owner;
        const query = {
          select() {
            return query;
          },
          eq(field, value) {
            assert.equal(field, "user_id");
            owner = value;
            return query;
          },
          order(field) {
            assert.equal(field, "id");
            return query;
          },
          async range(start) {
            assert.equal(owner, "alice");
            calls.push({ table, start });
            return fail
              ? { error: new Error("query failed") }
              : {
                  data: rows[table]
                    .filter((r) => r.user_id === owner)
                    .slice(start, start + 2),
                  error: null,
                };
          },
        };
        return query;
      },
    },
  };
  return calls;
}
test("rejects unauthenticated and disabled accounts before querying", async () => {
  for (const status of [401, 403]) {
    globalThis.__badgeAuth = {
      ok: false,
      response: Response.json({ error: { code: "DENIED" } }, { status }),
    };
    assert.equal((await listGoalBadges()).status, status);
  }
});
test("reads only own rows and includes every page, even with a small server page cap", async () => {
  const calls = authorize({
    goals: [
      goal,
      { ...goal, id: "g2" },
      { ...goal, id: "g3" },
      { ...goal, id: "other", user_id: "bob" },
    ],
    usage_records: [
      record,
      { ...record, id: "other", user_id: "bob", amount: 999 },
    ],
  });
  const response = await listGoalBadges();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const body = await response.json();
  assert.equal(body.data.length, 3);
  assert.ok(body.data.every((b) => b.status === "achieved" && b.usage === 100));
  assert.ok(calls.some((c) => c.table === "goals" && c.start === 2));
});
test("query errors fail closed instead of showing a badge or zero usage", async () => {
  authorize({ goals: [goal], usage_records: [record] }, true);
  const response = await listGoalBadges();
  assert.equal(response.status, 500);
  assert.equal((await response.json()).error.code, "BADGES_QUERY_FAILED");
});
test("new requests recalculate source changes and deletion without cached awards", async () => {
  authorize({ goals: [goal], usage_records: [record] });
  assert.equal(
    (await (await listGoalBadges()).json()).data[0].status,
    "achieved",
  );
  authorize({ goals: [goal], usage_records: [{ ...record, amount: 101 }] });
  assert.equal(
    (await (await listGoalBadges()).json()).data[0].status,
    "exceeded",
  );
  authorize({ goals: [], usage_records: [record] });
  assert.deepEqual((await (await listGoalBadges()).json()).data, []);
});
