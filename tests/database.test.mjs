import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

// 本机 PostgreSQL 测试：模拟 Auth 的最小表/身份函数，不连接 Supabase。
test("schema、数据约束与普通用户权限", async (t) => {
  const db = new PGlite({ extensions: { btree_gist } });
  const alice = "10000000-0000-4000-8000-000000000001";
  const bob = "10000000-0000-4000-8000-000000000002";
  const challenge = "00000000-0000-4000-8000-000000000001";
  const badge = "00000000-0000-4000-8000-000000000101";
  const migration = await readFile(
    new URL(
      "../supabase/migrations/20260917000100_initial_schema.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const seed = await readFile(
    new URL("../supabase/seed.sql", import.meta.url),
    "utf8",
  );
  async function asUser(id) {
    await db.exec("reset role; set role authenticated;");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
      id,
    ]);
  }
  async function denied(sql, code = "42501") {
    await assert.rejects(db.exec(sql), (error) => error.code === code);
  }
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      insert into auth.users values ('${alice}');
    `);
    await db.exec(migration);
    await db.exec(seed);
    await db.exec(seed);
    await db.exec(`insert into auth.users values ('${bob}');`);

    await t.test(
      "已有和新注册账号都有私密资料及普通角色；seed 可重复执行",
      async () => {
        const { rows } = await db.query(
          "select share_analytics, display_leaderboard from public.household_profiles",
        );
        assert.equal(rows.length, 2);
        assert.ok(
          rows.every((r) => !r.share_analytics && !r.display_leaderboard),
        );
        assert.equal(
          (await db.query("select * from public.challenges")).rows.length,
          3,
        );
        assert.ok(
          (await db.query("select role from public.account_roles")).rows.every(
            (r) => r.role === "household",
          ),
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int as n from pg_tables where schemaname='public' and rowsecurity",
            )
          ).rows[0].n,
          9,
        );
      },
    );

    let aliceRecord;
    await t.test("本人可以 CRUD，用量、日期和重叠约束生效", async () => {
      await asUser(alice);
      aliceRecord = (
        await db.query(`insert into public.usage_records(resource,start_date,end_date,amount)
        values ('water','2026-09-01','2026-09-07',1900) returning id`)
      ).rows[0].id;
      await db.exec(`insert into public.usage_records(resource,start_date,end_date,amount)
        values ('water','2026-09-08','2026-09-14',1750), ('electricity','2026-09-01','2026-09-07',64);`);
      await denied(
        `insert into public.usage_records(resource,start_date,end_date,amount) values ('water','2026-09-07','2026-09-08',1)`,
        "23P01",
      );
      await denied(
        `update public.usage_records set end_date='2026-09-08' where id='${aliceRecord}'`,
        "23P01",
      );
      for (const amount of ["-1", "10000001", "'NaN'", "'Infinity'"]) {
        await denied(
          `insert into public.usage_records(resource,start_date,end_date,amount) values ('water','2026-10-01','2026-10-07',${amount})`,
          "23514",
        );
      }
      await denied(
        `insert into public.usage_records(resource,start_date,end_date,amount) values ('water','2026-02-30','2026-03-07',1)`,
        "22008",
      );
      await assert.rejects(
        db.exec(
          `insert into public.usage_records(resource,start_date,end_date,amount) values ('water','2026-10-08','2026-10-01',1)`,
        ),
      );
      await db.exec(
        `update public.usage_records set amount=1800 where id='${aliceRecord}'`,
      );
      assert.equal(
        (
          await db.query(
            "select amount from public.usage_records where id=$1",
            [aliceRecord],
          )
        ).rows[0].amount,
        "1800",
      );
      await db.exec(
        `insert into public.usage_records(resource,start_date,end_date,amount) values ('waste','2026-10-01','2026-10-01',0)`,
      );
      await db.exec("delete from public.usage_records where resource='waste'");
      await db.exec(
        `insert into public.goals(title,resource,target,start_date,end_date) values ('Water goal','water',8000,'2026-09-01','2026-09-30')`,
      );
      await denied(
        `insert into public.goals(title,resource,target,start_date,end_date) values ('Invalid','water',0,'2026-09-01','2026-09-30')`,
        "23514",
      );
    });

    await t.test(
      "两开关相互独立；禁止改角色、所有者、假名或自颁徽章",
      async () => {
        await asUser(alice);
        for (const [analytics, leaderboard] of [
          [false, false],
          [true, false],
          [false, true],
          [true, true],
        ]) {
          await db.exec(
            `update public.household_profiles set share_analytics=${analytics},display_leaderboard=${leaderboard}`,
          );
          assert.deepEqual(
            (
              await db.query(
                "select share_analytics,display_leaderboard from public.household_profiles",
              )
            ).rows,
            [{ share_analytics: analytics, display_leaderboard: leaderboard }],
          );
        }
        await denied("update public.account_roles set role='admin'");
        await denied(`update public.usage_records set user_id='${bob}'`);
        await denied(
          `insert into public.usage_records(user_id,resource,start_date,end_date,amount) values ('${bob}','water','2026-10-01','2026-10-07',1)`,
        );
        await denied(
          "update public.household_profiles set pseudonym='Alice real name'",
        );
        await denied(
          `insert into public.user_badges(user_id,badge_id) values ('${alice}','${badge}')`,
        );
        await denied("update public.challenges set target=1");
      },
    );

    await t.test(
      "另一个账号不能看到或修改记录，admin 也没有跨家庭读取特权",
      async () => {
        await asUser(bob);
        assert.equal(
          (await db.query("select * from public.usage_records")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.goals")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.household_profiles")).rows
            .length,
          1,
        );
        assert.equal(
          (
            await db.query(
              `update public.usage_records set amount=1 where id='${aliceRecord}' returning id`,
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              `delete from public.usage_records where id='${aliceRecord}' returning id`,
            )
          ).rows.length,
          0,
        );
        await db.exec(
          `insert into public.usage_records(resource,start_date,end_date,amount) values ('water','2026-09-01','2026-09-07',900)`,
        );
        await db.exec(
          `reset role; update public.account_roles set role='admin' where user_id='${bob}';`,
        );
        await asUser(bob);
        assert.equal(
          (await db.query("select * from public.usage_records")).rows.length,
          1,
        );
      },
    );

    await t.test(
      "挑战只允许本人加入和退出，不能重复或加入停用挑战",
      async () => {
        await asUser(alice);
        await db.exec(
          `insert into public.challenge_memberships(challenge_id) values ('${challenge}')`,
        );
        await denied(
          `insert into public.challenge_memberships(challenge_id) values ('${challenge}')`,
          "23505",
        );
        await asUser(bob);
        assert.equal(
          (await db.query("select * from public.challenge_memberships")).rows
            .length,
          0,
        );
        await db.exec(
          `reset role; update public.challenges set is_active=false where id='${challenge}'`,
        );
        await asUser(bob);
        await denied(
          `insert into public.challenge_memberships(challenge_id) values ('${challenge}')`,
        );
        await asUser(alice);
        await db.exec(
          `delete from public.challenge_memberships where challenge_id='${challenge}'`,
        );
      },
    );

    await t.test("匿名角色无法读取家庭资料、角色或记录", async () => {
      await db.exec("reset role; set role anon;");
      for (const table of [
        "household_profiles",
        "account_roles",
        "usage_records",
        "goals",
        "challenge_memberships",
        "user_badges",
      ]) {
        await denied(`select * from public.${table}`);
      }
    });
  } finally {
    await db.close();
  }
});
