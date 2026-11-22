-- Give explicitly assigned CS2 operators access to their own checkout terms.
-- This migration is additive and can be installed before the catalog cutover.
begin;

create table marketplace_private.cs2_reservation_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now()
);
create table marketplace_private.cs2_reservation_settings_audit (
  id bigint generated always as identity primary key,
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  previous_revision uuid,
  revision uuid not null,
  created_at timestamptz not null default now()
);
alter table marketplace_private.cs2_reservation_operators enable row level security;
alter table marketplace_private.cs2_reservation_settings_audit enable row level security;
revoke all on marketplace_private.cs2_reservation_operators,
  marketplace_private.cs2_reservation_settings_audit from public, anon, authenticated;

create function marketplace_private.cs2_reservation_actor() returns text
language sql stable security definer set search_path = '' as $$
  select case when (select auth.jwt() ->> 'aal') = 'aal2' and marketplace_private.has_verified_mfa() then
    case when exists (select 1 from public.marketplace_user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'owner') then 'owner'
    when exists (select 1 from marketplace_private.cs2_reservation_operators o
      where o.user_id = (select auth.uid())) then 'operator' end
  end;
$$;
revoke all on function marketplace_private.cs2_reservation_actor() from public, anon, authenticated;

create function public.marketplace_cs2_reservation_settings()
returns table (listing_id uuid, title text, variant text, revision uuid, seller_phone text,
  cs2_asset_id text, asset_editable boolean)
language sql stable security definer set search_path = '' as $$
  select l.id, l.title, l.variant, t.revision, t.seller_phone, t.cs2_asset_id,
    t.cs2_asset_id is null or (actor.role = 'owner' and not exists (
      select 1 from public.marketplace_orders o where o.listing_id = l.id and o.stock_state <> 'released'))
  from public.marketplace_listings l
  join marketplace_private.cs2_reservation_operators a on a.user_id = l.seller_id
  left join public.marketplace_checkout_terms t on t.listing_id = l.id
  cross join (select marketplace_private.cs2_reservation_actor() as role) actor
  where l.ecosystem = 'cs2' and l.state = 'published' and marketplace_private.listing_is_public(l.id)
    and (actor.role = 'owner' or (actor.role = 'operator' and a.user_id = (select auth.uid())));
$$;

create function public.marketplace_save_cs2_reservation_settings(p_listing_id uuid,
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
  perform 1 from marketplace_private.cs2_reservation_operators where user_id = v_listing.seller_id for share;
  if not found then raise exception 'CS2 reservation access required' using errcode = '42501'; end if;
  perform 1 from auth.users where id in ((select auth.uid()), v_listing.seller_id) order by id for share;
  v_actor := marketplace_private.cs2_reservation_actor();
  if v_actor is null or (v_actor = 'operator' and v_listing.seller_id <> (select auth.uid()))
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

revoke all on function public.marketplace_cs2_reservation_settings(),
  public.marketplace_save_cs2_reservation_settings(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.marketplace_cs2_reservation_settings(),
  public.marketplace_save_cs2_reservation_settings(uuid, uuid, text, text) to authenticated;

commit;
