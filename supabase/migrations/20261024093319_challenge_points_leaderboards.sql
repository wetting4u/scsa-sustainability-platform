-- Requires the team's deployed community and challenge reward schema.
-- Keep legacy badge columns for compatibility, but new rewards are points-only.
alter table public.challenge_rewards alter column badge_id drop not null;
alter table public.challenge_rewards add column resource text references public.resources(code);
update public.challenge_rewards r set resource = c.resource from public.challenges c where c.id = r.challenge_id;
alter table public.challenge_rewards alter column resource set not null;
create index challenge_rewards_resource_awarded_idx on public.challenge_rewards(resource, awarded_at);

-- Replace overlapping permissive INSERT policies with one eligibility policy.
drop policy if exists memberships_join on public.challenge_memberships;
drop policy if exists memberships_household_eligibility on public.challenge_memberships;
create policy memberships_join on public.challenge_memberships for insert to authenticated with check (
 user_id=(select auth.uid()) and exists (
  select 1 from public.challenges c join public.household_profiles p on p.user_id=(select auth.uid())
  where c.id=challenge_id and c.is_active
    and c.end_date >= (statement_timestamp() at time zone 'Australia/Adelaide')::date
    and (c.min_household_size is null or p.household_size>=c.min_household_size)
    and (c.max_household_size is null or p.household_size<=c.max_household_size)
 )
);

create schema if not exists scsa_rewards_private;
revoke all on schema scsa_rewards_private from public;
grant usage on schema scsa_rewards_private to authenticated;

create or replace function scsa_rewards_private.claim_reward(p_challenge_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  c public.challenges%rowtype;
  r public.challenge_rewards%rowtype;
  v_total numeric; v_days bigint; v_count bigint;
  v_today date := (statement_timestamp() at time zone 'Australia/Adelaide')::date;
begin
  if v_user is null or not exists (
    select 1 from auth.users u where u.id = v_user
    and coalesce(u.raw_app_meta_data->>'account_frozen', 'false') <> 'true'
    and (u.banned_until is null or u.banned_until <= now())
  ) then raise exception 'Active account required' using errcode = '42501'; end if;
  perform 1 from public.household_profiles where user_id = v_user for update;
  if not found then return jsonb_build_object('status','profile_required'); end if;
  select * into r from public.challenge_rewards where user_id=v_user and challenge_id=p_challenge_id;
  if found then return jsonb_build_object('status','already_awarded','points',r.points); end if;
  select * into c from public.challenges where id=p_challenge_id and is_active for share;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if not exists (select 1 from public.challenge_memberships where user_id=v_user and challenge_id=c.id) then
    return jsonb_build_object('status','not_joined'); end if;
  if v_today <= c.end_date then return jsonb_build_object('status','not_ended'); end if;
  -- The exclusion constraint prevents overlapping records of the same resource.
  select count(*),coalesce(sum(amount),0),coalesce(sum(end_date-start_date+1),0)
  into v_count,v_total,v_days from public.usage_records
  where user_id=v_user and resource=c.resource and start_date>=c.start_date and end_date<=c.end_date;
  if v_count=0 then return jsonb_build_object('status','no_records'); end if;
  if v_days<>c.end_date-c.start_date+1 then return jsonb_build_object('status','incomplete_data'); end if;
  if v_total>c.target then return jsonb_build_object('status','failed'); end if;
  if c.reward_points is null then return jsonb_build_object('status','reward_not_configured'); end if;
  insert into public.challenge_rewards(user_id,challenge_id,resource,points,achieved_total,target_snapshot)
    values(v_user,c.id,c.resource,c.reward_points,v_total,c.target) returning * into r;
  return jsonb_build_object('status','awarded','points',r.points);
end;
$$;
revoke all on function scsa_rewards_private.claim_reward(uuid) from public,anon;
grant execute on function scsa_rewards_private.claim_reward(uuid) to authenticated;
create or replace function public.claim_challenge_reward(p_challenge_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select scsa_rewards_private.claim_reward(p_challenge_id);
$$;
revoke all on function public.claim_challenge_reward(uuid) from public,anon;
grant execute on function public.claim_challenge_reward(uuid) to authenticated;

create or replace function scsa_rewards_private.resource_leaderboard(p_period_type text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_area uuid; v_start date; v_end date;
  v_today date := (statement_timestamp() at time zone 'Australia/Adelaide')::date;
  v_result jsonb;
begin
  if v_user is null or not exists (
    select 1 from auth.users u where u.id=v_user
    and coalesce(u.raw_app_meta_data->>'account_frozen','false') <> 'true'
    and (u.banned_until is null or u.banned_until<=now())
  ) then raise exception 'Active account required' using errcode='42501'; end if;
  if p_period_type is null or p_period_type not in ('weekly','monthly') then
    raise exception 'Invalid period' using errcode='22023'; end if;
  select p.community_area_id into v_area from public.household_profiles p
    join public.community_areas a on a.id=p.community_area_id and a.is_active where p.user_id=v_user;
  if v_area is null then raise exception 'Select an active Community Area in Settings' using errcode='42501'; end if;
  if p_period_type='weekly' then
    v_start:=v_today-(extract(isodow from v_today)::integer-1); v_end:=v_start+6;
  else
    v_start:=date_trunc('month',v_today::timestamp)::date;
    v_end:=(v_start+interval '1 month - 1 day')::date;
  end if;
  with scores as (
    select r.resource,p.user_id,p.pseudonym,sum(r.points)::bigint as points
    from public.challenge_rewards r join public.household_profiles p on p.user_id=r.user_id
    join auth.users u on u.id=p.user_id
    where p.display_leaderboard and p.community_area_id=v_area
      and coalesce(u.raw_app_meta_data->>'account_frozen','false')<>'true'
      and (u.banned_until is null or u.banned_until<=now())
      and r.awarded_at >= (v_start::timestamp at time zone 'Australia/Adelaide')
      and r.awarded_at < ((v_end+1)::timestamp at time zone 'Australia/Adelaide')
    group by r.resource,p.user_id,p.pseudonym having sum(r.points)>0
  ), ranked as (
    select resource,pseudonym,points,rank() over(partition by resource order by points desc) as rank,
      row_number() over(partition by resource order by points desc,pseudonym collate "C",user_id) as position from scores
  ) select jsonb_build_object('periodStart',v_start,'periodEnd',v_end,'periodBasis','awarded_at',
    'entries',coalesce(jsonb_agg(jsonb_build_object('resource',resource,'pseudonym',pseudonym,'points',points,'rank',rank)
       order by resource,position) filter(where position<=50),'[]'::jsonb)) into v_result from ranked;
  return v_result;
end;
$$;
revoke all on function scsa_rewards_private.resource_leaderboard(text) from public,anon;
grant execute on function scsa_rewards_private.resource_leaderboard(text) to authenticated;
create or replace function public.get_resource_leaderboard(p_period_type text)
returns jsonb language sql security invoker set search_path = '' as $$
  select scsa_rewards_private.resource_leaderboard(p_period_type);
$$;
revoke all on function public.get_resource_leaderboard(text) from public,anon;
grant execute on function public.get_resource_leaderboard(text) to authenticated;

-- Preserve the existing account reset contract and include the new point ledger.
-- This replacement is generated from the deployed definition below.
CREATE OR REPLACE FUNCTION public.clear_my_account_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid;
  v_goals_deleted bigint := 0;
  v_usage_records_deleted bigint := 0;
  v_challenge_memberships_deleted bigint := 0;
  v_badge_cycle_results_deleted bigint := 0;
  v_user_badges_deleted bigint := 0;
  v_rewards_deleted bigint := 0;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required.';
  end if;

  -- Serialize the clear operation against concurrent profile-related actions,
  -- but do not modify any household_profiles fields.
  perform 1
  from public.household_profiles hp
  where hp.user_id = v_user_id
  for update;

  delete from public.challenge_rewards where user_id = v_user_id;
  get diagnostics v_rewards_deleted = row_count;

  -- Remove derived badge history/state first, then user activity/progress.
  delete from public.badge_cycle_results
  where user_id = v_user_id;
  get diagnostics v_badge_cycle_results_deleted = row_count;

  delete from public.user_badges
  where user_id = v_user_id;
  get diagnostics v_user_badges_deleted = row_count;

  delete from public.challenge_memberships
  where user_id = v_user_id;
  get diagnostics v_challenge_memberships_deleted = row_count;

  delete from public.goals
  where user_id = v_user_id;
  get diagnostics v_goals_deleted = row_count;

  delete from public.usage_records
  where user_id = v_user_id;
  get diagnostics v_usage_records_deleted = row_count;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'challenge_rewards_deleted', v_rewards_deleted,
    'usage_records_deleted', v_usage_records_deleted,
    'goals_deleted', v_goals_deleted,
    'challenge_memberships_deleted', v_challenge_memberships_deleted,
    'badge_cycle_results_deleted', v_badge_cycle_results_deleted,
    'user_badges_deleted', v_user_badges_deleted,
    'profile_preserved', true,
    'profile_reset', false,
    'auth_account_preserved', true,
    'account_role_preserved', true
  );
end;
$function$;
