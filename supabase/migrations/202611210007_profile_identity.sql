-- Owner-requested, manually reviewed identity checks for individual accounts.
begin;

create table public.marketplace_profile_identity_requests (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'verified', 'not_verified', 'cancelled')),
  code uuid default gen_random_uuid(),
  check ((status = 'pending' and code is not null and reviewed_at is null)
    or (status <> 'pending' and code is null and reviewed_at is not null))
);

create index marketplace_profile_identity_subject_history
  on public.marketplace_profile_identity_requests (subject_id, created_at desc, id desc);
create unique index marketplace_profile_identity_pending
  on public.marketplace_profile_identity_requests (subject_id) where status = 'pending';

create function marketplace_private.can_manage_profile_identity() returns boolean
language sql stable security definer set search_path = '' as $$
  select marketplace_private.is_admin() and exists (
    select 1 from public.marketplace_user_roles where user_id = (select auth.uid()) and role = 'owner'
  );
$$;
revoke all on function marketplace_private.can_manage_profile_identity() from public, anon, authenticated;
grant execute on function marketplace_private.can_manage_profile_identity() to authenticated;

alter table public.marketplace_profile_identity_requests enable row level security;
revoke all on public.marketplace_profile_identity_requests from public, anon, authenticated;
grant select (id, subject_id, created_at, reviewed_at, status)
  on public.marketplace_profile_identity_requests to authenticated;

create policy profile_identity_read on public.marketplace_profile_identity_requests for select to authenticated
  using ((select marketplace_private.can_manage_profile_identity())
    or (subject_id = (select auth.uid()) and (select marketplace_private.mfa_satisfied())));

create function public.marketplace_request_profile_identity(p_subject_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if marketplace_private.can_manage_profile_identity() is not true then
    raise exception 'owner access required' using errcode = '42501';
  end if;
  if p_subject_id is null or p_subject_id = (select auth.uid()) or marketplace_private.is_active_user(p_subject_id) is not true then
    raise exception 'profile unavailable' using errcode = '42501';
  end if;
  insert into public.marketplace_profile_identity_requests (subject_id, created_by)
    values (p_subject_id, (select auth.uid())) returning id into v_id;
  return v_id;
end;
$$;

create function public.marketplace_own_profile_identity_code(p_request_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select code from public.marketplace_profile_identity_requests
    where id = p_request_id and status = 'pending' and subject_id = (select auth.uid())
      and (select marketplace_private.mfa_satisfied());
$$;

create function public.marketplace_review_profile_identity(p_request_id uuid, p_subject_id uuid, p_decision text, p_code uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if marketplace_private.can_manage_profile_identity() is not true then
    raise exception 'owner access required' using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('verified', 'not_verified', 'cancelled') then
    raise exception 'invalid identity decision' using errcode = '22023';
  end if;
  update public.marketplace_profile_identity_requests
    set status = p_decision, reviewed_at = now(), reviewed_by = (select auth.uid()), code = null
    where id = p_request_id and subject_id = p_subject_id and subject_id <> (select auth.uid()) and status = 'pending'
      and (p_decision = 'cancelled' or code = p_code);
  if not found then raise exception 'pending request or code did not match' using errcode = 'P0002'; end if;
end;
$$;

revoke all on function public.marketplace_request_profile_identity(uuid), public.marketplace_own_profile_identity_code(uuid),
  public.marketplace_review_profile_identity(uuid, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.marketplace_request_profile_identity(uuid), public.marketplace_own_profile_identity_code(uuid),
  public.marketplace_review_profile_identity(uuid, uuid, text, uuid) to authenticated;
commit;
