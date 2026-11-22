begin;

create table public.marketplace_fashion_products (
  id uuid primary key,
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120 and title !~ '[[:cntrl:]]'),
  description text not null check (char_length(btrim(description)) between 1 and 4000),
  category text not null check (char_length(btrim(category)) between 1 and 80 and category !~ '[[:cntrl:]]'),
  brand text not null check (char_length(brand) <= 80),
  material text not null check (char_length(material) <= 240),
  fit text not null check (char_length(fit) <= 240),
  care text not null check (char_length(care) <= 240),
  price_tiyin bigint not null check (price_tiyin between 1 and 100000000000000),
  state text not null check (state in ('draft','published')),
  size_guide jsonb not null check (jsonb_typeof(size_guide) = 'array' and jsonb_array_length(size_guide) <= 20),
  seller_phone text check (seller_phone ~ '^[+][1-9][0-9]{7,14}$'),
  shipping_tiyin bigint check (shipping_tiyin between 0 and 100000000000000),
  updated_at timestamptz not null default clock_timestamp(),
  check ((seller_phone is null) = (shipping_tiyin is null)),
  unique (id, seller_id)
);

create table public.marketplace_fashion_colors (
  id uuid primary key,
  product_id uuid not null references public.marketplace_fashion_products on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 36 and name !~ '[[:cntrl:]]'),
  images text[] not null check (cardinality(images) <= 4),
  unique (product_id, id)
);

alter table public.marketplace_listings
  add column fashion_product_id uuid,
  add column fashion_color_id uuid,
  add column fashion_size text,
  add column fashion_price_override boolean,
  add foreign key (fashion_product_id, seller_id) references public.marketplace_fashion_products(id, seller_id) on delete cascade,
  add foreign key (fashion_product_id, fashion_color_id) references public.marketplace_fashion_colors(product_id, id) on delete cascade,
  add check ((fashion_product_id is null and fashion_color_id is null and fashion_size is null and fashion_price_override is null) or
    (ecosystem = 'fashion' and fashion_product_id is not null and fashion_color_id is not null and fashion_size is not null
      and fashion_price_override is not null and char_length(fashion_size) between 1 and 24 and fashion_size !~ '[[:cntrl:]]'));

create unique index marketplace_fashion_combination_idx on public.marketplace_listings(fashion_color_id, fashion_size)
  where fashion_product_id is not null;
create index marketplace_fashion_product_listings_idx on public.marketplace_listings(fashion_product_id, id)
  where fashion_product_id is not null;

alter table public.marketplace_fashion_products enable row level security;
alter table public.marketplace_fashion_colors enable row level security;
revoke all on public.marketplace_fashion_products, public.marketplace_fashion_colors from public, anon, authenticated;
grant select on public.marketplace_fashion_products, public.marketplace_fashion_colors to authenticated;
create policy fashion_product_owner_read on public.marketplace_fashion_products for select to authenticated
  using (marketplace_private.can_manage_listing(seller_id, 'fashion'));
create policy fashion_color_owner_read on public.marketplace_fashion_colors for select to authenticated
  using (exists (select 1 from public.marketplace_fashion_products p where p.id = product_id));

-- The editor must receive values and their versions from the same snapshot.
create function public.marketplace_fashion_draft(p_product_id uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'product', to_jsonb(p) - array['seller_phone','shipping_tiyin'],
    'colors', coalesce((select jsonb_agg(c order by c.id) from public.marketplace_fashion_colors c where c.product_id = p.id), '[]'),
    'listings', coalesce((select jsonb_agg(l order by l.created_at, l.id) from public.marketplace_listings l where l.fashion_product_id = p.id), '[]')
  ) from public.marketplace_fashion_products p where p.id = p_product_id and p.seller_id = (select auth.uid());
$$;
revoke all on function public.marketplace_fashion_draft(uuid) from public, anon, authenticated;
grant execute on function public.marketplace_fashion_draft(uuid) to authenticated;

-- Direct seller updates remain available for archiving one variant. All other
-- seller edits go through the versioned product transaction. Checkout and
-- moderation execute under their existing security-definer functions.
create function marketplace_private.guard_fashion_direct_edit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' and
    (new.state <> 'archived' or (to_jsonb(new) - 'state') <> (to_jsonb(old) - 'state')) then
    raise exception 'edit variants through the product' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function marketplace_private.guard_fashion_direct_edit() from public, anon, authenticated;
create trigger marketplace_fashion_direct_edit before update on public.marketplace_listings
  for each row when (old.fashion_product_id is not null)
  execute function marketplace_private.guard_fashion_direct_edit();

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('marketplace-fashion-images','marketplace-fashion-images',false,163840,array['image/webp']);

-- Both private buckets use the same UUID/UUID.webp path syntax.
create function marketplace_private.can_upload_fashion_image(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select color_id is not null and not exists (
    select 1 from public.marketplace_fashion_colors c join public.marketplace_fashion_products p on p.id = c.product_id
    where c.id = color_id and p.seller_id <> (select auth.uid())
  ) from (select marketplace_private.cs2_image_listing_id(p_name) as color_id) path;
$$;
create function marketplace_private.fashion_image_is_public(p_name text, p_owner text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.marketplace_fashion_colors c join public.marketplace_listings l on l.fashion_color_id = c.id
    where c.id = marketplace_private.cs2_image_listing_id(p_name) and substr(p_name, 38) = any(c.images)
      and l.seller_id::text = p_owner and marketplace_private.listing_is_public(l.id)
  );
$$;

create function marketplace_private.lock_fashion_images(p_color uuid) returns void
language sql volatile strict set search_path = '' as $$
  select pg_advisory_xact_lock(hashtextextended('marketplace-fashion-images:' || p_color::text, 0));
$$;
create function marketplace_private.can_delete_fashion_image(p_name text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare color_id uuid := marketplace_private.cs2_image_listing_id(p_name);
begin
  if color_id is null or marketplace_private.can_manage_listing(auth.uid(), 'fashion') is not true
    or not exists (select 1 from storage.objects o where o.bucket_id = 'marketplace-fashion-images'
      and o.name = p_name and o.owner_id = auth.uid()::text) then return false;
  end if;
  perform marketplace_private.lock_fashion_images(color_id);
  return not exists (select 1 from public.marketplace_fashion_colors c where c.id = color_id and substr(p_name,38) = any(c.images));
end;
$$;
revoke all on function marketplace_private.can_upload_fashion_image(text), marketplace_private.fashion_image_is_public(text,text),
  marketplace_private.lock_fashion_images(uuid), marketplace_private.can_delete_fashion_image(text) from public, anon, authenticated;
grant execute on function marketplace_private.can_upload_fashion_image(text), marketplace_private.can_delete_fashion_image(text) to authenticated;
grant execute on function marketplace_private.fashion_image_is_public(text,text) to anon, authenticated;

create policy fashion_images_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'marketplace-fashion-images' and (select storage.allow_only_operation('storage.object.upload'))
    and owner_id = (select auth.uid()::text) and (select marketplace_private.can_manage_listing(auth.uid(),'fashion'))
    and marketplace_private.can_upload_fashion_image(name));
create policy fashion_images_public_download on storage.objects for select to anon, authenticated
  using (bucket_id = 'marketplace-fashion-images' and (select storage.allow_only_operation('storage.object.get_authenticated'))
    and marketplace_private.fashion_image_is_public(name, owner_id));
create policy fashion_images_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'marketplace-fashion-images' and owner_id = (select auth.uid()::text)
    and (select storage.allow_any_operation(array['storage.object.get_authenticated','storage.object.delete','storage.object.delete_many']))
    and (select marketplace_private.can_manage_listing(auth.uid(),'fashion')));
create policy fashion_images_remove on storage.objects for delete to authenticated
  using (bucket_id = 'marketplace-fashion-images' and owner_id = (select auth.uid()::text)
    and (select storage.allow_any_operation(array['storage.object.delete','storage.object.delete_many']))
    and marketplace_private.can_delete_fashion_image(name));

create function public.marketplace_save_fashion_product(p_product_id uuid, p_expected_updated_at timestamptz,
  p_details jsonb, p_colors jsonb, p_versions jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  seller uuid := auth.uid();
  product public.marketplace_fashion_products%rowtype;
  color record;
  combination record;
  filenames text[];
  color_ids uuid[] := '{}';
  listing_ids uuid[] := '{}';
  saved_id uuid;
  contact_phone text;
  delivery_tiyin bigint;
begin
  if marketplace_private.can_manage_listing(seller, 'fashion') is not true then
    raise exception 'verified fashion seller required' using errcode = '42501';
  end if;
  if p_product_id is null or jsonb_typeof(p_details) is distinct from 'object'
    or jsonb_typeof(p_colors) is distinct from 'array' or jsonb_typeof(p_versions) is distinct from 'array'
    or jsonb_array_length(p_colors) not between 1 and 5 then
    raise exception 'invalid product' using errcode = '22023';
  end if;

  -- Serialize a first submission and a retry even before the product row exists.
  perform pg_advisory_xact_lock(hashtextextended('marketplace-fashion-product:' || p_product_id::text, 0));
  select * into product from public.marketplace_fashion_products where id = p_product_id for update;
  if found and product.seller_id <> seller then
    raise exception 'product owner required' using errcode = '42501';
  end if;
  if (product.id is not null and p_expected_updated_at is null)
    or product.updated_at is distinct from p_expected_updated_at then
    raise exception 'product changed' using errcode = '40001';
  end if;
  contact_phone := product.seller_phone;
  delivery_tiyin := product.shipping_tiyin;

  -- The existing reservation, expiry, moderation and seller archive paths all
  -- lock the individual listing before changing it and advance its timestamp.
  perform 1 from public.marketplace_listings where fashion_product_id = p_product_id order by id for update;
  if exists (
    select 1 from (select id, updated_at from public.marketplace_listings where fashion_product_id = p_product_id) l
    full join jsonb_to_recordset(p_versions) as v(id uuid, updated_at timestamptz)
      on v.id = l.id and v.updated_at = l.updated_at
    where l.id is null or v.id is null
  ) or jsonb_array_length(p_versions) <> (select count(*) from public.marketplace_listings where fashion_product_id = p_product_id) then
    raise exception 'listing inventory changed' using errcode = '40001';
  end if;

  select * into product from jsonb_populate_record(null::public.marketplace_fashion_products, p_details
    - array['id','seller_id','updated_at']);
  product.brand := coalesce(product.brand,'');
  product.material := coalesce(product.material,'');
  product.fit := coalesce(product.fit,'');
  product.care := coalesce(product.care,'');
  product.size_guide := coalesce(product.size_guide,'[]'::jsonb);
  insert into public.marketplace_fashion_products as p
    (id,seller_id,title,description,category,brand,material,fit,care,price_tiyin,state,size_guide)
    values (p_product_id,seller,product.title,product.description,product.category,product.brand,product.material,
      product.fit,product.care,product.price_tiyin,product.state,product.size_guide)
    on conflict (id) do update set title=excluded.title, description=excluded.description, category=excluded.category,
      brand=excluded.brand, material=excluded.material, fit=excluded.fit, care=excluded.care, price_tiyin=excluded.price_tiyin,
      state=excluded.state, size_guide=excluded.size_guide, updated_at=greatest(clock_timestamp(),p.updated_at + interval '1 microsecond');

  for color in select * from jsonb_to_recordset(p_colors) as c(id uuid, name text, images jsonb, variants jsonb) order by id loop
    if color.id is null or color.id = any(color_ids) or jsonb_typeof(color.images) is distinct from 'array'
      or jsonb_array_length(color.images) > 4 or jsonb_typeof(color.variants) is distinct from 'array'
      or jsonb_array_length(color.variants) not between 1 and 12 then
      raise exception 'invalid color' using errcode = '22023';
    end if;
    color_ids := array_append(color_ids,color.id);
    perform marketplace_private.lock_fashion_images(color.id);
    filenames := array(select jsonb_array_elements_text(color.images));
    if cardinality(filenames) <> (select count(distinct f) from unnest(filenames) f)
      or exists (select 1 from unnest(filenames) f where marketplace_private.is_cs2_image_filename(f) is not true
        or not exists (select 1 from storage.objects o where o.bucket_id = 'marketplace-fashion-images'
          and o.name = color.id::text || '/' || f and o.owner_id = seller::text)) then
      raise exception 'invalid color images' using errcode = '23514';
    end if;
    insert into public.marketplace_fashion_colors as c (id,product_id,name,images)
      values (color.id,p_product_id,btrim(color.name),filenames)
      on conflict (id) do update set name=excluded.name, images=excluded.images where c.product_id = p_product_id;
    if not found then raise exception 'color belongs to another product' using errcode = '42501'; end if;

    for combination in select upper(btrim(v.size)) as size, coalesce(v.price_tiyin, product.price_tiyin) as price,
        v.price_tiyin is not null as price_override, v.quantity
      from jsonb_to_recordset(color.variants) as v(size text, price_tiyin bigint, quantity integer) loop
      insert into public.marketplace_listings as l (seller_id,ecosystem,title,description,category,variant,price_tiyin,
        quantity,state,fashion_product_id,fashion_color_id,fashion_size,fashion_price_override)
        values (seller,'fashion',product.title,product.description,product.category,btrim(color.name) || ' · ' || combination.size,
          combination.price,combination.quantity,product.state,p_product_id,color.id,combination.size,combination.price_override)
        on conflict (fashion_color_id,fashion_size) where fashion_product_id is not null do update
          set title=excluded.title, description=excluded.description, category=excluded.category, variant=excluded.variant,
              price_tiyin=excluded.price_tiyin, fashion_price_override=excluded.fashion_price_override,
              quantity=excluded.quantity, state=excluded.state
          where l.moderation_status = 'allowed'
        returning id into saved_id;
      if not found then raise exception 'variant is blocked' using errcode = '42501'; end if;
      if saved_id = any(listing_ids) then raise exception 'duplicate size' using errcode = '23505'; end if;
      listing_ids := array_append(listing_ids, saved_id);
    end loop;
  end loop;

  -- Check the final names after all edits, allowing two existing colors to
  -- exchange names. The product lock serializes every writer of these rows.
  if exists (select 1 from public.marketplace_fashion_colors where id = any(color_ids)
    group by lower(name) having count(*) > 1) then
    raise exception 'duplicate color name' using errcode = '23505';
  end if;
  if exists (select 1 from jsonb_array_elements(product.size_guide) g
      where jsonb_typeof(g->'size') is distinct from 'string' or jsonb_typeof(g->'measurements') is distinct from 'string'
        or (g - array['size','measurements']) <> '{}'::jsonb)
    or exists (select 1 from jsonb_to_recordset(product.size_guide) as g(size text, measurements text)
    where coalesce(char_length(btrim(g.measurements)),0) not between 1 and 160
      or not exists (select 1 from public.marketplace_listings l where l.id = any(listing_ids) and l.fashion_size = g.size))
    or (select count(distinct g.size) from jsonb_to_recordset(product.size_guide) as g(size text)) <> jsonb_array_length(product.size_guide) then
    raise exception 'invalid size guide' using errcode = '22023';
  end if;

  update public.marketplace_listings set state = 'archived' where fashion_product_id = p_product_id
    and moderation_status = 'allowed' and state <> 'archived' and not (id = any(listing_ids));
  update public.marketplace_fashion_colors set images = '{}' where product_id = p_product_id
    and cardinality(images) > 0 and not (id = any(color_ids));
  if contact_phone is not null then
    -- Keep existing quotes current when their terms have not changed.
    for saved_id in select id from unnest(listing_ids) as id
      where not exists (select 1 from public.marketplace_checkout_terms t where t.listing_id = id
        and t.seller_phone = contact_phone and t.shipping_tiyin = delivery_tiyin)
    loop
      perform public.marketplace_set_checkout_terms(saved_id, contact_phone, delivery_tiyin, null);
    end loop;
  end if;
  return p_product_id;
end;
$$;

create function public.marketplace_set_fashion_checkout_terms(p_product_id uuid,p_seller_phone text,p_shipping_tiyin bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare listing_id uuid;
begin
  perform 1 from public.marketplace_fashion_products
    where id = p_product_id and marketplace_private.can_manage_listing(seller_id, 'fashion') for update;
  if not found then raise exception 'product owner required' using errcode = '42501'; end if;
  if p_seller_phone is null or p_seller_phone !~ '^[+][1-9][0-9]{7,14}$'
    or p_shipping_tiyin is null or p_shipping_tiyin not between 0 and 100000000000000 then
    raise exception 'invalid checkout terms' using errcode = '22023';
  end if;
  for listing_id in select id from public.marketplace_listings where fashion_product_id = p_product_id
    and state <> 'archived' and moderation_status = 'allowed' order by id for update loop
    perform public.marketplace_set_checkout_terms(listing_id,p_seller_phone,p_shipping_tiyin,null);
  end loop;
  update public.marketplace_fashion_products set seller_phone = p_seller_phone, shipping_tiyin = p_shipping_tiyin
    where id = p_product_id;
end;
$$;
revoke all on function public.marketplace_save_fashion_product(uuid,timestamptz,jsonb,jsonb,jsonb),
  public.marketplace_set_fashion_checkout_terms(uuid,text,bigint) from public, anon, authenticated;
grant execute on function public.marketplace_save_fashion_product(uuid,timestamptz,jsonb,jsonb,jsonb),
  public.marketplace_set_fashion_checkout_terms(uuid,text,bigint) to authenticated;

create or replace view public.marketplace_public_listings with (security_barrier = true) as
  select l.id,l.ecosystem,l.title,l.description,l.category,l.variant,l.price_tiyin,(l.quantity > 0) as available,l.created_at,
    md5(l.seller_id::text || ':' || l.cs2_group_id::text) as cs2_group_key,l.cs2_category,l.cs2_model,l.cs2_wear,l.cs2_images,
    l.fashion_product_id,l.fashion_color_id,c.name as fashion_color,l.fashion_size,c.images as fashion_images,
    p.brand as fashion_brand,p.material as fashion_material,p.fit as fashion_fit,p.care as fashion_care,p.size_guide as fashion_size_guide
  from public.marketplace_listings l
  left join public.marketplace_fashion_products p on p.id = l.fashion_product_id
  left join public.marketplace_fashion_colors c on c.id = l.fashion_color_id
  where l.state = 'published' and marketplace_private.listing_is_public(l.id);

create view public.marketplace_public_fashion_catalog with (security_barrier = true) as
  select distinct on (fashion_product_id, case when fashion_product_id is null then id end) *
    from public.marketplace_public_listings where ecosystem = 'fashion'
    order by fashion_product_id, case when fashion_product_id is null then id end,
      available desc, price_tiyin, created_at desc, id;
revoke all on public.marketplace_public_fashion_catalog from public, anon, authenticated;
grant select on public.marketplace_public_fashion_catalog to anon, authenticated;

commit;
