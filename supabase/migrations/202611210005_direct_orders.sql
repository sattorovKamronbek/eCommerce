-- Applies after the accounts, seller catalog and MFA migrations.
begin;

create table marketplace_private.direct_order_settings (
  singleton boolean primary key default true check (singleton),
  accepting_orders boolean not null default false
);
insert into marketplace_private.direct_order_settings default values;

create table public.marketplace_checkout_terms (
  listing_id uuid primary key references public.marketplace_listings(id) on delete cascade,
  revision uuid not null default gen_random_uuid(),
  seller_phone text not null check (seller_phone ~ '^[+][1-9][0-9]{7,14}$'),
  shipping_tiyin bigint not null check (shipping_tiyin between 0 and 100000000000000),
  cs2_asset_id text unique check (cs2_asset_id ~ '^[1-9][0-9]{0,19}$')
);

create table public.marketplace_orders (
  id uuid primary key,
  listing_id uuid not null references public.marketplace_listings(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  ecosystem text not null check (ecosystem in ('cs2', 'fashion')),
  title text not null,
  category text not null,
  variant text not null,
  description text not null,
  quote text not null,
  quantity integer not null check (quantity between 1 and 1000000),
  unit_price_tiyin bigint not null,
  shipping_tiyin bigint not null,
  total_tiyin bigint not null check (total_tiyin between 1 and 100000000000000),
  seller_phone text not null,
  cs2_asset_id text,
  delivery_name text,
  delivery_phone text,
  delivery_address text,
  status text not null default 'reserved' check (status in ('reserved', 'reported', 'approved', 'disputed', 'completed', 'cancelled')),
  stock_state text not null default 'held' check (stock_state in ('held', 'released', 'consumed')),
  version integer not null default 1,
  payment_reference text,
  reported_amount_tiyin bigint,
  reported_paid_at timestamptz,
  reported_by uuid references auth.users(id) on delete restrict,
  payment_approved_at timestamptz,
  seller_confirmed_at timestamptz,
  buyer_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  check (seller_id <> buyer_id)
);

create table public.marketplace_order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.marketplace_orders(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null check (actor_role in ('buyer', 'seller', 'admin', 'system')),
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index marketplace_orders_buyer_idx on public.marketplace_orders (buyer_id, created_at desc, id desc);
create index marketplace_orders_seller_idx on public.marketplace_orders (seller_id, created_at desc, id desc);
create index marketplace_orders_admin_idx on public.marketplace_orders (created_at desc, id desc);
create index marketplace_orders_status_idx on public.marketplace_orders (status, created_at desc, id desc);
create index marketplace_orders_expiration_idx on public.marketplace_orders (expires_at, id) where status = 'reserved';
create index marketplace_orders_listing_idx on public.marketplace_orders (listing_id, stock_state);
create unique index marketplace_orders_unique_cs2_asset on public.marketplace_orders (cs2_asset_id)
  where cs2_asset_id is not null and stock_state <> 'released';
create index marketplace_order_events_order_idx on public.marketplace_order_events (order_id, id);

alter table marketplace_private.direct_order_settings enable row level security;
alter table public.marketplace_checkout_terms enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_order_events enable row level security;
revoke all on marketplace_private.direct_order_settings, public.marketplace_checkout_terms, public.marketplace_orders,
  public.marketplace_order_events from public, anon, authenticated;
grant select on public.marketplace_checkout_terms, public.marketplace_orders, public.marketplace_order_events to authenticated;

create function marketplace_private.active_order_account() returns boolean
language sql stable security definer set search_path = '' as $$
  select marketplace_private.mfa_satisfied() and exists (
    select 1 from auth.users where id = (select auth.uid()) and email_confirmed_at is not null
      and deleted_at is null and (banned_until is null or banned_until <= now())
  );
$$;
revoke all on function marketplace_private.active_order_account() from public, anon, authenticated;
grant execute on function marketplace_private.active_order_account() to authenticated;

create policy checkout_terms_read on public.marketplace_checkout_terms for select to authenticated
  using ((select marketplace_private.active_order_account()) and exists (
    select 1 from public.marketplace_listings l where l.id = listing_id and l.seller_id = (select auth.uid())
  ));
create policy orders_read on public.marketplace_orders for select to authenticated
  using ((select marketplace_private.active_order_account()) and
    ((select auth.uid()) in (buyer_id, seller_id) or (select marketplace_private.is_admin())));
create policy order_events_read on public.marketplace_order_events for select to authenticated
  using (exists (select 1 from public.marketplace_orders o where o.id = order_id));

create function marketplace_private.checkout_quote(l public.marketplace_listings, v_revision uuid) returns text
language sql stable set search_path = '' as $$
  select encode(sha256(convert_to(jsonb_build_array(l.id, l.seller_revision, l.ecosystem, l.title, l.description,
    l.category, l.variant, l.price_tiyin, v_revision)::text, 'UTF8')), 'hex');
$$;
revoke all on function marketplace_private.checkout_quote(public.marketplace_listings, uuid) from public, anon, authenticated;
-- The public view projects only fields intended for the buyer before signing in.
create view public.marketplace_checkout_offers with (security_barrier = true) as
  select l.id as listing_id, l.ecosystem, l.title, l.category, l.variant, l.description, l.price_tiyin,
    t.shipping_tiyin, marketplace_private.checkout_quote(l, t.revision) as quote
  from public.marketplace_listings l join public.marketplace_checkout_terms t on t.listing_id = l.id
  where l.quantity > 0 and marketplace_private.listing_is_public(l.id)
    and exists (select 1 from auth.users u where u.id = l.seller_id and u.deleted_at is null
      and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until <= now()))
    and (select accepting_orders from marketplace_private.direct_order_settings);
revoke all on public.marketplace_checkout_offers from public, anon, authenticated;
grant select on public.marketplace_checkout_offers to anon, authenticated;
-- PostgreSQL checks function EXECUTE for the querying role even inside this view.
grant execute on function marketplace_private.checkout_quote(public.marketplace_listings, uuid) to anon, authenticated;

create function public.marketplace_set_checkout_terms(p_listing_id uuid, p_seller_phone text, p_shipping_tiyin bigint, p_cs2_asset_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_listing public.marketplace_listings%rowtype; v_existing public.marketplace_checkout_terms%rowtype;
begin
  select * into v_listing from public.marketplace_listings where id = p_listing_id and seller_id = (select auth.uid()) for update;
  if not found or marketplace_private.active_order_account() is not true
    or marketplace_private.can_manage_listing(v_listing.seller_id, v_listing.ecosystem) is not true then
    raise exception 'seller access required' using errcode = '42501';
  end if;
  if p_seller_phone is null or p_seller_phone !~ '^[+][1-9][0-9]{7,14}$'
    or p_shipping_tiyin is null or p_shipping_tiyin not between 0 and 100000000000000
    or (v_listing.ecosystem = 'cs2' and (p_shipping_tiyin <> 0 or coalesce(p_cs2_asset_id, '') !~ '^[1-9][0-9]{0,19}$'))
    or (v_listing.ecosystem = 'fashion' and p_cs2_asset_id is not null) then
    raise exception 'invalid checkout terms' using errcode = '22023';
  end if;
  select * into v_existing from public.marketplace_checkout_terms where listing_id = p_listing_id;
  if found and v_existing.cs2_asset_id is distinct from p_cs2_asset_id then
    raise exception 'asset ID cannot change after setup' using errcode = '23514';
  end if;
  insert into public.marketplace_checkout_terms(listing_id, seller_phone, shipping_tiyin, cs2_asset_id)
    values (p_listing_id, p_seller_phone, p_shipping_tiyin, p_cs2_asset_id)
  on conflict (listing_id) do update
    set seller_phone = excluded.seller_phone, shipping_tiyin = excluded.shipping_tiyin, revision = excluded.revision;
end;
$$;

-- Use an internal marker so reservation adjustments cannot adopt a new seller grant revision.
create table marketplace_private.order_stock_context (
  transaction_id bigint not null,
  listing_id uuid not null,
  primary key (transaction_id, listing_id)
);
alter table marketplace_private.order_stock_context enable row level security;
revoke all on marketplace_private.order_stock_context from public, anon, authenticated;

create or replace function marketplace_private.stamp_listing() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and exists (
    select 1 from marketplace_private.order_stock_context c where c.transaction_id = txid_current() and c.listing_id = old.id
  ) then
    new.seller_revision := old.seller_revision;
  else
    select application_revision into new.seller_revision from public.marketplace_seller_grants where seller_id = new.seller_id;
  end if;
  new.updated_at := case when tg_op = 'UPDATE'
    then greatest(clock_timestamp(), old.updated_at + interval '1 microsecond')
    else clock_timestamp() end;
  return new;
end;
$$;

create function marketplace_private.guard_order_stock() returns trigger
language plpgsql security definer set search_path = '' as $$
declare held bigint;
begin
  if new.ecosystem <> old.ecosystem and exists (
    select 1 from public.marketplace_checkout_terms where listing_id = old.id
  ) then raise exception 'listing ecosystem is fixed after payment setup' using errcode = '23514'; end if;
  select coalesce(sum(quantity), 0) into held from public.marketplace_orders where listing_id = old.id and stock_state = 'held';
  if held > 0 and (new.title, new.category, new.variant, new.description)
    is distinct from (old.title, old.category, old.variant, old.description) then
    raise exception 'listing has open reservations' using errcode = '23514';
  end if;
  if (held + new.quantity) > (case when new.ecosystem = 'cs2' then 1 else 1000000 end)
    or (new.ecosystem = 'cs2' and new.quantity > 0 and exists (
      select 1 from public.marketplace_orders where listing_id = old.id and stock_state = 'consumed'
    )) then raise exception 'invalid available stock' using errcode = '23514'; end if;
  return new;
end;
$$;
revoke all on function marketplace_private.guard_order_stock() from public, anon, authenticated;
create trigger marketplace_order_stock_guard before update on public.marketplace_listings
  for each row execute function marketplace_private.guard_order_stock();

create function marketplace_private.adjust_order_stock(p_listing uuid, p_delta integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into marketplace_private.order_stock_context values (txid_current(), p_listing);
  update public.marketplace_listings set quantity = quantity + p_delta where id = p_listing;
  delete from marketplace_private.order_stock_context where transaction_id = txid_current() and listing_id = p_listing;
end;
$$;
revoke all on function marketplace_private.adjust_order_stock(uuid, integer) from public, anon, authenticated;

create function public.marketplace_reserve_order(p_id uuid, p_listing_id uuid, p_quote text, p_quantity integer,
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
  if (select accepting_orders from marketplace_private.direct_order_settings for share) is not true
    or v_listing.seller_id = v_buyer or v_listing.state <> 'published' or v_listing.moderation_status <> 'allowed'
    or v_listing.quantity < p_quantity then raise exception 'listing unavailable' using errcode = 'P0002'; end if;
  perform 1 from auth.users where id in (v_buyer, v_listing.seller_id) order by id for share;
  if marketplace_private.active_order_account() is not true then raise exception 'account access required' using errcode = '42501'; end if;
  perform 1 from auth.users where id = v_listing.seller_id and deleted_at is null and email_confirmed_at is not null
    and (banned_until is null or banned_until <= now()) for share;
  if not found or not marketplace_private.listing_is_public(v_listing.id) then raise exception 'listing unavailable' using errcode = 'P0002'; end if;
  perform 1 from public.marketplace_seller_grants g join public.marketplace_seller_applications a
    on a.applicant_id = g.seller_id and a.revision = g.application_revision
    where g.seller_id = v_listing.seller_id and g.application_revision = v_listing.seller_revision
      and a.status = 'approved' and a.requested_scope in (v_listing.ecosystem, 'both') for share of a, g;
  if not found then raise exception 'listing unavailable' using errcode = 'P0002'; end if;

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

create function public.marketplace_update_order(p_id uuid, p_action text, p_version integer, p_reason text,
  p_payment_reference text, p_paid_amount_tiyin bigint, p_paid_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_order public.marketplace_orders%rowtype;
  v_actor uuid := auth.uid();
  v_role text;
  v_return_stock boolean := false;
  v_reason text := nullif(btrim(p_reason), '');
begin
  if marketplace_private.active_order_account() is not true then raise exception 'account access required' using errcode = '42501'; end if;
  select * into v_order from public.marketplace_orders where id = p_id for update;
  if not found then raise exception 'order unavailable' using errcode = 'P0002'; end if;
  v_role := case when v_actor = v_order.buyer_id then 'buyer' when v_actor = v_order.seller_id then 'seller'
    when marketplace_private.is_admin() then 'admin' end;
  if v_role is null then raise exception 'order unavailable' using errcode = 'P0002'; end if;
  if v_order.version is distinct from p_version then raise exception 'order changed' using errcode = '40001'; end if;
  if char_length(v_reason) > 1000 or v_reason ~ '[[:cntrl:]]'
    or (p_action in ('dispute', 'approve', 'reject', 'resume', 'cancel_release', 'cancel_keep') and v_reason is null) then
    raise exception 'enter a valid reason' using errcode = '22023';
  end if;

  case p_action
    when 'report', 'report_late' then
      if v_role not in ('buyer', 'seller') or v_order.payment_reference is not null then
        raise exception 'payment report is unavailable' using errcode = '42501';
      end if;
      if p_action = 'report' and (v_order.status <> 'reserved' or v_order.expires_at <= clock_timestamp()) then
        raise exception 'payment reporting deadline passed' using errcode = '40001';
      end if;
      if p_action = 'report_late' and not (
        (v_order.status = 'reserved' and v_order.expires_at <= clock_timestamp()) or
        (v_order.status = 'cancelled' and v_order.stock_state = 'released')
      ) then raise exception 'late payment report is unavailable' using errcode = '42501'; end if;
      if coalesce(char_length(btrim(p_payment_reference)), 0) not between 1 and 120 or p_payment_reference ~ '[[:cntrl:]]'
        or (p_paid_amount_tiyin is null or p_paid_amount_tiyin not between 1 and 100000000000000)
        or p_paid_at is null or not isfinite(p_paid_at)
        or p_paid_at < v_order.created_at - interval '1 minute' or p_paid_at > clock_timestamp() + interval '1 minute' then
        raise exception 'invalid direct payment report' using errcode = '22023';
      end if;
      if p_action = 'report_late' then
        v_return_stock := v_order.stock_state = 'held';
        v_order.status := 'disputed';
        v_order.stock_state := 'released';
      else
        v_order.status := 'reported';
      end if;
      v_order.payment_reference := btrim(p_payment_reference);
      v_order.reported_amount_tiyin := p_paid_amount_tiyin;
      v_order.reported_paid_at := p_paid_at;
      v_order.reported_by := v_actor;
    when 'approve', 'reject' then
      if v_role <> 'admin' or v_order.status <> 'reported' then raise exception 'review is unavailable' using errcode = '42501'; end if;
      if p_action = 'approve' then
        v_order.status := 'approved';
        v_order.payment_approved_at := now();
      else
        v_order.status := 'disputed';
      end if;
    when 'confirm' then
      if v_role not in ('buyer', 'seller') or v_order.status <> 'approved'
        or (v_role = 'buyer' and v_order.buyer_confirmed_at is not null)
        or (v_role = 'seller' and v_order.seller_confirmed_at is not null) then
        raise exception 'confirmation is unavailable' using errcode = '42501';
      end if;
      if v_role = 'buyer' then v_order.buyer_confirmed_at := now(); else v_order.seller_confirmed_at := now(); end if;
      if v_order.buyer_confirmed_at is not null and v_order.seller_confirmed_at is not null then
        v_order.status := 'completed';
        v_order.stock_state := 'consumed';
      end if;
    when 'dispute' then
      if v_role not in ('buyer', 'seller') or v_order.status not in ('reported', 'approved', 'completed') then
        raise exception 'dispute is unavailable' using errcode = '42501';
      end if;
      v_order.status := 'disputed';
    when 'resume' then
      if v_role <> 'admin' or v_order.status <> 'disputed' or v_order.stock_state = 'released' then raise exception 'decision is unavailable' using errcode = '42501'; end if;
      if v_order.stock_state = 'consumed' then
        v_order.status := 'completed';
      else
        v_order.status := 'approved';
        v_order.payment_approved_at := coalesce(v_order.payment_approved_at, now());
        v_order.seller_confirmed_at := null;
        v_order.buyer_confirmed_at := null;
      end if;
    when 'cancel_release', 'cancel_keep' then
      if v_role <> 'admin' or v_order.status <> 'disputed' or (p_action = 'cancel_release' and v_order.stock_state <> 'held') then
        raise exception 'decision is unavailable' using errcode = '42501';
      end if;
      v_order.status := 'cancelled';
      -- Restocking requires the administrator to establish that the seller still has the item.
      v_return_stock := p_action = 'cancel_release';
      if v_order.stock_state = 'held' then
        v_order.stock_state := case when v_return_stock then 'released' else 'consumed' end;
      end if;
    else
      raise exception 'invalid order action' using errcode = '22023';
  end case;

  update public.marketplace_orders set status = v_order.status, stock_state = v_order.stock_state,
    payment_reference = v_order.payment_reference, reported_amount_tiyin = v_order.reported_amount_tiyin,
    reported_paid_at = v_order.reported_paid_at, reported_by = v_order.reported_by, payment_approved_at = v_order.payment_approved_at,
    seller_confirmed_at = v_order.seller_confirmed_at, buyer_confirmed_at = v_order.buyer_confirmed_at,
    version = version + 1, updated_at = now() where id = p_id;
  if v_return_stock then
    perform marketplace_private.adjust_order_stock(v_order.listing_id, v_order.quantity);
    if p_action = 'report_late' then
      insert into public.marketplace_order_events(order_id, actor_role, action) values (p_id, 'system', 'expired');
    end if;
  end if;
  insert into public.marketplace_order_events(order_id, actor_id, actor_role, action, reason)
    values (p_id, v_actor, v_role, p_action, v_reason);
end;
$$;

create function marketplace_private.expire_direct_orders() returns integer
language plpgsql security definer set search_path = '' as $$
declare v_order public.marketplace_orders%rowtype; v_count integer := 0;
begin
  if not pg_try_advisory_xact_lock(202611210005) then return 0; end if;
  for v_order in select * from public.marketplace_orders where status = 'reserved' and expires_at <= now()
    order by expires_at, id limit 100 for update skip locked
  loop
    update public.marketplace_orders set status = 'cancelled', stock_state = 'released', version = version + 1, updated_at = now()
      where id = v_order.id;
    perform marketplace_private.adjust_order_stock(v_order.listing_id, v_order.quantity);
    insert into public.marketplace_order_events(order_id, actor_role, action) values (v_order.id, 'system', 'expired');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function marketplace_private.expire_direct_orders() from public, anon, authenticated;
revoke all on function public.marketplace_set_checkout_terms(uuid, text, bigint, text),
  public.marketplace_reserve_order(uuid, uuid, text, integer, text, text, text),
  public.marketplace_update_order(uuid, text, integer, text, text, bigint, timestamptz) from public, anon, authenticated;
grant execute on function public.marketplace_set_checkout_terms(uuid, text, bigint, text),
  public.marketplace_reserve_order(uuid, uuid, text, integer, text, text, text),
  public.marketplace_update_order(uuid, text, integer, text, text, bigint, timestamptz) to authenticated;

commit;
