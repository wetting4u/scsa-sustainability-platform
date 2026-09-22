-- Allow authenticated users to access challenges,
-- while RLS limits modifications to the administrator.

grant select, insert, update, delete
on public.challenges
to authenticated;

drop policy if exists "Admins can insert challenges"
on public.challenges;

create policy "Admins can insert challenges"
on public.challenges
for insert
to authenticated
with check (
  exists (
    select 1
    from public.account_roles
    where account_roles.user_id = auth.uid()
      and account_roles.role = 'admin'
  )
);

drop policy if exists "Admins can update challenges"
on public.challenges;

create policy "Admins can update challenges"
on public.challenges
for update
to authenticated
using (
  exists (
    select 1
    from public.account_roles
    where account_roles.user_id = auth.uid()
      and account_roles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.account_roles
    where account_roles.user_id = auth.uid()
      and account_roles.role = 'admin'
  )
);

drop policy if exists "Admins can delete challenges"
on public.challenges;

create policy "Admins can delete challenges"
on public.challenges
for delete
to authenticated
using (
  exists (
    select 1
    from public.account_roles
    where account_roles.user_id = auth.uid()
      and account_roles.role = 'admin'
  )
);

-- Project requirement: only one account may be administrator.
create unique index if not exists only_one_admin
on public.account_roles (role)
where role = 'admin';