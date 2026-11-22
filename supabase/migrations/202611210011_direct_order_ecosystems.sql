-- Keep the master reservation switch and allow launch by ecosystem.
begin;

alter table marketplace_private.direct_order_settings
  add column accepting_ecosystems text[] not null default array['cs2', 'fashion']
  check (cardinality(accepting_ecosystems) > 0 and accepting_ecosystems <@ array['cs2', 'fashion']);

create or replace view public.marketplace_checkout_offers with (security_barrier = true) as
  select l.id as listing_id, l.ecosystem, l.title, l.category, l.variant, l.description, l.price_tiyin,
    t.shipping_tiyin, marketplace_private.checkout_quote(l, t.revision) as quote
  from public.marketplace_listings l join public.marketplace_checkout_terms t on t.listing_id = l.id
  where l.quantity > 0 and marketplace_private.listing_is_public(l.id)
    and exists (select 1 from auth.users u where u.id = l.seller_id and u.deleted_at is null
      and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until <= now()))
    and (select accepting_orders and l.ecosystem = any(accepting_ecosystems) from marketplace_private.direct_order_settings);

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

commit;
