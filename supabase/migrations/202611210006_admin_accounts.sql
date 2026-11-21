-- Application access control. Supabase Auth remains the identity provider.
begin;

create table marketplace_private.suspended_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  suspended_at timestamptz not null default now()
);
alter table marketplace_private.suspended_accounts enable row level security;
revoke all on marketplace_private.suspended_accounts from public, anon, authenticated;

create table public.marketplace_user_access_events (
  id bigint generated always as identity primary key,
  target_id uuid references auth.users(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('suspend', 'unsuspend', 'grant_admin', 'revoke_admin')),
  reason text not null,
  created_at timestamptz not null default now()
);
create index marketplace_user_access_events_target on public.marketplace_user_access_events (target_id, id desc);
alter table public.marketplace_user_access_events enable row level security;
revoke all on public.marketplace_user_access_events from public, anon, authenticated;
grant select on public.marketplace_user_access_events to authenticated;

create function marketplace_private.is_active_user(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u where u.id = p_user_id
    and u.email_confirmed_at is not null and u.deleted_at is null and (u.banned_until is null or u.banned_until <= now()))
    and not exists (select 1 from marketplace_private.suspended_accounts s where s.user_id = p_user_id);
$$;
revoke all on function marketplace_private.is_active_user(uuid) from public, anon, authenticated;

create function public.marketplace_account_is_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select marketplace_private.is_active_user((select auth.uid()));
$$;
revoke all on function public.marketplace_account_is_active() from public, anon, authenticated;
grant execute on function public.marketplace_account_is_active() to authenticated;

create or replace function marketplace_private.has_verified_mfa() returns boolean
language sql stable security definer set search_path = '' as $$
  select marketplace_private.is_active_user((select auth.uid()))
    and exists(select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status::text = 'verified');
$$;

create or replace function marketplace_private.mfa_satisfied() returns boolean
language sql stable security definer set search_path = '' as $$
  select marketplace_private.is_active_user((select auth.uid()))
    and (not marketplace_private.has_verified_mfa() or coalesce((select auth.jwt() ->> 'aal') = 'aal2', false));
$$;

create or replace function marketplace_private.listing_is_public(p_listing uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_seller_grants g on g.seller_id = l.seller_id and g.application_revision = l.seller_revision
    join public.marketplace_seller_applications a on a.applicant_id = g.seller_id and a.revision = g.application_revision
    where l.id = p_listing and l.state = 'published' and l.moderation_status = 'allowed' and a.status = 'approved'
      and a.requested_scope in (l.ecosystem, 'both') and marketplace_private.is_active_user(l.seller_id)
  );
$$;

create policy user_access_events_admin_read on public.marketplace_user_access_events for select to authenticated
  using ((select marketplace_private.is_admin()));

-- Treat only a provider-issued TOTP timestamp from an existing session as fresh.
create function marketplace_private.has_fresh_owner_session() returns boolean
language sql stable security definer set search_path = '' as $$
  select marketplace_private.is_admin()
    and exists (select 1 from public.marketplace_user_roles where user_id = (select auth.uid()) and role = 'owner')
    and exists (select 1 from auth.sessions
      where id = case
        when (auth.jwt() ->> 'session_id') ~ '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'
        then (auth.jwt() ->> 'session_id')::uuid end and user_id = (select auth.uid()))
    and exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(auth.jwt() -> 'amr') = 'array'
        then auth.jwt() -> 'amr' else '[]'::jsonb end) item
      where item ->> 'method' in ('totp', 'mfa/totp') and case
        when (item ->> 'timestamp') ~ '^[0-9]{1,12}$' then (item ->> 'timestamp')::numeric
          between extract(epoch from statement_timestamp()) - 600 and extract(epoch from statement_timestamp()) + 5
        else false end
    );
$$;
revoke all on function marketplace_private.has_fresh_owner_session() from public, anon, authenticated;

create function public.marketplace_admin_user_access(p_user_id uuid)
returns table (account_role text, suspended boolean, provider_restricted boolean, viewer_is_owner boolean, can_manage_roles boolean)
language sql stable security definer set search_path = '' as $$
  select coalesce(r.role, 'customer'), s.user_id is not null,
    (u.email_confirmed_at is null or u.deleted_at is not null or coalesce(u.banned_until > now(), false)),
    exists(select 1 from public.marketplace_user_roles where user_id = (select auth.uid()) and role = 'owner'),
    marketplace_private.has_fresh_owner_session()
  from public.marketplace_profiles p join auth.users u on u.id = p.id
  left join public.marketplace_user_roles r on r.user_id = p.id
  left join marketplace_private.suspended_accounts s on s.user_id = p.id
  where p.id = p_user_id and marketplace_private.is_admin();
$$;
revoke all on function public.marketplace_admin_user_access(uuid) from public, anon, authenticated;
grant execute on function public.marketplace_admin_user_access(uuid) to authenticated;

create function public.marketplace_manage_user_access(p_user_id uuid, p_action text, p_reason text,
  p_expected_role text, p_expected_suspended boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_suspended boolean;
  v_reason text := btrim(p_reason);
begin
  if marketplace_private.is_admin() is not true or p_user_id is null or p_user_id = (select auth.uid()) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if coalesce(char_length(v_reason), 0) not between 1 and 1000 or v_reason ~ '[[:cntrl:]]' then
    raise exception 'enter a valid reason' using errcode = '22023';
  end if;

  -- Serialize application privilege mutations and recheck after acquiring the locks.
  perform pg_advisory_xact_lock(202611210006);
  perform 1 from auth.users where id = p_user_id and deleted_at is null and email_confirmed_at is not null for update;
  if not found then raise exception 'account unavailable' using errcode = 'P0002'; end if;
  if marketplace_private.is_admin() is not true then raise exception 'administrator access required' using errcode = '42501'; end if;

  select role into v_role from public.marketplace_user_roles where user_id = p_user_id;
  v_role := coalesce(v_role, 'customer');
  select exists(select 1 from marketplace_private.suspended_accounts where user_id = p_user_id) into v_suspended;
  if (v_role, v_suspended) is distinct from (p_expected_role, p_expected_suspended) then
    raise exception 'account changed' using errcode = '40001';
  end if;
  if v_role = 'owner' then raise exception 'owner access cannot be changed here' using errcode = '42501'; end if;

  case p_action
    when 'suspend' then
      if v_role <> 'customer' or v_suspended then raise exception 'suspension is unavailable' using errcode = '42501'; end if;
      insert into marketplace_private.suspended_accounts(user_id) values (p_user_id);
    when 'unsuspend' then
      if v_role <> 'customer' or not v_suspended then raise exception 'reactivation is unavailable' using errcode = '42501'; end if;
      delete from marketplace_private.suspended_accounts where user_id = p_user_id;
    when 'grant_admin', 'revoke_admin' then
      if marketplace_private.has_fresh_owner_session() is not true then
        raise exception 'fresh authenticator verification required' using errcode = '42501';
      end if;
      if p_action = 'grant_admin' and v_role = 'customer' and not v_suspended and marketplace_private.is_active_user(p_user_id)
        and exists(select 1 from auth.mfa_factors f where f.user_id = p_user_id and f.status::text = 'verified') then
        insert into public.marketplace_user_roles(user_id, role) values (p_user_id, 'admin');
      elsif p_action = 'revoke_admin' and v_role = 'admin' then
        delete from public.marketplace_user_roles where user_id = p_user_id and role = 'admin';
      else
        raise exception 'role change is unavailable' using errcode = '42501';
      end if;
    else
      raise exception 'invalid account action' using errcode = '22023';
  end case;
  insert into public.marketplace_user_access_events(target_id, actor_id, action, reason)
    values (p_user_id, auth.uid(), p_action, v_reason);
end;
$$;
revoke all on function public.marketplace_manage_user_access(uuid, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.marketplace_manage_user_access(uuid, text, text, text, boolean) to authenticated;
commit;
