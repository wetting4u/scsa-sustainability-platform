-- Phase one: for a fresh Supabase project; based on the original SQLite schema without importing old passwords or demo accounts.
begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

create table public.resources (
  code text primary key check (code in ('electricity', 'water', 'waste')),
  name text not null,
  unit text not null,
  max_amount numeric not null check (max_amount > 0 and max_amount < 'Infinity'::numeric)
);
insert into public.resources values
  ('electricity', 'Electricity', 'kWh', 100000),
  ('water', 'Water', 'L', 10000000),
  ('waste', 'Waste', 'kg', 100000);

-- Phase one: one Auth account represents one household; shared household management is deferred.
create table public.household_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'My household' check (char_length(btrim(display_name)) between 1 and 80),
  household_size integer not null default 1 check (household_size > 0),
  pseudonym text not null default ('Household-' || gen_random_uuid()::text) unique,
  share_analytics boolean not null default false,
  display_leaderboard boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Roles are separate from editable household profiles to prevent self-assigned privileges.
create table public.account_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'household' check (role in ('household', 'admin'))
);
create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource text not null references public.resources(code),
  start_date date not null,
  end_date date not null,
  amount numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usage_dates check (start_date >= date '0001-01-01' and end_date <= date '9999-12-31' and end_date >= start_date),
  constraint usage_amount check (amount >= 0 and amount <= case resource when 'water' then 10000000 else 100000 end),
  -- Dates are inclusive; the exclusion constraint prevents overlapping periods for the same household and resource, including concurrent writes.
  constraint usage_no_overlap exclude using gist
    (user_id with =, resource with =, daterange(start_date, end_date, '[]') with &&)
);
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  resource text not null references public.resources(code),
  target numeric not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (target > 0 and target <= case resource when 'water' then 10000000 else 100000 end),
  check (start_date >= date '0001-01-01' and end_date <= date '9999-12-31' and end_date >= start_date)
);
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null,
  resource text not null references public.resources(code),
  target numeric not null,
  start_date date not null,
  end_date date not null,
  tag text not null,
  icon text not null check (icon in ('sprout', 'bolt', 'drop')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (target > 0 and target <= case resource when 'water' then 10000000 else 100000 end),
  check (start_date >= date '0001-01-01' and end_date <= date '9999-12-31' and end_date >= start_date)
);
create table public.challenge_memberships (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null
);
create table public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
create index challenge_memberships_challenge_idx on public.challenge_memberships(challenge_id);
create index user_badges_badge_idx on public.user_badges(badge_id);
create index goals_user_dates_idx on public.goals(user_id, start_date, end_date);
create index usage_records_user_dates_idx on public.usage_records(user_id, start_date, end_date);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger household_updated before update on public.household_profiles for each row execute function public.set_updated_at();
create trigger usage_updated before update on public.usage_records for each row execute function public.set_updated_at();
create trigger goals_updated before update on public.goals for each row execute function public.set_updated_at();

-- Do not trust roles or privacy preferences supplied in client metadata.
create function public.initialize_household() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.household_profiles(user_id) values (new.id);
  insert into public.account_roles(user_id) values (new.id);
  return new;
end;
$$;
create trigger scsa_auth_user_created after insert on auth.users for each row execute function public.initialize_household();
insert into public.household_profiles(user_id) select id from auth.users;
insert into public.account_roles(user_id) select id from auth.users;

-- Revoke any default project privileges, then grant access explicitly.
revoke all on public.resources, public.household_profiles, public.account_roles,
  public.usage_records, public.goals, public.challenges, public.challenge_memberships,
  public.badges, public.user_badges from public, anon, authenticated;
revoke all on function public.initialize_household() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

alter table public.resources enable row level security;
alter table public.household_profiles enable row level security;
alter table public.account_roles enable row level security;
alter table public.usage_records enable row level security;
alter table public.goals enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_memberships enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

grant select on public.resources, public.challenges, public.badges to authenticated;
create policy resources_read on public.resources for select to authenticated using (true);
create policy challenges_read on public.challenges for select to authenticated using (is_active);
create policy badges_read on public.badges for select to authenticated using (true);
grant select on public.household_profiles, public.account_roles, public.user_badges to authenticated;
grant update(display_name, household_size, share_analytics, display_leaderboard) on public.household_profiles to authenticated;
create policy profile_read on public.household_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profile_update on public.household_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy role_read on public.account_roles for select to authenticated using (user_id = (select auth.uid()));
create policy earned_badges_read on public.user_badges for select to authenticated using (user_id = (select auth.uid()));

grant select, delete on public.usage_records, public.goals to authenticated;
grant insert(resource, start_date, end_date, amount), update(resource, start_date, end_date, amount) on public.usage_records to authenticated;
grant insert(title, resource, target, start_date, end_date), update(title, resource, target, start_date, end_date) on public.goals to authenticated;
create policy records_read on public.usage_records for select to authenticated using (user_id = (select auth.uid()));
create policy records_insert on public.usage_records for insert to authenticated with check (user_id = (select auth.uid()));
create policy records_update on public.usage_records for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy records_delete on public.usage_records for delete to authenticated using (user_id = (select auth.uid()));
create policy goals_read on public.goals for select to authenticated using (user_id = (select auth.uid()));
create policy goals_insert on public.goals for insert to authenticated with check (user_id = (select auth.uid()));
create policy goals_update on public.goals for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy goals_delete on public.goals for delete to authenticated using (user_id = (select auth.uid()));
grant select, delete on public.challenge_memberships to authenticated;
grant insert(challenge_id) on public.challenge_memberships to authenticated;
create policy memberships_read on public.challenge_memberships for select to authenticated using (user_id = (select auth.uid()));
create policy memberships_join on public.challenge_memberships for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.challenges c where c.id = challenge_id and c.is_active
  ));
create policy memberships_leave on public.challenge_memberships for delete to authenticated using (user_id = (select auth.uid()));
-- Do not create views that bypass RLS. The admin role does not automatically gain access to other households' raw data.
commit;
