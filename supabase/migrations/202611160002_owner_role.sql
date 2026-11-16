-- Add an independently provisioned owner role. No user is promoted here.
begin;

alter table public.marketplace_user_roles drop constraint marketplace_user_roles_role_check;
alter table public.marketplace_user_roles add constraint marketplace_user_roles_role_check
  check (role in ('admin', 'owner'));

create or replace function marketplace_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.marketplace_user_roles r
    join auth.users u on u.id = r.user_id
    where r.user_id = (select auth.uid()) and r.role in ('admin', 'owner')
      and u.email_confirmed_at is not null
  );
$$;

commit;
