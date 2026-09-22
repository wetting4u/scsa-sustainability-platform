import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { adapter } from "./helpers/adapter.mjs";
import * as goals from "../src/app/api/goals/route.ts";
import * as goal from "../src/app/api/goals/[goalId]/route.ts";
import * as challenges from "../src/app/api/challenges/route.ts";
import * as membership from "../src/app/api/challenges/[challengeId]/membership/route.ts";
import * as memberships from "../src/app/api/challenges/memberships/route.ts";
import {
  createRecord,
  listRecords,
  updateRecord,
  deleteRecord,
} from "../src/features/records/server/service.ts";
const req = (method = "GET", body, headers = {}) =>
  new Request("http://localhost/api/test", {
    method,
    headers: { "content-type": "application/json", ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const ctx = (key, id) => ({ params: Promise.resolve({ [key]: id }) });
const input = {
  title: "Water limit",
  resource: "water",
  target: 100,
  start: "2026-09-01",
  end: "2026-09-30",
};
test("household API routes with real PostgreSQL constraints and two-account RLS", async (t) => {
  const pg = new PGlite({ extensions: { btree_gist } });
  const a = "10000000-0000-4000-8000-000000000001",
    b = "10000000-0000-4000-8000-000000000002";
  const user = { id: a };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test";
  globalThis.__testSupabase = adapter(pg, user);
  try {
    await pg.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth,public to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values ('${a}'),('${b}');`,
    );
    for (const file of [
      "20260917000100_initial_schema.sql",
      "20260922000100_admin_challenge_management.sql",
    ])
      await pg.exec(
        await readFile(
          new URL("../supabase/migrations/" + file, import.meta.url),
          "utf8",
        ),
      );
    await pg.exec(
      await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8"),
    );
    let id, recordId;
    const cid = "00000000-0000-4000-8000-000000000001";
    await t.test(
      "config, unauthenticated and cross-origin requests fail safely",
      async () => {
        user.id = null;
        assert.equal((await goals.GET(req())).status, 401);
        user.id = a;
        assert.equal(
          (
            await goals.POST(
              req("POST", input, { origin: "https://other.invalid" }),
            )
          ).status,
          403,
        );
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        assert.equal((await goals.GET(req())).status, 503);
        process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.invalid";
      },
    );
    await t.test(
      "invalid inputs, protected fields and malformed JSON return 400",
      async () => {
        for (const patch of [
          { target: true },
          { target: 0 },
          { start: "2026-02-30" },
          { user_id: b },
        ])
          assert.equal(
            (await goals.POST(req("POST", { ...input, ...patch }))).status,
            400,
          );
        assert.equal(
          (
            await goals.POST(
              new Request("http://localhost/api/goals", {
                method: "POST",
                body: "{",
              }),
            )
          ).status,
          400,
        );
        assert.equal(
          (await goal.DELETE(req("DELETE"), ctx("goalId", "bad"))).status,
          400,
        );
      },
    );
    await t.test("create and read goal with no records", async () => {
      const r = await goals.POST(req("POST", input));
      assert.equal(r.status, 201);
      id = (await r.json()).data.id;
      const list = await goals.GET(req());
      assert.equal(list.headers.get("cache-control"), "no-store");
      assert.equal((await list.json()).data[0].usage.status, "no_records");
    });
    await t.test(
      "Records CRUD and overlap regression, goal usage updates",
      async () => {
        const record = {
          resource: "water",
          start: "2026-09-01",
          end: "2026-09-07",
          amount: 20,
        };
        const r = await createRecord(req("POST", record));
        assert.equal(r.status, 201);
        recordId = (await r.json()).data.id;
        assert.equal((await createRecord(req("POST", record))).status, 409);
        assert.equal(
          (
            await updateRecord(
              req("PATCH", { ...record, amount: 120 }),
              recordId,
            )
          ).status,
          200,
        );
        assert.equal(
          (await (await goals.GET(req())).json()).data[0].usage.status,
          "over_limit",
        );
        assert.equal((await (await listRecords()).json()).data.length, 1);
      },
    );
    await t.test(
      "other account cannot read, update or delete goals or records",
      async () => {
        user.id = b;
        assert.equal((await (await goals.GET(req())).json()).data.length, 0);
        assert.equal(
          (await goal.PATCH(req("PATCH", input), ctx("goalId", id))).status,
          404,
        );
        assert.equal(
          (await goal.DELETE(req("DELETE"), ctx("goalId", id))).status,
          404,
        );
        assert.equal((await deleteRecord(recordId)).status, 404);
        user.id = a;
        assert.equal(
          (
            await goal.PATCH(
              req("PATCH", { ...input, target: 200 }),
              ctx("goalId", id),
            )
          ).status,
          200,
        );
      },
    );
    await t.test(
      "join persists, duplicate is 409, other account cannot remove membership",
      async () => {
        assert.equal(
          (await membership.POST(req("POST"), ctx("challengeId", cid))).status,
          201,
        );
        assert.equal(
          (await membership.POST(req("POST"), ctx("challengeId", cid))).status,
          409,
        );
        assert.deepEqual((await (await memberships.GET(req())).json()).data, [
          cid,
        ]);
        user.id = b;
        assert.deepEqual(
          (await (await memberships.GET(req())).json()).data,
          [],
        );
        assert.equal(
          (await membership.DELETE(req("DELETE"), ctx("challengeId", cid)))
            .status,
          200,
        );
        user.id = a;
        assert.equal(
          (await (await challenges.GET(req())).json()).data.find(
            (c) => c.id === cid,
          ).joined,
          true,
        );
      },
    );
    await t.test(
      "inactive challenge is hidden and cannot be joined, but can be left",
      async () => {
        await pg.exec(
          `reset role;update public.challenges set is_active=false where id='${cid}'`,
        );
        assert.equal(
          (await (await challenges.GET(req())).json()).data.some(
            (c) => c.id === cid,
          ),
          false,
        );
        assert.equal(
          (await membership.POST(req("POST"), ctx("challengeId", cid))).status,
          404,
        );
        assert.equal(
          (await membership.DELETE(req("DELETE"), ctx("challengeId", cid)))
            .status,
          200,
        );
        assert.deepEqual(
          (await (await memberships.GET(req())).json()).data,
          [],
        );
      },
    );
    await t.test(
      "delete goal and record return compatible responses",
      async () => {
        assert.equal((await deleteRecord(recordId)).status, 200);
        assert.equal(
          (await (await goals.GET(req())).json()).data[0].usage.status,
          "no_records",
        );
        const r = await goal.DELETE(req("DELETE"), ctx("goalId", id));
        assert.equal(r.status, 200);
        assert.equal((await r.json()).data.id, id);
        assert.equal(
          (await goal.DELETE(req("DELETE"), ctx("goalId", id))).status,
          404,
        );
      },
    );

    await t.test(
      "lists and usage totals are not truncated after 1000 rows",
      async () => {
        await pg.exec(`reset role;
    insert into public.usage_records(user_id,resource,start_date,end_date,amount)
      select '${a}','water',date '2020-01-01'+i,date '2020-01-01'+i,1 from generate_series(0,1004) i;
    insert into public.goals(user_id,title,resource,target,start_date,end_date)
      select '${a}','Goal '||i,'water',10000,'2020-01-01','2030-01-01' from generate_series(1,1005) i;
    insert into public.challenges(title,description,resource,target,start_date,end_date,tag,icon)
      select 'Bulk '||i,'Test','water',100,'2020-01-01','2030-01-01','test','drop' from generate_series(1,1005) i;
    insert into public.challenge_memberships(user_id,challenge_id) select '${a}',id from public.challenges where title like 'Bulk %';`);
        const list = (await (await goals.GET(req())).json()).data;
        assert.equal(list.length, 1005);
        assert.equal(list[0].usage.amount, 1005);
        assert.equal((await (await listRecords()).json()).data.length, 1005);
        assert.equal(
          (await (await memberships.GET(req())).json()).data.length,
          1005,
        );
        const cs = (await (await challenges.GET(req())).json()).data;
        assert.equal(cs.filter((c) => c.joined).length, 1005);
      },
    );
  } finally {
    await pg.close();
    delete globalThis.__testSupabase;
  }
});
