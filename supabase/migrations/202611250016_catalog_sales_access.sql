-- Delegate VERSAX catalog work without assigning a platform role or creating an application.
-- Apply after the single-vendor transition (202611220014).
begin;

do $$
begin
  if has_function_privilege('authenticated', 'public.marketplace_set_seller_intake(boolean)', 'EXECUTE') then
    raise exception 'single-vendor transition must precede catalog selling access' using errcode = '55000';
  end if;
end;
$$;

create table marketplace_private.catalog_sales_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  scope text not null check (scope in ('cs2', 'fashion', 'both', 'none')),
  revision uuid not null default gen_random_uuid()
);

create table marketplace_private.catalog_sales_access_audit (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  previous_scope text,
  scope text not null,
  created_at timestamptz not null default now()
);

alter table marketplace_private.catalog_sales_access enable row level security;
alter table marketplace_private.catalog_sales_access_audit enable row level security;
revoke all on marketplace_private.catalog_sales_access,
  marketplace_private.catalog_sales_access_audit from public, anon, authenticated;

create function marketplace_private.legacy_seller_scope(p_user_id uuid, p_revision integer default null)
returns text language sql stable security definer set search_path = '' as $$
  select a.requested_scope
  from public.marketplace_seller_grants g
  join public.marketplace_seller_applications a on a.applicant_id = g.seller_id
    and a.revision = g.application_revision
  where g.seller_id = p_user_id and a.status = 'approved'
    and (p_revision is null or g.application_revision = p_revision);
$$;
revoke all on function marketplace_private.legacy_seller_scope(uuid, integer) from public, anon, authenticated;

create function public.marketplace_admin_catalog_sales_access(p_user_id uuid)
returns table (scope text, revision uuid, legacy_scope text)
language sql stable security definer set search_path = '' as $$
  select s.scope, s.revision, marketplace_private.legacy_seller_scope(p.id)
  from public.marketplace_profiles p
  left join marketplace_private.catalog_sales_access s on s.user_id = p.id
  where p.id = p_user_id and (select marketplace_private.is_admin());
$$;

create function public.marketplace_own_catalog_sales_scope()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select scope from marketplace_private.catalog_sales_access where user_id = (select auth.uid())),
    case when exists (select 1 from public.marketplace_user_roles r
      where r.user_id = (select auth.uid()) and r.role in ('owner', 'admin'))
      then marketplace_private.legacy_seller_scope((select auth.uid())) end)
  where marketplace_private.is_active_user((select auth.uid()));
$$;

create function public.marketplace_set_catalog_sales_access(p_user_id uuid, p_scope text, p_expected_revision uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_previous marketplace_private.catalog_sales_access%rowtype;
  v_revision uuid;
begin
  if marketplace_private.is_admin() is not true then
    raise exception 'verified administrator access required' using errcode = '42501';
  end if;
  if p_user_id is null or p_scope is null or p_scope not in ('cs2', 'fashion', 'both', 'none') then
    raise exception 'invalid sales access' using errcode = '22023';
  end if;

  -- Share the privilege-mutation lock with role changes and suspensions.
  perform pg_advisory_xact_lock(202611210006);
  perform 1 from auth.users u where u.id = p_user_id
    and exists (select 1 from public.marketplace_profiles p where p.id = u.id)
    for update;
  if not found or (p_scope <> 'none' and not marketplace_private.is_active_user(p_user_id)) then
    raise exception 'account unavailable' using errcode = 'P0002';
  end if;
  if marketplace_private.is_admin() is not true or (
    exists (select 1 from public.marketplace_user_roles r where r.user_id = p_user_id)
    and not exists (select 1 from public.marketplace_user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'owner')
  ) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  select * into v_previous from marketplace_private.catalog_sales_access where user_id = p_user_id;
  if v_previous.revision is distinct from p_expected_revision then
    raise exception 'sales access changed' using errcode = '40001';
  end if;
  if v_previous.scope = p_scope then return v_previous.revision; end if;

  insert into marketplace_private.catalog_sales_access (user_id, scope) values (p_user_id, p_scope)
    on conflict (user_id) do update set scope = excluded.scope, revision = excluded.revision
    returning revision into v_revision;
  insert into marketplace_private.catalog_sales_access_audit (user_id, actor_id, previous_scope, scope)
    values (p_user_id, auth.uid(), v_previous.scope, p_scope);
  return v_revision;
end;
$$;

revoke all on function public.marketplace_admin_catalog_sales_access(uuid),
  public.marketplace_own_catalog_sales_scope(), public.marketplace_set_catalog_sales_access(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.marketplace_admin_catalog_sales_access(uuid),
  public.marketplace_own_catalog_sales_scope(), public.marketplace_set_catalog_sales_access(uuid, text, uuid)
  to authenticated;

-- Explicit permissions override legacy ones, including after revocation.
create or replace function marketplace_private.can_manage_listing(p_seller uuid, p_ecosystem text)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) = p_seller and (select auth.jwt() ->> 'aal') = 'aal2'
    and marketplace_private.has_verified_mfa() and coalesce(
      (select scope in (p_ecosystem, 'both') from marketplace_private.catalog_sales_access where user_id = p_seller),
      marketplace_private.is_admin() and marketplace_private.legacy_seller_scope(p_seller) in (p_ecosystem, 'both'), false);
$$;

-- A null revision identifies a listing saved under staff access. Old listings
-- keep their legacy revision until the operator saves them in the editor.
alter table public.marketplace_listings alter column seller_revision drop not null;

create or replace function marketplace_private.stamp_listing() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and exists (
    select 1 from marketplace_private.order_stock_context c where c.transaction_id = txid_current() and c.listing_id = old.id
  ) then
    new.seller_revision := old.seller_revision;
  elsif exists (select 1 from marketplace_private.catalog_sales_access s
    where s.user_id = new.seller_id and s.scope in (new.ecosystem, 'both')) then
    new.seller_revision := null;
  else
    select application_revision into new.seller_revision from public.marketplace_seller_grants where seller_id = new.seller_id;
  end if;
  new.updated_at := case when tg_op = 'UPDATE'
    then greatest(clock_timestamp(), old.updated_at + interval '1 microsecond')
    else clock_timestamp() end;
  return new;
end;
$$;

create or replace function marketplace_private.listing_is_public(p_listing uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.marketplace_listings l
    left join marketplace_private.catalog_sales_access s on s.user_id = l.seller_id
    where l.id = p_listing and l.state = 'published' and l.moderation_status = 'allowed'
      and marketplace_private.is_active_user(l.seller_id)
      and coalesce(s.scope in (l.ecosystem, 'both'), l.seller_revision is not null)
      and (l.seller_revision is null
        or marketplace_private.legacy_seller_scope(l.seller_id, l.seller_revision) in (l.ecosystem, 'both'))
  );
$$;

-- Include assigned CS2 staff in the existing reservation settings and Owner correction flow.
create function marketplace_private.can_set_cs2_reservation_terms(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select scope in ('cs2', 'both') from marketplace_private.catalog_sales_access where user_id = p_user_id),
    exists (select 1 from marketplace_private.cs2_reservation_operators where user_id = p_user_id)
  );
$$;
revoke all on function marketplace_private.can_set_cs2_reservation_terms(uuid) from public, anon, authenticated;

create or replace function marketplace_private.cs2_reservation_actor() returns text
language sql stable security definer set search_path = '' as $$
  select case when (select auth.jwt() ->> 'aal') = 'aal2' and marketplace_private.has_verified_mfa() then
    case when exists (select 1 from public.marketplace_user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'owner') then 'owner'
    when marketplace_private.can_set_cs2_reservation_terms((select auth.uid())) then 'operator' end
  end;
$$;
revoke all on function marketplace_private.cs2_reservation_actor() from public, anon, authenticated;

create or replace function public.marketplace_cs2_reservation_settings()
returns table (listing_id uuid, title text, variant text, revision uuid, seller_phone text,
  cs2_asset_id text, asset_editable boolean)
language sql stable security definer set search_path = '' as $$
  select l.id, l.title, l.variant, t.revision, t.seller_phone, t.cs2_asset_id,
    t.cs2_asset_id is null or (actor.role = 'owner' and not exists (
      select 1 from public.marketplace_orders o where o.listing_id = l.id and o.stock_state <> 'released'))
  from public.marketplace_listings l
  left join public.marketplace_checkout_terms t on t.listing_id = l.id
  cross join (select marketplace_private.cs2_reservation_actor() as role) actor
  where l.ecosystem = 'cs2' and l.state = 'published' and marketplace_private.listing_is_public(l.id)
    and marketplace_private.can_set_cs2_reservation_terms(l.seller_id)
    and (actor.role = 'owner' or (actor.role = 'operator' and l.seller_id = (select auth.uid())));
$$;

create or replace function public.marketplace_save_cs2_reservation_settings(p_listing_id uuid,
  p_expected_revision uuid, p_seller_phone text, p_cs2_asset_id text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_listing public.marketplace_listings%rowtype;
  v_terms public.marketplace_checkout_terms%rowtype;
  v_actor text;
  v_revision uuid;
begin
  v_actor := marketplace_private.cs2_reservation_actor();
  if v_actor is null then
    raise exception 'CS2 reservation access required' using errcode = '42501';
  end if;
  if coalesce(p_seller_phone, '') !~ '^[+][1-9][0-9]{7,14}$'
    or coalesce(p_cs2_asset_id, '') !~ '^[1-9][0-9]{0,19}$' then
    raise exception 'invalid checkout terms' using errcode = '22023';
  end if;

  -- The reservation RPC takes the same listing lock before reading terms.
  select * into v_listing from public.marketplace_listings
    where id = p_listing_id and ecosystem = 'cs2' and (v_actor = 'owner' or seller_id = (select auth.uid())) for update;
  if not found then raise exception 'CS2 reservation access required' using errcode = '42501'; end if;
  perform 1 from auth.users where id in ((select auth.uid()), v_listing.seller_id) order by id for share;
  perform 1 from marketplace_private.cs2_reservation_operators where user_id = v_listing.seller_id for share;
  v_actor := marketplace_private.cs2_reservation_actor();
  if v_actor is null or (v_actor = 'operator' and v_listing.seller_id <> (select auth.uid()))
    or marketplace_private.can_set_cs2_reservation_terms(v_listing.seller_id) is not true
    or marketplace_private.listing_is_public(p_listing_id) is not true then
    raise exception 'CS2 reservation access required' using errcode = '42501';
  end if;

  select * into v_terms from public.marketplace_checkout_terms where listing_id = p_listing_id;
  if v_terms.revision is distinct from p_expected_revision then
    raise exception 'checkout terms changed' using errcode = '40001';
  end if;
  if v_terms.cs2_asset_id is not null and v_terms.cs2_asset_id <> p_cs2_asset_id then
    if v_actor <> 'owner' then raise exception 'owner access required to change the asset' using errcode = '42501'; end if;
    if exists (select 1 from public.marketplace_orders where listing_id = p_listing_id and stock_state <> 'released') then
      raise exception 'asset still belongs to an order' using errcode = '23514';
    end if;
  end if;
  if v_terms.seller_phone = p_seller_phone and v_terms.cs2_asset_id = p_cs2_asset_id then
    return v_terms.revision;
  end if;

  insert into public.marketplace_checkout_terms (listing_id, seller_phone, shipping_tiyin, cs2_asset_id)
    values (p_listing_id, p_seller_phone, 0, p_cs2_asset_id)
  on conflict (listing_id) do update set seller_phone = excluded.seller_phone,
    cs2_asset_id = excluded.cs2_asset_id, revision = excluded.revision
  returning revision into v_revision;
  insert into marketplace_private.cs2_reservation_settings_audit (listing_id, actor_id, previous_revision, revision)
    values (p_listing_id, auth.uid(), v_terms.revision, v_revision);
  return v_revision;
end;
$$;

create or replace function public.marketplace_reserve_order(p_id uuid, p_listing_id uuid, p_quote text, p_quantity integer,
  p_delivery_name text, p_delivery_phone text, p_delivery_address text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_buyer uuid := auth.uid();
  v_listing public.marketplace_listings%rowtype;
  v_terms public.marketplace_checkout_terms%rowtype;
  v_existing public.marketplace_orders%rowtype;
  v_total numeric;
begin
  if marketplace_private.active_order_account() is not true then raise exception 'account access required' using errcode = '42501'; end if;
  if p_id is null or p_listing_id is null or coalesce(p_quote, '') !~ '^[0-9a-f]{64}$'
    or p_quantity is null or p_quantity not between 1 and 1000000 then
    raise exception 'invalid reservation' using errcode = '22023';
  end if;
  select * into v_listing from public.marketplace_listings where id = p_listing_id for update;
  if not found then raise exception 'listing unavailable' using errcode = 'P0002'; end if;
  select * into v_existing from public.marketplace_orders where id = p_id;
  if found then
    if (v_existing.buyer_id, v_existing.listing_id, v_existing.quote, v_existing.quantity,
        v_existing.delivery_name, v_existing.delivery_phone, v_existing.delivery_address)
        is distinct from (v_buyer, p_listing_id, p_quote, p_quantity, p_delivery_name, p_delivery_phone, p_delivery_address) then
      raise exception 'reservation reference already used' using errcode = '23505';
    end if;
    return v_existing.id;
  end if;
  if (select accepting_orders and v_listing.ecosystem = any(accepting_ecosystems)
      from marketplace_private.direct_order_settings for share) is not true
    or v_listing.seller_id = v_buyer or v_listing.state <> 'published' or v_listing.moderation_status <> 'allowed'
    or v_listing.quantity < p_quantity then raise exception 'listing unavailable' using errcode = 'P0002'; end if;

  -- Catalog access changes take an exclusive lock on the same seller row.
  perform 1 from auth.users where id in (v_buyer, v_listing.seller_id) order by id for share;
  if marketplace_private.active_order_account() is not true then raise exception 'account access required' using errcode = '42501'; end if;
  if marketplace_private.listing_is_public(v_listing.id) is not true then
    raise exception 'listing unavailable' using errcode = 'P0002';
  end if;
  if v_listing.seller_revision is not null then
    perform 1 from public.marketplace_seller_grants g join public.marketplace_seller_applications a
      on a.applicant_id = g.seller_id and a.revision = g.application_revision
      where g.seller_id = v_listing.seller_id and g.application_revision = v_listing.seller_revision
        and a.status = 'approved' and a.requested_scope in (v_listing.ecosystem, 'both') for share of a, g;
    if not found then raise exception 'listing unavailable' using errcode = 'P0002'; end if;
  end if;

  select * into v_terms from public.marketplace_checkout_terms where listing_id = p_listing_id;
  if not found then raise exception 'checkout terms unavailable' using errcode = 'P0002'; end if;
  if p_quote <> marketplace_private.checkout_quote(v_listing, v_terms.revision) then
    raise exception 'quote changed' using errcode = '40001';
  end if;
  if v_listing.ecosystem = 'fashion' then
    if coalesce(char_length(btrim(p_delivery_name)), 0) not between 1 and 120 or p_delivery_name ~ '[[:cntrl:]]'
      or coalesce(p_delivery_phone, '') !~ '^[+][1-9][0-9]{7,14}$'
      or coalesce(char_length(btrim(p_delivery_address)), 0) not between 5 and 500 or p_delivery_address ~ '[[:cntrl:]]' then
      raise exception 'invalid delivery information' using errcode = '22023';
    end if;
  elsif p_delivery_name is not null or p_delivery_phone is not null or p_delivery_address is not null then
    raise exception 'shipping address is only applicable to clothing' using errcode = '22023';
  end if;
  v_total := v_listing.price_tiyin::numeric * p_quantity + v_terms.shipping_tiyin;
  if v_total > 100000000000000 then raise exception 'order total exceeds accepted precision range' using errcode = '22023'; end if;

  perform marketplace_private.adjust_order_stock(p_listing_id, -p_quantity);
  insert into public.marketplace_orders(id, listing_id, buyer_id, seller_id, ecosystem, title, category, variant, description, quote, quantity,
    unit_price_tiyin, shipping_tiyin, total_tiyin, seller_phone, cs2_asset_id, delivery_name, delivery_phone, delivery_address)
  values (p_id, p_listing_id, v_buyer, v_listing.seller_id, v_listing.ecosystem, v_listing.title, v_listing.category, v_listing.variant,
    v_listing.description, p_quote, p_quantity, v_listing.price_tiyin, v_terms.shipping_tiyin, v_total, v_terms.seller_phone,
    v_terms.cs2_asset_id, p_delivery_name, p_delivery_phone, p_delivery_address);
  insert into public.marketplace_order_events(order_id, actor_id, actor_role, action) values (p_id, v_buyer, 'buyer', 'reserved');
  return p_id;
end;
$$;

commit;
