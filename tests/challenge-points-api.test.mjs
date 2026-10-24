import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Exercise real services without cloud credentials or writes. Auth is the only
// business dependency replaced; any attempted database access fails the test.
const authSource = `export async function requireActiveUser() { return globalThis.__pointsAuth; } export const requireAdmin = requireActiveUser;`;
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
const { createAdminChallenge, updateAdminChallenge } =
  await import("../src/features/challenges/server/admin-service.ts");
const { claimChallengeReward, listChallengeRewards, listChallenges } =
  await import("../src/features/challenges/server/service.ts");
const { GET: leaderboard } =
  await import("../src/app/api/community/leaderboard/route.ts");
const { monthContaining, adelaideToday } =
  await import("../src/lib/periods.ts");
const input = {
  title: "Save water",
  description: "Save together",
  resource: "water",
  target: 100,
  ...monthContaining(adelaideToday()),
  tag: "WATER",
  icon: "drop",
  rewardPoints: 50,
};
const request = (body) =>
  new Request("http://localhost/api/admin/challenges", {
    method: "POST",
    body: JSON.stringify(body),
  });
const id = "30000000-0000-4000-8000-000000000001";

test("unauthenticated requests cannot award points or read rankings", async () => {
  globalThis.__pointsAuth = {
    ok: false,
    response: new Response(null, { status: 401 }),
  };
  assert.equal((await claimChallengeReward(id)).status, 401);
  assert.equal((await listChallengeRewards()).status, 401);
  assert.equal(
    (
      await leaderboard(
        new Request("http://localhost/api/community/leaderboard"),
      )
    ).status,
    401,
  );
  assert.equal((await createAdminChallenge(request(input))).status, 401);
});
test("admin points are required bounded whole numbers", async () => {
  globalThis.__pointsAuth = {
    ok: true,
    supabase: {
      from() {
        throw Error("DB should not be accessed");
      },
    },
  };
  for (const rewardPoints of [undefined, null, "50", true, -1, 0.5, 1000001]) {
    assert.equal(
      (await createAdminChallenge(request({ ...input, rewardPoints }))).status,
      400,
    );
    assert.equal(
      (await updateAdminChallenge(request({ ...input, rewardPoints }), id))
        .status,
      400,
    );
  }
});
test("admin persists points and the list returns them", async () => {
  let written;
  const row = {
    id,
    title: input.title,
    description: input.description,
    resource: "water",
    target: 100,
    start_date: input.start,
    end_date: input.end,
    tag: input.tag,
    icon: "drop",
    reward_points: 50,
    min_household_size: null,
    max_household_size: null,
  };
  const builder = {
    insert(value) {
      written = value;
      return this;
    },
    select() {
      return this;
    },
    single: async () => ({ data: row }),
    order: async () => ({ data: [row] }),
  };
  globalThis.__pointsAuth = { ok: true, supabase: { from: () => builder } };
  const result = await createAdminChallenge(request(input));
  assert.equal(result.status, 201);
  assert.equal(written.reward_points, 50);
  assert.equal((await result.json()).data.rewardPoints, 50);
  assert.equal(
    (await (await listChallenges()).json()).data[0].rewardPoints,
    50,
  );
});
test("claim trusts DB completion result and rejects failures", async () => {
  let status = "incomplete_data";
  globalThis.__pointsAuth = {
    ok: true,
    supabase: {
      rpc: async (name, args) => {
        assert.equal(name, "claim_challenge_reward");
        assert.deepEqual(args, { p_challenge_id: id });
        return { data: { status, points: 50 } };
      },
    },
  };
  assert.equal((await claimChallengeReward("invalid")).status, 400);
  assert.equal((await claimChallengeReward(id)).status, 409);
  for (const next of ["awarded", "already_awarded"]) {
    status = next;
    const result = await claimChallengeReward(id);
    assert.equal(result.status, 200);
    assert.equal((await result.json()).data.points, 50);
  }
});
test("leaderboard validates period and returns database entries", async () => {
  let calls = 0;
  globalThis.__pointsAuth = {
    ok: true,
    supabase: {
      rpc: async (name, args) => {
        calls++;
        assert.equal(name, "get_resource_leaderboard");
        assert.deepEqual(args, { p_period_type: "weekly" });
        return { data: { entries: [] } };
      },
    },
  };
  assert.equal(
    (
      await leaderboard(
        new Request("http://localhost/api/community/leaderboard?period=bad"),
      )
    ).status,
    400,
  );
  assert.equal(calls, 0);
  const result = await leaderboard(
    new Request("http://localhost/api/community/leaderboard"),
  );
  assert.equal(result.status, 200);
  assert.deepEqual((await result.json()).data.entries, []);
});

test("records for progress include all pages and fail closed on partial query errors", async () => {
  const { listRecords } =
    await import("../src/features/records/server/service.ts");
  let fail = false;
  const records = Array.from({ length: 3 }, (_, i) => ({
    id: String(i),
    resource: "water",
    start_date: "2026-10-01",
    end_date: "2026-10-01",
    amount: "10",
  }));
  const query = {
    select() {
      return this;
    },
    eq(key, value) {
      assert.equal(key, "user_id");
      assert.equal(value, "alice");
      return this;
    },
    order() {
      return this;
    },
    range: async (start) =>
      fail && start > 0
        ? { error: { message: "failure" } }
        : { data: records.slice(start, start + 2) },
  };
  globalThis.__pointsAuth = {
    ok: true,
    userId: "alice",
    supabase: { from: () => query },
  };
  const response = await listRecords();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.length, 3);
  fail = true;
  assert.equal((await listRecords()).status, 500);
});
