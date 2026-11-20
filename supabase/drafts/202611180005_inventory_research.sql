-- RESEARCH DRAFT: DO NOT APPLY OR EXPOSE. Not a complete order/payment workflow.
-- This file is deliberately outside the migrations directory.
-- Unresolved: real PostgreSQL concurrency tests, buyer-confirmed listing version,
-- cross-listing CS2 asset identity, account deletion/retention, cancellation,
-- shipping, payment evidence, scheduler and an authorized order workflow.
-- Internal inventory foundation only; no order, payment or customer-facing RPC.
-- The functions below MUST be called only by a future authorized order service
-- after its own role, payment and cancellation rules have been checked.
begin;

create table public.marketplace_inventory_holds (
  id uuid primary key,
  listing_id uuid not null references public.marketplace_listings(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_revision integer not null check (seller_revision > 0),
  ecosystem text not null check (ecosystem in ('cs2', 'fashion')),
  title text not null,
  category text not null,
  variant text not null,
  unit_price_tiyin bigint not null check (unit_price_tiyin > 0),
  quantity integer not null check (quantity between 1 and 1000000),
  status text not null default 'held' check (status in ('held', 'released', 'consumed')),
  created_at timestamptz not null default now(),
  changed_at timestamptz not null default now()
);
create index marketplace_inventory_holds_active_listing_idx
  on public.marketplace_inventory_holds (listing_id) where status = 'held';
create index marketplace_inventory_holds_sold_cs2_listing_idx
  on public.marketplace_inventory_holds (listing_id) where status = 'consumed' and ecosystem = 'cs2';
alter table public.marketplace_inventory_holds enable row level security;
revoke all on public.marketplace_inventory_holds from public, anon, authenticated;

-- Existing listing.quantity means available units. Held units remain separately
-- accounted for, including while the seller is changing available stock.
create function marketplace_private.guard_held_inventory() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_held bigint;
begin
  select coalesce(sum(h.quantity), 0) into v_held from public.marketplace_inventory_holds h
    where h.listing_id = old.id and h.status = 'held';
  if exists(select 1 from public.marketplace_inventory_holds h where h.listing_id = old.id
    and h.ecosystem = 'cs2' and h.status = 'consumed')
    and (new.ecosystem <> 'cs2' or new.quantity > 0) then
    raise exception 'a sold CS2 listing cannot be restocked' using errcode = '23514';
  end if;
  if v_held > 0 and new.ecosystem is distinct from old.ecosystem then
    raise exception 'listing ecosystem has active reservations' using errcode = '23514';
  end if;
  if new.quantity::bigint + v_held > (case when new.ecosystem = 'cs2' then 1 else 1000000 end) then
    raise exception 'available and held inventory exceed limit' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function marketplace_private.guard_held_inventory() from public, anon, authenticated;
create trigger marketplace_inventory_listing_guard before update of quantity, ecosystem on public.marketplace_listings
  for each row execute function marketplace_private.guard_held_inventory();

-- Only the definer-owned inventory functions can insert this transaction-local
-- marker. It is not a caller-controlled setting or publicly executable API.
create table marketplace_private.inventory_adjustment_context (
  transaction_id bigint not null,
  listing_id uuid not null,
  primary key (transaction_id, listing_id)
);
alter table marketplace_private.inventory_adjustment_context enable row level security;
revoke all on marketplace_private.inventory_adjustment_context from public, anon, authenticated;

-- Buyer-side stock changes must never adopt a newer seller grant revision and
-- accidentally publish content approved under an earlier revision.
create or replace function marketplace_private.stamp_listing() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and exists (
    select 1 from marketplace_private.inventory_adjustment_context c
    where c.transaction_id = txid_current() and c.listing_id = old.id
  ) then
    new.seller_revision := old.seller_revision;
  else
    select application_revision into new.seller_revision from public.marketplace_seller_grants where seller_id = new.seller_id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Idempotent for an existing held reference with exactly matching inputs.
-- The entire stock decrement and snapshot insert occur in one DB transaction.
create function marketplace_private.reserve_inventory(p_hold_id uuid, p_listing_id uuid, p_buyer_id uuid, p_quantity integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_listing public.marketplace_listings%rowtype; v_hold public.marketplace_inventory_holds%rowtype; v_scope text; v_revision integer;
begin
  if p_hold_id is null or p_listing_id is null or p_buyer_id is null or p_quantity is null or p_quantity < 1 or p_quantity > 1000000
    or (select auth.uid()) is distinct from p_buyer_id or marketplace_private.mfa_satisfied() is not true then
    raise exception 'inventory request is not authorized' using errcode = '42501';
  end if;
  -- Keep account and seller authorization stable until the outer transaction
  -- commits, rather than checking stale information before another update.
  perform 1 from auth.users u where u.id = p_buyer_id and u.email_confirmed_at is not null
    and u.deleted_at is null and (u.banned_until is null or u.banned_until <= now()) for share;
  if not found then raise exception 'inventory request is not authorized' using errcode = '42501'; end if;
  select * into v_listing from public.marketplace_listings where id = p_listing_id for update;
  if not found then raise exception 'inventory unavailable' using errcode = 'P0002'; end if;
  -- All paths lock listing before hold, including retries and release. Keeping
  -- the hold row locked also protects a caller's enclosing order transaction.
  select * into v_hold from public.marketplace_inventory_holds where id = p_hold_id for update;
  if found then
    if v_hold.listing_id is distinct from p_listing_id or v_hold.buyer_id is distinct from p_buyer_id
       or v_hold.quantity is distinct from p_quantity or v_hold.status <> 'held' then
      raise exception 'inventory reference already used' using errcode = '23505';
    end if;
    return v_hold.id;
  end if;
  if v_listing.seller_id = p_buyer_id or v_listing.state <> 'published' or v_listing.moderation_status <> 'allowed'
     or v_listing.quantity < p_quantity then
    raise exception 'inventory unavailable' using errcode = 'P0002';
  end if;
  perform 1 from auth.users u where u.id = v_listing.seller_id and u.email_confirmed_at is not null
    and u.deleted_at is null and (u.banned_until is null or u.banned_until <= now()) for share;
  if not found then raise exception 'inventory unavailable' using errcode = 'P0002'; end if;
  select a.requested_scope, g.application_revision into v_scope, v_revision
    from public.marketplace_seller_grants g join public.marketplace_seller_applications a on a.applicant_id = g.seller_id
    where g.seller_id = v_listing.seller_id and a.status = 'approved' and a.revision = g.application_revision
      and a.requested_scope in (v_listing.ecosystem, 'both') and g.application_revision = v_listing.seller_revision
    for share of a, g;
  if not found then raise exception 'inventory unavailable' using errcode = 'P0002'; end if;
  insert into marketplace_private.inventory_adjustment_context(transaction_id, listing_id) values (txid_current(), p_listing_id);
  update public.marketplace_listings set quantity = quantity - p_quantity where id = p_listing_id;
  delete from marketplace_private.inventory_adjustment_context where transaction_id = txid_current() and listing_id = p_listing_id;
  insert into public.marketplace_inventory_holds(id, listing_id, seller_id, buyer_id, seller_revision,
    ecosystem, title, category, variant, unit_price_tiyin, quantity)
  values (p_hold_id, v_listing.id, v_listing.seller_id, p_buyer_id, v_listing.seller_revision,
    v_listing.ecosystem, v_listing.title, v_listing.category, v_listing.variant, v_listing.price_tiyin, p_quantity);
  return p_hold_id;
end;
$$;

-- A future authorized workflow chooses when to release or consume. These
-- primitives do not infer payment, delivery, cancellation or refund policy.
create function marketplace_private.release_inventory(p_hold_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_listing_id uuid; v_hold public.marketplace_inventory_holds%rowtype;
begin
  select listing_id into v_listing_id from public.marketplace_inventory_holds where id = p_hold_id;
  if not found then raise exception 'inventory hold not found' using errcode = 'P0002'; end if;
  perform 1 from public.marketplace_listings where id = v_listing_id for update;
  if not found then raise exception 'listing not found' using errcode = 'P0002'; end if;
  select * into v_hold from public.marketplace_inventory_holds where id = p_hold_id for update;
  if v_hold.status = 'released' then return; end if;
  if v_hold.status <> 'held' then raise exception 'inventory hold already consumed' using errcode = '23514'; end if;
  update public.marketplace_inventory_holds set status = 'released', changed_at = now() where id = p_hold_id;
  insert into marketplace_private.inventory_adjustment_context(transaction_id, listing_id) values (txid_current(), v_listing_id);
  update public.marketplace_listings set quantity = quantity + v_hold.quantity where id = v_listing_id;
  delete from marketplace_private.inventory_adjustment_context where transaction_id = txid_current() and listing_id = v_listing_id;
end;
$$;
create function marketplace_private.consume_inventory(p_hold_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_status text;
begin
  select status into v_status from public.marketplace_inventory_holds where id = p_hold_id for update;
  if not found then raise exception 'inventory hold not found' using errcode = 'P0002'; end if;
  if v_status = 'consumed' then return; end if;
  if v_status <> 'held' then raise exception 'inventory hold already released' using errcode = '23514'; end if;
  update public.marketplace_inventory_holds set status = 'consumed', changed_at = now() where id = p_hold_id;
end;
$$;
revoke all on function marketplace_private.reserve_inventory(uuid, uuid, uuid, integer),
  marketplace_private.release_inventory(uuid), marketplace_private.consume_inventory(uuid) from public, anon, authenticated;

commit;
