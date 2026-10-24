import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

test("points-only rewards and private resource leaderboards", async () => {
  const db = new PGlite({ extensions: { btree_gist } });
  const alice = "10000000-0000-4000-8000-000000000001",
    bob = "10000000-0000-4000-8000-000000000002";
  const area = "20000000-0000-4000-8000-000000000001";
  const ids = Array.from(
    { length: 5 },
    (_, i) => `30000000-0000-4000-8000-00000000000${i + 1}`,
  );
  const sql = async (path) => readFile(new URL(path, import.meta.url), "utf8");
  const asUser = async (id) => {
    await db.exec("reset role; set role authenticated;");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  };
  const claim = async (id) =>
    (await db.query("select public.claim_challenge_reward($1) as result", [id]))
      .rows[0].result;
  const board = async () =>
    (
      await db.query(
        "select public.get_resource_leaderboard('weekly') as result",
      )
    ).rows[0].result;
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
 create table auth.users(id uuid primary key, raw_app_meta_data jsonb default '{}', banned_until timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    await db.exec(
      await sql("../supabase/migrations/20260917000100_initial_schema.sql"),
    );
    await db.exec(`
 create table public.community_areas(id uuid primary key,is_active boolean default true);
 alter table public.household_profiles add column community_area_id uuid references public.community_areas;
 alter table public.challenges add column reward_points integer check(reward_points between 0 and 1000000);
 alter table public.challenges add column reward_badge_id uuid references public.badges;
 alter table public.challenges add column min_household_size integer;
 alter table public.challenges add column max_household_size integer;
 create table public.challenge_rewards(user_id uuid references auth.users on delete cascade,challenge_id uuid references public.challenges,
 badge_id uuid not null references public.badges,points integer not null, achieved_total numeric not null,target_snapshot numeric not null,awarded_at timestamptz not null default now(),primary key(user_id,challenge_id));
 alter table public.challenge_rewards enable row level security;
 create policy own_challenge_rewards on public.challenge_rewards for select to authenticated using(user_id=auth.uid());
 grant select on public.challenge_rewards to authenticated;
 create table public.badge_cycle_results(user_id uuid);
 insert into public.community_areas(id) values('${area}');
 insert into auth.users(id) values('${alice}'),('${bob}');
 update public.household_profiles set community_area_id='${area}',display_leaderboard=true;
 insert into public.resources(code,name,unit,max_amount) values('electricity','Electricity','kWh',100000),('water','Water','L',10000000),('waste','Waste','kg',100000) on conflict do nothing;
 `);
    await db.exec(
      await sql(
        "../supabase/migrations/20261024093319_challenge_points_leaderboards.sql",
      ),
    );
    await db.exec(
      `update public.household_profiles set pseudonym='Custom Robin' where user_id='${bob}';`,
    );
    await db.exec(
      await sql(
        "../supabase/migrations/20261024102759_friendly_leaderboard_identity.sql",
      ),
    );
    const names = (
      await db.query(
        "select pseudonym from public.household_profiles order by user_id",
      )
    ).rows;
    assert.match(names[0].pseudonym, /^[A-Za-z]+ [A-Za-z]+ [0-9]+$/);
    assert.equal(names[1].pseudonym, "Custom Robin");
    for (let i = 0; i < ids.length; i++)
      await db.query(
        `insert into public.challenges(id,title,description,resource,target,start_date,end_date,tag,icon,reward_points)
 values($1,'Test challenge','Test', $2,100,((now() at time zone 'Australia/Adelaide')::date-7),((now() at time zone 'Australia/Adelaide')::date-1),'TEST','sprout',$3)`,
        [
          ids[i],
          i === 2 ? "water" : i === 3 ? "waste" : "electricity",
          i === 4 ? null : 25,
        ],
      );
    await db.exec(`insert into public.challenge_memberships(user_id,challenge_id) select '${alice}',id from public.challenges;
 insert into public.usage_records(user_id,resource,amount,start_date,end_date) values
 ('${alice}','electricity',100,(now() at time zone 'Australia/Adelaide')::date-7,(now() at time zone 'Australia/Adelaide')::date-1),
 ('${alice}','water',101,(now() at time zone 'Australia/Adelaide')::date-7,(now() at time zone 'Australia/Adelaide')::date-1),
 ('${alice}','waste',10,(now() at time zone 'Australia/Adelaide')::date-7,(now() at time zone 'Australia/Adelaide')::date-2);`);
    await asUser(alice);
    assert.equal((await claim(ids[0])).status, "awarded");
    assert.equal((await claim(ids[0])).status, "already_awarded");
    assert.equal((await claim(ids[2])).status, "failed");
    assert.equal((await claim(ids[3])).status, "incomplete_data");
    assert.equal((await claim(ids[4])).status, "reward_not_configured");
    assert.equal((await board()).entries[0].points, 25);
    assert.equal((await board()).entries[0].resource, "electricity");
    assert.equal((await board()).entries[0].isMe, true);
    assert.equal((await board()).myEntries[0].rank, 1);
    assert.equal((await board()).sharingEnabled, true);
    await db.exec("reset role;");
    for (let i = 1; i <= 55; i++) {
      const uid = `40000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
      await db.query("insert into auth.users(id) values($1)", [uid]);
      await db.query(
        "update public.household_profiles set community_area_id=$1,display_leaderboard=true where user_id=$2",
        [area, uid],
      );
      await db.query(
        "insert into public.challenge_rewards(user_id,challenge_id,resource,points,achieved_total,target_snapshot) values($1,$2,'electricity',$3,10,100)",
        [uid, ids[0], 1000 - i],
      );
    }
    const generated = (
      await db.query("select pseudonym from public.household_profiles")
    ).rows;
    assert.equal(
      new Set(generated.map((r) => r.pseudonym)).size,
      generated.length,
    );
    await asUser(alice);
    const ranked = await board();
    assert.equal(ranked.entries.length, 50);
    assert.equal(ranked.myEntries[0].rank, 56);
    assert.equal(
      ranked.entries.some((r) => r.isMe),
      false,
    );
    assert.equal(ranked.myEntries[0].pseudonym, names[0].pseudonym);
    assert.equal(JSON.stringify(ranked).includes(alice), false);
    await db.exec(
      "reset role; delete from auth.users where id::text like '40000000-%';",
    );
    await asUser(alice);

    assert.equal(
      (await db.query("select * from public.user_badges")).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(
        `insert into public.challenge_rewards(user_id,challenge_id,resource,points,achieved_total,target_snapshot) values('${alice}','${ids[1]}','water',999,1,100)`,
      ),
    );
    await asUser(bob);
    assert.equal(
      (await db.query("select * from public.challenge_rewards")).rows.length,
      0,
    );
    assert.equal((await claim(ids[0])).status, "not_joined");
    await assert.rejects(
      db.exec(
        `insert into public.challenge_memberships(user_id,challenge_id) values('${bob}','${ids[1]}')`,
      ),
    );
    await db.exec(
      `reset role; update public.household_profiles set display_leaderboard=false where user_id='${alice}';`,
    );
    await asUser(bob);
    assert.deepEqual((await board()).entries, []);
    await asUser(alice);
    assert.deepEqual((await board()).myEntries, []);
    assert.equal((await board()).sharingEnabled, false);
    await asUser(bob);
    await assert.rejects(
      db.query("select public.get_resource_leaderboard('invalid')"),
    );
    await db.exec(
      `reset role; update auth.users set raw_app_meta_data='{"account_frozen":true}' where id='${alice}';`,
    );
    await asUser(alice);
    await assert.rejects(claim(ids[1]));
    await db.exec(
      `reset role; update auth.users set raw_app_meta_data='{}' where id='${alice}';`,
    );
    await asUser(alice);
    await db.query("select public.clear_my_account_data()");
    assert.equal(
      (await db.query("select * from public.challenge_rewards")).rows.length,
      0,
    );
    await db.exec("reset role; set role anon;");
    await assert.rejects(
      db.query("select public.get_resource_leaderboard('weekly')"),
    );
    await assert.rejects(claim(ids[0]));
  } finally {
    await db.close();
  }
});
