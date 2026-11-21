-- Each wear keeps its own listing, inventory, visibility and checkout terms.
begin;

alter table public.marketplace_listings
  add column cs2_group_id uuid,
  add column cs2_category text,
  add column cs2_model text,
  add column cs2_wear text,
  add column cs2_images text[] not null default '{}',
  add column cs2_group_primary boolean not null default false,
  add constraint marketplace_listings_cs2_classification check (
    (cs2_group_id is null and cs2_category is null and cs2_model is null and cs2_wear is null
      and cardinality(cs2_images) = 0 and not cs2_group_primary)
    or (
      ecosystem = 'cs2' and cs2_group_id is not null and cs2_category is not null
      and cs2_model is not null and cs2_wear is not null
      and category = cs2_category and variant = cs2_wear
      and cs2_wear in ('FN', 'MW', 'FT', 'WW', 'BS', 'NP')
      and left(title, char_length(cs2_model) + 3) = cs2_model || ' | '
      and case cs2_category
        when 'pistol' then cs2_model in ('CZ75-Auto', 'Desert Eagle', 'Dual Berettas', 'Five-SeveN',
          'Glock-18', 'P2000', 'P250', 'R8 Revolver', 'Tec-9', 'USP-S')
        when 'rifle' then cs2_model in ('AK-47', 'AUG', 'FAMAS', 'Galil AR', 'M4A1-S', 'M4A4', 'SG 553')
        when 'sniper-rifle' then cs2_model in ('AWP', 'G3SG1', 'SCAR-20', 'SSG 08')
        when 'smg' then cs2_model in ('MAC-10', 'MP5-SD', 'MP7', 'MP9', 'P90', 'PP-Bizon', 'UMP-45')
        when 'shotgun' then cs2_model in ('MAG-7', 'Nova', 'Sawed-Off', 'XM1014')
        when 'machinegun' then cs2_model in ('M249', 'Negev')
        when 'knife' then cs2_model in ('Bayonet', 'Bowie Knife', 'Butterfly Knife', 'Classic Knife',
          'Falchion Knife', 'Flip Knife', 'Gut Knife', 'Huntsman Knife', 'Karambit', 'Kukri Knife',
          'M9 Bayonet', 'Navaja Knife', 'Nomad Knife', 'Paracord Knife', 'Shadow Daggers',
          'Skeleton Knife', 'Stiletto Knife', 'Survival Knife', 'Talon Knife', 'Ursus Knife')
        when 'gloves' then cs2_model in ('Bloodhound Gloves', 'Broken Fang Gloves', 'Driver Gloves',
          'Hand Wraps', 'Hydra Gloves', 'Moto Gloves', 'Specialist Gloves', 'Sport Gloves')
        when 'zeus' then cs2_model = 'Zeus x27'
        else false
      end
    )
  );

create unique index marketplace_listings_cs2_group_wear_idx
  on public.marketplace_listings (seller_id, cs2_group_id, cs2_wear) where cs2_group_id is not null;
-- The selected primary wear is a submission marker, even when a retry selects different wears.
create unique index marketplace_listings_cs2_group_primary_idx
  on public.marketplace_listings (seller_id, cs2_group_id) where cs2_group_primary;
create index marketplace_listings_cs2_classification_idx
  on public.marketplace_listings (cs2_category, cs2_model, cs2_wear)
  where ecosystem = 'cs2' and state = 'published';
create index marketplace_listings_cs2_wear_idx on public.marketplace_listings (cs2_wear)
  where ecosystem = 'cs2' and state = 'published';
create index marketplace_listings_cs2_public_group_idx
  on public.marketplace_listings ((md5(seller_id::text || ':' || cs2_group_id::text)))
  where state = 'published';

grant insert (cs2_group_id, cs2_category, cs2_model, cs2_wear, cs2_images, cs2_group_primary)
  on public.marketplace_listings to authenticated;
grant update (cs2_images) on public.marketplace_listings to authenticated;

create or replace view public.marketplace_public_listings with (security_barrier = true) as
  select id, ecosystem, title, description, category, variant, price_tiyin,
    (quantity > 0) as available, created_at,
    md5(seller_id::text || ':' || cs2_group_id::text) as cs2_group_key,
    cs2_category, cs2_model, cs2_wear, cs2_images
  from public.marketplace_listings
  where state = 'published' and marketplace_private.listing_is_public(id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marketplace-cs2-images', 'marketplace-cs2-images', false, 163840, array['image/webp']);

create function marketplace_private.is_cs2_image_filename(p_filename text) returns boolean
language sql immutable strict set search_path = '' as $$
  select (p_filename collate "C") ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$';
$$;
create function marketplace_private.cs2_image_listing_id(p_name text) returns uuid
language sql immutable strict set search_path = '' as $$
  select case when (left(p_name, 36) collate "C") ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
    and substr(p_name, 37, 1) = '/' and marketplace_private.is_cs2_image_filename(substr(p_name, 38))
    then left(p_name, 36)::uuid end;
$$;

create function marketplace_private.can_upload_cs2_image(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select listing_id is not null
    and not exists (
      select 1 from public.marketplace_listings l
      where l.id = listing_id and (l.seller_id <> (select auth.uid()) or l.ecosystem <> 'cs2')
    )
  from (select marketplace_private.cs2_image_listing_id(p_name) as listing_id) as path;
$$;

create function marketplace_private.cs2_image_is_public(p_name text, p_owner text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.marketplace_listings l
    where l.id = marketplace_private.cs2_image_listing_id(p_name)
      and l.seller_id::text = p_owner and substr(p_name, 38) = any(l.cs2_images)
      and marketplace_private.listing_is_public(l.id)
  );
$$;

-- Serialize attaching and removing media for the same listing. The delete check
-- reads the listing after acquiring the lock, and attachment checks see object
-- removal committed before that lock was acquired.
create function marketplace_private.lock_cs2_listing_images(p_listing uuid) returns void
language sql volatile strict set search_path = '' as $$
  select pg_advisory_xact_lock(hashtextextended('marketplace-cs2-images:' || p_listing::text, 0));
$$;

create function marketplace_private.can_delete_cs2_image(p_name text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v_listing uuid := marketplace_private.cs2_image_listing_id(p_name);
begin
  if v_listing is null or marketplace_private.can_manage_listing((select auth.uid()), 'cs2') is not true
    or not exists (select 1 from storage.objects o where o.bucket_id = 'marketplace-cs2-images'
      and o.name = p_name and o.owner_id = (select auth.uid()::text)) then
    return false;
  end if;
  perform marketplace_private.lock_cs2_listing_images(v_listing);
  return not exists (select 1 from public.marketplace_listings l
    where l.id = v_listing and substr(p_name, 38) = any(l.cs2_images));
end;
$$;

create function marketplace_private.validate_cs2_listing_images() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_count integer := cardinality(new.cs2_images);
begin
  if v_count = 0 then
    return new;
  end if;
  if v_count > 4 or array_ndims(new.cs2_images) <> 1 or array_lower(new.cs2_images, 1) <> 1
    or (select count(distinct filename) from unnest(new.cs2_images) as filename) <> v_count
    or exists (select 1 from unnest(new.cs2_images) as filename
      where marketplace_private.is_cs2_image_filename(filename) is not true) then
    raise exception 'CS2 images must contain up to four distinct WebP filenames' using errcode = '23514';
  end if;

  perform marketplace_private.lock_cs2_listing_images(new.id);
  if exists (
    select 1 from unnest(new.cs2_images) as filename
    where not exists (select 1 from storage.objects o where o.bucket_id = 'marketplace-cs2-images'
      and o.name = new.id::text || '/' || filename and o.owner_id = new.seller_id::text)
  ) then
    raise exception 'CS2 images must be uploaded by the listing owner to the listing path' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function marketplace_private.is_cs2_image_filename(text), marketplace_private.cs2_image_listing_id(text),
  marketplace_private.can_upload_cs2_image(text), marketplace_private.cs2_image_is_public(text, text),
  marketplace_private.lock_cs2_listing_images(uuid), marketplace_private.can_delete_cs2_image(text),
  marketplace_private.validate_cs2_listing_images() from public, anon, authenticated;
grant execute on function marketplace_private.can_upload_cs2_image(text), marketplace_private.can_delete_cs2_image(text) to authenticated;
grant execute on function marketplace_private.cs2_image_is_public(text, text) to anon, authenticated;

create trigger marketplace_validate_cs2_images_on_insert before insert on public.marketplace_listings
  for each row execute function marketplace_private.validate_cs2_listing_images();
create trigger marketplace_validate_cs2_images_on_update before update of cs2_images on public.marketplace_listings
  for each row when (old.cs2_images is distinct from new.cs2_images)
  execute function marketplace_private.validate_cs2_listing_images();

create policy marketplace_cs2_images_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'marketplace-cs2-images' and (select storage.allow_only_operation('storage.object.upload'))
    and owner_id = (select auth.uid()::text)
    and (select marketplace_private.can_manage_listing(auth.uid(), 'cs2'))
    and marketplace_private.can_upload_cs2_image(name));

create policy marketplace_cs2_images_public_download on storage.objects for select to anon, authenticated
  using (bucket_id = 'marketplace-cs2-images' and (select storage.allow_only_operation('storage.object.get_authenticated'))
    and marketplace_private.cs2_image_is_public(name, owner_id));

-- Storage removal needs SELECT for its DELETE ... RETURNING statement.
create policy marketplace_cs2_images_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'marketplace-cs2-images' and owner_id = (select auth.uid()::text)
    and (select storage.allow_any_operation(array['storage.object.get_authenticated', 'storage.object.delete', 'storage.object.delete_many']))
    and (select marketplace_private.can_manage_listing(auth.uid(), 'cs2')));

create policy marketplace_cs2_images_remove on storage.objects for delete to authenticated
  using (bucket_id = 'marketplace-cs2-images' and owner_id = (select auth.uid()::text)
    and (select storage.allow_any_operation(array['storage.object.delete', 'storage.object.delete_many']))
    and marketplace_private.can_delete_cs2_image(name));

commit;
