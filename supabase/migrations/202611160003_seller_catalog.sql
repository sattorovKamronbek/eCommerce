-- Dedicated marketplace only. Seller verification and catalog are not payment acceptance.
begin;

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

commit;
