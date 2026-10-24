-- Stable readable pseudonyms. The suffix prevents households sharing a name.
create sequence scsa_rewards_private.pseudonym_number;
create function scsa_rewards_private.new_pseudonym() returns text
language plpgsql volatile security definer set search_path='' as $$
declare candidate text;
 adjectives text[] := array['Northern','Southern','Eastern','Western','Sunny','Gentle','Leafy','Golden','Quiet','Bright','Coastal','Misty'];
 animals text[] := array['Bear','Koala','Wombat','Robin','Possum','Owl','Kookaburra','Wallaby','Dolphin','Penguin','Finch','Echidna'];
begin
 loop
  candidate := adjectives[1+floor(random()*array_length(adjectives,1))::integer] || ' ' ||
    animals[1+floor(random()*array_length(animals,1))::integer] || ' ' ||
    nextval('scsa_rewards_private.pseudonym_number'::regclass)::text;
  exit when not exists(select 1 from public.household_profiles where pseudonym=candidate);
 end loop;
 return candidate;
end;
$$;
revoke all on function scsa_rewards_private.new_pseudonym() from public,anon;
grant usage on schema scsa_rewards_private to service_role;
grant execute on function scsa_rewards_private.new_pseudonym() to authenticated,service_role;
alter table public.household_profiles alter column pseudonym set default scsa_rewards_private.new_pseudonym();
-- Preserve any deliberately assigned names; replace only the legacy generated format.
update public.household_profiles set pseudonym=scsa_rewards_private.new_pseudonym()
where pseudonym ~ '^Household-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

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
    select resource,user_id,pseudonym,points,rank() over(partition by resource order by points desc) as rank,
      row_number() over(partition by resource order by points desc,pseudonym collate "C",user_id) as position from scores
  ) select jsonb_build_object('periodStart',v_start,'periodEnd',v_end,'periodBasis','awarded_at',
    'entries',coalesce(jsonb_agg(jsonb_build_object('resource',resource,'pseudonym',pseudonym,'points',points,'rank',rank,'isMe',user_id=v_user)
       order by resource,position) filter(where position<=50),'[]'::jsonb),
    'myEntries',coalesce(jsonb_agg(jsonb_build_object('resource',resource,'pseudonym',pseudonym,'points',points,'rank',rank,'isMe',true) order by resource) filter(where user_id=v_user),'[]'::jsonb),
    'sharingEnabled',(select display_leaderboard from public.household_profiles where user_id=v_user)) into v_result from ranked;
  return v_result;
end;
$$;
