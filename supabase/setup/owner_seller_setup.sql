-- TARGET: project xevzbtivteugbqbmmtyz ONLY. Verify the dashboard project URL first.
-- Generated from repository migrations. Never run on another application.
-- This transaction does not grant an owner role or delete existing user data.
begin;
do $$
declare relation_name text;
begin
  if to_regclass('public.marketplace_user_roles') is null or to_regclass('public.marketplace_profiles') is null then
    raise exception 'Marketplace account tables are missing; stop and inspect the project';
  end if;
  if not coalesce((select relrowsecurity from pg_catalog.pg_class where oid = 'public.marketplace_profiles'::regclass), false)
     or not coalesce((select relrowsecurity from pg_catalog.pg_class where oid = 'public.marketplace_user_roles'::regclass), false)
     or not exists (select 1 from pg_catalog.pg_policy where polrelid = 'public.marketplace_profiles'::regclass and polname = 'marketplace_profile_read')
     or not exists (select 1 from pg_catalog.pg_policy where polrelid = 'public.marketplace_user_roles'::regclass and polname = 'marketplace_role_read')
     or to_regprocedure('marketplace_private.is_admin()') is null
     or has_table_privilege('anon', 'public.marketplace_profiles', 'SELECT')
     or has_table_privilege('anon', 'public.marketplace_user_roles', 'SELECT') then
    raise exception 'Accounts security prerequisites are missing; stop and inspect the existing installation';
  end if;
  if not exists (
    select 1 from auth.users u join public.marketplace_user_roles r on r.user_id = u.id
    where lower(u.email) = 'sattorovkamronbek2@gmail.com' and u.email_confirmed_at is not null and r.role = 'owner'
  ) then
    raise exception 'Confirmed designated owner role not found; inspect the owner UUID and do not proceed';
  end if;
  foreach relation_name in array array[
    'marketplace_seller_applications', 'marketplace_seller_review_audit',
    'marketplace_seller_revision_audit', 'marketplace_seller_grants',
    'marketplace_seller_identity_challenges', 'marketplace_seller_verification_audit',
    'marketplace_listings', 'marketplace_listing_audit', 'marketplace_public_listings'
  ] loop
    if to_regclass('public.' || relation_name) is not null then
      raise exception 'Seller setup is already present or partial (%); stop and inspect', relation_name;
    end if;
  end loop;
end $$;

-- Migration: 202611160001_seller_applications.sql
-- Additive seller application intake for the dedicated marketplace project.
-- Approval records a review only; seller catalog authority is a separate phase.

create table public.marketplace_seller_applications (
  applicant_id uuid primary key references auth.users(id) on delete cascade,
  applicant_type text not null check (applicant_type in ('individual', 'company')),
  name text not null check (char_length(btrim(name)) between 1 and 120 and name !~ '[[:cntrl:]]'),
  contact text not null check (char_length(btrim(contact)) between 1 and 200 and contact !~ '[[:cntrl:]]'),
  region text not null check (char_length(btrim(region)) between 1 and 120 and region !~ '[[:cntrl:]]'),
  requested_scope text not null check (requested_scope in ('cs2', 'fashion', 'both')),
  registration_details text check (registration_details is null or (char_length(btrim(registration_details)) between 1 and 200 and registration_details !~ '[[:cntrl:]]')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (applicant_type <> 'company' or registration_details is not null)
);

create index marketplace_seller_applications_status_created_idx
  on public.marketplace_seller_applications(status, created_at, applicant_id);

create table public.marketplace_seller_review_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  applicant_id uuid references auth.users(id) on delete set null,
  decision text not null check (decision in ('approved', 'rejected', 'reopen')),
  revision integer not null check (revision > 0),
  requested_scope text not null check (requested_scope in ('cs2', 'fashion', 'both')),
  created_at timestamptz not null default now()
);

create table public.marketplace_seller_revision_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  applicant_id uuid references auth.users(id) on delete set null,
  old_scope text not null check (old_scope in ('cs2', 'fashion', 'both')),
  new_scope text not null check (new_scope in ('cs2', 'fashion', 'both')),
  revision integer not null check (revision > 0),
  created_at timestamptz not null default now()
);

alter table public.marketplace_seller_applications enable row level security;
alter table public.marketplace_seller_review_audit enable row level security;
alter table public.marketplace_seller_revision_audit enable row level security;
revoke all on public.marketplace_seller_applications, public.marketplace_seller_review_audit, public.marketplace_seller_revision_audit from public, anon, authenticated;
grant select on public.marketplace_seller_applications to authenticated;
grant insert (applicant_id, applicant_type, name, contact, region, requested_scope, registration_details)
  on public.marketplace_seller_applications to authenticated;
grant select on public.marketplace_seller_review_audit to authenticated;
grant select on public.marketplace_seller_revision_audit to authenticated;

create policy seller_application_read on public.marketplace_seller_applications
  for select to authenticated
  using (applicant_id = (select auth.uid()) or (select marketplace_private.is_admin()));
create policy seller_application_submit on public.marketplace_seller_applications
  for insert to authenticated with check (applicant_id = (select auth.uid()));
create policy seller_audit_admin_read on public.marketplace_seller_review_audit
  for select to authenticated using ((select marketplace_private.is_admin()));
create policy seller_revision_audit_admin_read on public.marketplace_seller_revision_audit
  for select to authenticated using ((select marketplace_private.is_admin()));

create function public.marketplace_review_seller_application(p_applicant_id uuid, p_decision text, p_revision integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_scope text;
begin
  if not marketplace_private.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected', 'reopen') or p_decision is null then
    raise exception 'invalid decision' using errcode = '22023';
  end if;
  if p_decision = 'reopen' then
    update public.marketplace_seller_applications
      set status = 'pending', reviewed_at = null, revision = revision + 1
      where applicant_id = p_applicant_id and status in ('approved', 'rejected') and revision = p_revision
      returning requested_scope into v_scope;
  else
    update public.marketplace_seller_applications
      set status = p_decision, reviewed_at = now()
      where applicant_id = p_applicant_id and status = 'pending' and revision = p_revision
      returning requested_scope into v_scope;
  end if;
  if not found then
    raise exception 'pending application not found' using errcode = 'P0002';
  end if;
  insert into public.marketplace_seller_review_audit(actor_id, applicant_id, decision, revision, requested_scope)
    values (auth.uid(), p_applicant_id, p_decision, p_revision, v_scope);
end;
$$;
revoke all on function public.marketplace_review_seller_application(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.marketplace_review_seller_application(uuid, text, integer) to authenticated;

create function public.marketplace_resubmit_seller_application(
  p_type text, p_name text, p_contact text, p_region text, p_scope text, p_registration text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_old_scope text; v_revision integer;
begin
  select requested_scope into v_old_scope from public.marketplace_seller_applications
    where applicant_id = (select auth.uid()) and status in ('pending', 'rejected') for update;
  if not found then
    raise exception 'editable application not found' using errcode = 'P0002';
  end if;
  update public.marketplace_seller_applications
    set applicant_type = p_type, name = p_name, contact = p_contact,
        region = p_region, requested_scope = p_scope, registration_details = p_registration,
        status = 'pending', reviewed_at = null, revision = revision + 1
    where applicant_id = (select auth.uid()) and status in ('pending', 'rejected')
    returning revision into v_revision;
  insert into public.marketplace_seller_revision_audit(actor_id, applicant_id, old_scope, new_scope, revision)
    values (auth.uid(), auth.uid(), v_old_scope, p_scope, v_revision);
end;
$$;
revoke all on function public.marketplace_resubmit_seller_application(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.marketplace_resubmit_seller_application(text, text, text, text, text, text) to authenticated;


-- Migration: 202611160002_owner_role.sql
-- Add an independently provisioned owner role. No user is promoted here.

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


-- Migration: 202611160003_seller_catalog.sql
-- Dedicated marketplace only. Seller verification and catalog are not payment acceptance.

create table public.marketplace_seller_grants (
  seller_id uuid primary key references auth.users(id) on delete cascade,
  application_revision integer not null check (application_revision > 0),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz not null default now()
);
create table public.marketplace_seller_verification_audit (
  id bigint generated always as identity primary key,
  seller_id uuid references auth.users(id) on delete set null,
  verified_by uuid references auth.users(id) on delete set null,
  application_revision integer not null check (application_revision > 0),
  approved_scope text not null check (approved_scope in ('cs2', 'fashion', 'both')),
  created_at timestamptz not null default now()
);
create table public.marketplace_seller_identity_challenges (
  seller_id uuid primary key references auth.users(id) on delete cascade,
  application_revision integer not null check (application_revision > 0),
  code_hash bytea not null,
  expires_at timestamptz not null
);

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  seller_revision integer not null check (seller_revision > 0),
  ecosystem text not null check (ecosystem in ('cs2', 'fashion')),
  title text not null check (char_length(btrim(title)) between 1 and 120 and title !~ '[[:cntrl:]]'),
  description text not null check (char_length(btrim(description)) between 1 and 4000),
  category text not null default '' check (char_length(category) <= 80 and category !~ '[[:cntrl:]]'),
  variant text not null default '' check (char_length(variant) <= 80 and variant !~ '[[:cntrl:]]'),
  price_tiyin bigint not null check (price_tiyin between 1 and 100000000000000),
  quantity integer not null check (quantity between 0 and 1000000),
  state text not null default 'draft' check (state in ('draft', 'published', 'archived')),
  moderation_status text not null default 'allowed' check (moderation_status in ('allowed', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ecosystem <> 'cs2' or quantity <= 1)
);
create index marketplace_listings_seller_created_idx on public.marketplace_listings(seller_id, created_at desc, id desc);
create index marketplace_listings_published_idx on public.marketplace_listings(ecosystem, created_at desc, id desc) where state = 'published';

create table public.marketplace_listing_audit (
  id bigint generated always as identity primary key,
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  state text not null check (state in ('draft', 'published', 'archived')),
  moderation_status text not null check (moderation_status in ('allowed', 'blocked')),
  operation text not null check (operation in ('INSERT', 'UPDATE')),
  price_tiyin bigint not null,
  quantity integer not null,
  created_at timestamptz not null default now()
);

alter table public.marketplace_seller_grants enable row level security;
alter table public.marketplace_seller_verification_audit enable row level security;
alter table public.marketplace_seller_identity_challenges enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_listing_audit enable row level security;
revoke all on public.marketplace_seller_grants, public.marketplace_seller_verification_audit, public.marketplace_seller_identity_challenges, public.marketplace_listings, public.marketplace_listing_audit from public, anon, authenticated;
grant select on public.marketplace_seller_grants to authenticated;
grant select on public.marketplace_seller_verification_audit, public.marketplace_listing_audit to authenticated;
grant select on public.marketplace_listings to authenticated;
grant insert (id, seller_id, ecosystem, title, description, category, variant, price_tiyin, quantity, state) on public.marketplace_listings to authenticated;
grant update (ecosystem, title, description, category, variant, price_tiyin, quantity, state) on public.marketplace_listings to authenticated;

-- Existing review and reopening now affect seller authority and require MFA too.
create or replace function public.marketplace_review_seller_application(p_applicant_id uuid, p_decision text, p_revision integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_scope text;
begin
  if not marketplace_private.is_admin() or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'verified administrator session required' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected', 'reopen') or p_decision is null then
    raise exception 'invalid decision' using errcode = '22023';
  end if;
  if p_decision = 'approved' then
    raise exception 'verification challenge required' using errcode = '42501';
  end if;
  if p_decision = 'reopen' then
    update public.marketplace_seller_applications
      set status = 'pending', reviewed_at = null, revision = revision + 1
      where applicant_id = p_applicant_id and status in ('approved', 'rejected') and revision = p_revision
      returning requested_scope into v_scope;
  else
    update public.marketplace_seller_applications
      set status = p_decision, reviewed_at = now()
      where applicant_id = p_applicant_id and status = 'pending' and revision = p_revision
      returning requested_scope into v_scope;
  end if;
  if not found then raise exception 'pending application not found' using errcode = 'P0002'; end if;
  insert into public.marketplace_seller_review_audit(actor_id, applicant_id, decision, revision, requested_scope)
    values (auth.uid(), p_applicant_id, p_decision, p_revision, v_scope);
end;
$$;

-- The seller shares this site's one-time code with the administrator during the
-- independently verified offline identity check. The database stores only a hash.
create function public.marketplace_create_seller_challenge() returns text
language plpgsql security definer set search_path = '' as $$
declare v_revision integer; v_code text;
begin
  if (select auth.uid()) is null or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'verified seller session required' using errcode = '42501';
  end if;
  select revision into v_revision from public.marketplace_seller_applications
    where applicant_id = (select auth.uid()) and status = 'pending' for update;
  if not found then raise exception 'pending application not found' using errcode = 'P0002'; end if;
  v_code := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.marketplace_seller_identity_challenges(seller_id, application_revision, code_hash, expires_at)
    values (auth.uid(), v_revision, sha256(convert_to(v_code, 'UTF8')), now() + interval '10 minutes')
    on conflict (seller_id) do update set application_revision = excluded.application_revision,
      code_hash = excluded.code_hash, expires_at = excluded.expires_at;
  return v_code;
end;
$$;
revoke all on function public.marketplace_create_seller_challenge() from public, anon, authenticated;
grant execute on function public.marketplace_create_seller_challenge() to authenticated;

create policy seller_grants_read on public.marketplace_seller_grants for select to authenticated
  using (seller_id = (select auth.uid()) or (select marketplace_private.is_admin()));
create policy seller_verification_audit_admin_read on public.marketplace_seller_verification_audit for select to authenticated
  using ((select marketplace_private.is_admin()) and (select auth.jwt() ->> 'aal') = 'aal2');
create policy listing_audit_admin_read on public.marketplace_listing_audit for select to authenticated
  using ((select marketplace_private.is_admin()) and (select auth.jwt() ->> 'aal') = 'aal2');

create function marketplace_private.can_manage_listing(p_seller uuid, p_ecosystem text)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) = p_seller and (select auth.jwt() ->> 'aal') = 'aal2' and exists (
    select 1 from public.marketplace_seller_grants g
    join public.marketplace_seller_applications a on a.applicant_id = g.seller_id
    where g.seller_id = p_seller and a.status = 'approved'
      and a.revision = g.application_revision and a.requested_scope in (p_ecosystem, 'both')
  );
$$;
revoke all on function marketplace_private.can_manage_listing(uuid, text) from public, anon, authenticated;
grant execute on function marketplace_private.can_manage_listing(uuid, text) to authenticated;

create function marketplace_private.listing_is_public(p_listing uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_seller_grants g on g.seller_id = l.seller_id and g.application_revision = l.seller_revision
    join public.marketplace_seller_applications a on a.applicant_id = g.seller_id and a.revision = g.application_revision
    where l.id = p_listing and l.state = 'published' and l.moderation_status = 'allowed' and a.status = 'approved'
      and a.requested_scope in (l.ecosystem, 'both')
  );
$$;
revoke all on function marketplace_private.listing_is_public(uuid) from public, anon, authenticated;
grant usage on schema marketplace_private to anon;
grant execute on function marketplace_private.listing_is_public(uuid) to anon, authenticated;

create policy listing_owner_read on public.marketplace_listings for select to authenticated
  using (marketplace_private.can_manage_listing(seller_id, ecosystem));
create policy listing_admin_read on public.marketplace_listings for select to authenticated
  using ((select marketplace_private.is_admin()) and (select auth.jwt() ->> 'aal') = 'aal2');
create policy listing_seller_insert on public.marketplace_listings for insert to authenticated
  with check (marketplace_private.can_manage_listing(seller_id, ecosystem));
create policy listing_seller_update on public.marketplace_listings for update to authenticated
  using (moderation_status = 'allowed' and marketplace_private.can_manage_listing(seller_id, ecosystem))
  with check (moderation_status = 'allowed' and marketplace_private.can_manage_listing(seller_id, ecosystem));

-- Deliberately exclude exact stock, seller identity and authorization revision.
create view public.marketplace_public_listings with (security_barrier = true) as
  select id, ecosystem, title, description, category, variant, price_tiyin,
    (quantity > 0) as available, created_at
  from public.marketplace_listings where marketplace_private.listing_is_public(id);
revoke all on public.marketplace_public_listings from public, anon, authenticated;
grant select on public.marketplace_public_listings to anon, authenticated;

create function marketplace_private.stamp_listing() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select application_revision into new.seller_revision from public.marketplace_seller_grants where seller_id = new.seller_id;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function marketplace_private.stamp_listing() from public, anon, authenticated;
create trigger marketplace_listing_stamp before insert or update on public.marketplace_listings
  for each row execute function marketplace_private.stamp_listing();

create function marketplace_private.audit_listing() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.marketplace_listing_audit(listing_id, actor_id, state, moderation_status, operation, price_tiyin, quantity)
    values (new.id, auth.uid(), new.state, new.moderation_status, tg_op, new.price_tiyin, new.quantity);
  return new;
end;
$$;
revoke all on function marketplace_private.audit_listing() from public, anon, authenticated;
create trigger marketplace_listing_audit after insert or update on public.marketplace_listings
  for each row execute function marketplace_private.audit_listing();

-- An administrator explicitly attests offline verification of the exact revision.
-- Existing approvals alone intentionally do not grant listing authority.
create function public.marketplace_verify_seller(p_applicant_id uuid, p_revision integer, p_code text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_scope text;
begin
  if not marketplace_private.is_admin() or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'verified administrator session required' using errcode = '42501';
  end if;
  if p_code is null or p_code !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid verification code' using errcode = '22023';
  end if;
  select requested_scope into v_scope from public.marketplace_seller_applications
    where applicant_id = p_applicant_id and revision = p_revision and status = 'pending' for update;
  if not found then raise exception 'pending application not found' using errcode = 'P0002'; end if;
  delete from public.marketplace_seller_identity_challenges
    where seller_id = p_applicant_id and application_revision = p_revision
      and expires_at > now() and code_hash = sha256(convert_to(p_code, 'UTF8'));
  if not found then raise exception 'invalid verification code' using errcode = '42501'; end if;
  update public.marketplace_seller_applications set status = 'approved', reviewed_at = now()
    where applicant_id = p_applicant_id and revision = p_revision and status = 'pending';
  if not found then raise exception 'pending application not found' using errcode = 'P0002'; end if;
  insert into public.marketplace_seller_review_audit(actor_id, applicant_id, decision, revision, requested_scope)
    values (auth.uid(), p_applicant_id, 'approved', p_revision, v_scope);
  insert into public.marketplace_seller_grants(seller_id, application_revision, verified_by, verified_at)
    values (p_applicant_id, p_revision, auth.uid(), now())
    on conflict (seller_id) do update set application_revision = excluded.application_revision,
      verified_by = excluded.verified_by, verified_at = excluded.verified_at;
  insert into public.marketplace_seller_verification_audit(seller_id, verified_by, application_revision, approved_scope)
    values (p_applicant_id, auth.uid(), p_revision, v_scope);
end;
$$;
revoke all on function public.marketplace_verify_seller(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.marketplace_verify_seller(uuid, integer, text) to authenticated;

create function public.marketplace_admin_archive_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not marketplace_private.is_admin() or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'verified administrator session required' using errcode = '42501';
  end if;
  update public.marketplace_listings set state = 'archived', moderation_status = 'blocked' where id = p_listing_id;
  if not found then raise exception 'listing not found' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.marketplace_admin_archive_listing(uuid) from public, anon, authenticated;
grant execute on function public.marketplace_admin_archive_listing(uuid) to authenticated;

create function public.marketplace_admin_restore_listing(p_listing_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not marketplace_private.is_admin() or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'verified administrator session required' using errcode = '42501';
  end if;
  update public.marketplace_listings set state = 'draft', moderation_status = 'allowed' where id = p_listing_id;
  if not found then raise exception 'listing not found' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.marketplace_admin_restore_listing(uuid) from public, anon, authenticated;
grant execute on function public.marketplace_admin_restore_listing(uuid) to authenticated;


-- Migration: 202611180004_enforce_mfa.sql
-- Require step-up for MFA-enrolled users and all private administrative access.

create function marketplace_private.has_verified_mfa() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status::text = 'verified');
$$;
create function marketplace_private.mfa_satisfied() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (not marketplace_private.has_verified_mfa() or coalesce((select auth.jwt() ->> 'aal') = 'aal2', false));
$$;
revoke all on function marketplace_private.has_verified_mfa(), marketplace_private.mfa_satisfied() from public, anon, authenticated;
grant execute on function marketplace_private.has_verified_mfa(), marketplace_private.mfa_satisfied() to authenticated;
create or replace function marketplace_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false) and marketplace_private.has_verified_mfa() and exists (
    select 1 from public.marketplace_user_roles r join auth.users u on u.id = r.user_id
    where r.user_id = (select auth.uid()) and r.role in ('admin', 'owner') and u.email_confirmed_at is not null
  );
$$;
create policy mfa_required on public.marketplace_profiles as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_user_roles as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_applications as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_review_audit as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_revision_audit as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_grants as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_verification_audit as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_listing_audit as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_listings as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create or replace function public.marketplace_resubmit_seller_application(
  p_type text, p_name text, p_contact text, p_region text, p_scope text, p_registration text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_old_scope text; v_revision integer;
begin
  if marketplace_private.mfa_satisfied() is not true then raise exception 'MFA required' using errcode = '42501'; end if;
  select requested_scope into v_old_scope from public.marketplace_seller_applications
    where applicant_id = (select auth.uid()) and status in ('pending', 'rejected') for update;
  if not found then
    raise exception 'editable application not found' using errcode = 'P0002';
  end if;
  update public.marketplace_seller_applications
    set applicant_type = p_type, name = p_name, contact = p_contact,
        region = p_region, requested_scope = p_scope, registration_details = p_registration,
        status = 'pending', reviewed_at = null, revision = revision + 1
    where applicant_id = (select auth.uid()) and status in ('pending', 'rejected')
    returning revision into v_revision;
  insert into public.marketplace_seller_revision_audit(actor_id, applicant_id, old_scope, new_scope, revision)
    values (auth.uid(), auth.uid(), v_old_scope, p_scope, v_revision);
end;
$$;

create or replace function public.marketplace_create_seller_challenge() returns text
language plpgsql security definer set search_path = '' as $$
declare v_revision integer; v_code text;
begin
  if not marketplace_private.has_verified_mfa() or (select auth.uid()) is null or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'verified seller session required' using errcode = '42501';
  end if;
  select revision into v_revision from public.marketplace_seller_applications
    where applicant_id = (select auth.uid()) and status = 'pending' for update;
  if not found then raise exception 'pending application not found' using errcode = 'P0002'; end if;
  v_code := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.marketplace_seller_identity_challenges(seller_id, application_revision, code_hash, expires_at)
    values (auth.uid(), v_revision, sha256(convert_to(v_code, 'UTF8')), now() + interval '10 minutes')
    on conflict (seller_id) do update set application_revision = excluded.application_revision,
      code_hash = excluded.code_hash, expires_at = excluded.expires_at;
  return v_code;
end;
$$;

create or replace function marketplace_private.can_manage_listing(p_seller uuid, p_ecosystem text)
returns boolean language sql stable security definer set search_path = '' as $$
  select marketplace_private.has_verified_mfa() and (select auth.uid()) = p_seller and (select auth.jwt() ->> 'aal') = 'aal2' and exists (
    select 1 from public.marketplace_seller_grants g
    join public.marketplace_seller_applications a on a.applicant_id = g.seller_id
    where g.seller_id = p_seller and a.status = 'approved'
      and a.revision = g.application_revision and a.requested_scope in (p_ecosystem, 'both')
  );
$$;

commit;
