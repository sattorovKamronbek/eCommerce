// @vitest-environment node
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
const seller = "00000000-0000-4000-8000-000000000001";
const otherSeller = "00000000-0000-4000-8000-000000000002";
const fashionSeller = "00000000-0000-4000-8000-000000000003";
const buyer = "00000000-0000-4000-8000-000000000004";
const legacy = "10000000-0000-4000-8000-000000000001";
const legacyFashion = "10000000-0000-4000-8000-000000000002";
const photo = "30000000-0000-4000-8000-000000000001.webp";
const bucket = "marketplace-fashion-images";
const upload = "storage.object.upload";
const download = "storage.object.get_authenticated";
const remove = "storage.object.delete_many";

function asUser<T extends Record<string, unknown> = Record<string, unknown>>(
  user: string | null,
  sql: string,
  values: unknown[] = [],
  { aal = "aal2", operation = "" } = {},
) {
  return db.transaction(async transaction => {
    await transaction.exec(user ? "set local role authenticated" : "set local role anon");
    await transaction.query(`select set_config('request.jwt.claim.sub', $1, true),
      set_config('request.jwt.claims', $2, true), set_config('test.storage.operation', $3, true)`,
    [user ?? "", JSON.stringify({ aal }), operation]);
    return transaction.query<T>(sql, values);
  });
}

function uploadObject(user: string, path: string, { owner = user, aal = "aal2", operation = upload } = {}) {
  return asUser(user, "insert into storage.objects(bucket_id, name, owner_id) values ($1, $2, $3)",
    [bucket, path, owner], { aal, operation });
}

function readObject(user: string | null, path: string, { aal = "aal2", operation = download } = {}) {
  return asUser(user, "select name from storage.objects where bucket_id = $1 and name = $2",
    [bucket, path], { aal, operation });
}

function deleteObject(user: string, path: string, operation = remove) {
  return asUser(user, "delete from storage.objects where bucket_id = $1 and name = $2 returning name",
    [bucket, path], { operation });
}

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb, email_confirmed_at timestamptz,
      banned_until timestamptz, deleted_at timestamptz);
    create table auth.mfa_factors(user_id uuid, status text);
    create table auth.sessions(id uuid primary key, user_id uuid);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
    grant usage on schema auth to anon, authenticated;

    -- The managed Storage service supplies these relations and operation helpers.
    create schema storage;
    create table storage.buckets(id text primary key, name text not null unique, public boolean not null default false,
      file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
      name text, owner_id text, unique(bucket_id, name));
    create function storage.allow_any_operation(expected text[]) returns boolean language sql stable as $$
      select coalesce(current_setting('test.storage.operation', true) = any(expected), false) $$;
    create function storage.allow_only_operation(expected text) returns boolean language sql stable as $$
      select storage.allow_any_operation(array[expected]) $$;
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated;
    grant select on storage.objects to anon;
    grant select, insert, update, delete on storage.objects to authenticated;`);

  const directory = new URL("../migrations/", import.meta.url);
  const migrations = (await readdir(directory)).filter(name => name.endsWith(".sql")).sort();
  for (const migration of migrations.filter(name => name < "202611210009")) {
    await db.exec(await readFile(new URL(migration, directory), "utf8"));
  }
  await db.query(`insert into auth.users(id, raw_user_meta_data, email_confirmed_at)
    select id, '{}', now() from unnest($1::uuid[]) as id`, [[seller, otherSeller, fashionSeller, buyer]]);
  await db.query("insert into auth.mfa_factors values ($1, 'verified'), ($2, 'verified'), ($3, 'verified')",
    [seller, otherSeller, fashionSeller]);
  await db.query(`insert into public.marketplace_seller_applications
    (applicant_id, applicant_type, name, contact, region, requested_scope, status) values
    ($1, 'individual', 'Seller', 'a', 'Tashkent', 'both', 'approved'),
    ($2, 'individual', 'Other seller', 'b', 'Tashkent', 'cs2', 'approved'),
    ($3, 'individual', 'Fashion seller', 'c', 'Tashkent', 'fashion', 'approved')`, [seller, otherSeller, fashionSeller]);
  await db.query(`insert into public.marketplace_seller_grants (seller_id, application_revision)
    values ($1, 1), ($2, 1), ($3, 1)`, [seller, otherSeller, fashionSeller]);
  await asUser(seller, `insert into public.marketplace_listings
    (id, seller_id, ecosystem, title, description, price_tiyin, quantity, state) values
    ($1, $3, 'cs2', 'Legacy skin', 'Details', 100, 1, 'published'),
    ($2, $3, 'fashion', 'Legacy shirt', 'Details', 250, 2, 'published')`, [legacy, legacyFashion, seller]);
  await db.exec(await readFile(new URL("202611210009_fashion_listing_variants.sql", directory), "utf8"));
}, 45000);

afterAll(async () => { await db.close(); });

const details = { title: "Polo", description: "Cotton polo", category: "polo", brand: "Brand", material: "Cotton",
  fit: "Regular", care: "Hand wash", price_tiyin: 1000, state: "published", size_guide: [{ size: "M", measurements: "Chest 96" }] };
const black = (id = crypto.randomUUID()) => ({ id, name: "Black", images: [] as string[], variants: [
  { size: "M", price_tiyin: 1200 as number | null, quantity: 3 }, { size: "L", price_tiyin: 800, quantity: 0 },
] });
type Color = ReturnType<typeof black>;
type Version = { id: string; updated_at: string };
async function snapshot(id: string) {
  const product = await asUser<{ version: string }>(seller, "select updated_at::text as version from marketplace_fashion_products where id = $1", [id]);
  const listings = await asUser<Version>(seller, "select id, updated_at::text from marketplace_listings where fashion_product_id = $1", [id]);
  return { version: product.rows[0].version, versions: listings.rows };
}
function save(id: string, colors: Color[], options: { who?: string | null; aal?: string; version?: string; versions?: Version[]; state?: string; defaultPrice?: number } = {}) {
  return asUser(options.who === undefined ? seller : options.who,
    "select marketplace_save_fashion_product($1,$2,$3,$4,$5) as id",
    [id, options.version ?? null, JSON.stringify({ ...details, price_tiyin: options.defaultPrice ?? details.price_tiyin,
      size_guide: details.size_guide.filter(row => colors.some(color => color.variants.some(v => v.size === row.size))), state: options.state ?? "published" }), JSON.stringify(colors),
      JSON.stringify(options.versions ?? [])], { aal: options.aal });
}

it("preserves an explicit override equal to the original base price when the base price changes", async () => {
  const id = crypto.randomUUID();
  const color = { ...black(), variants: [{ size: "M", price_tiyin: 1000, quantity: 2 }, { size: "L", price_tiyin: null, quantity: 3 }] };
  await save(id, [color]);
  const readPrices = () => asUser(seller, `select fashion_size, price_tiyin, fashion_price_override from marketplace_listings
    where fashion_product_id = $1 order by fashion_size`, [id]);
  expect((await readPrices()).rows).toEqual([
    { fashion_size: "L", price_tiyin: 1000, fashion_price_override: false },
    { fashion_size: "M", price_tiyin: 1000, fashion_price_override: true },
  ]);
  await save(id, [color], { ...await snapshot(id), defaultPrice: 1250 });
  expect((await readPrices()).rows).toEqual([
    { fashion_size: "L", price_tiyin: 1250, fashion_price_override: false },
    { fashion_size: "M", price_tiyin: 1000, fashion_price_override: true },
  ]);
});

it("loads color photos, sizes and stock versions in one owner-only draft", async () => {
  const id = crypto.randomUUID();
  const color = black();
  await save(id, [color]);
  const getDraft = (who: string) => asUser(who, "select marketplace_fashion_draft($1) as draft", [id]);
  expect((await getDraft(seller)).rows).toEqual([{ draft: {
    product: expect.objectContaining({ id, updated_at: expect.any(String) }),
    colors: [expect.objectContaining({ id: color.id, name: "Black", images: [] })],
    listings: expect.arrayContaining([expect.objectContaining({ fashion_size: "M", quantity: 3, updated_at: expect.any(String) })]),
  } }]);
  expect((await getDraft(fashionSeller)).rows).toEqual([{ draft: null }]);
});

it("applies current shipping and contact to new and reactivated combinations", async () => {
  const id = crypto.randomUUID();
  const color = black();
  await save(id, [color]);
  await asUser(seller, "select marketplace_set_fashion_checkout_terms($1,'+998901234567',150)", [id]);
  await save(id, [{ ...color, variants: [color.variants[0]] }], await snapshot(id));
  await asUser(seller, "select marketplace_set_fashion_checkout_terms($1,'+998909876543',250)", [id]);
  await save(id, [{ ...color, variants: [...color.variants, { size: "XL", quantity: 1, price_tiyin: null }] }], await snapshot(id));
  expect((await asUser(seller, `select fashion_size,seller_phone,shipping_tiyin from marketplace_listings l
    join marketplace_checkout_terms t on t.listing_id=l.id where fashion_product_id=$1 order by fashion_size`, [id])).rows).toEqual([
    { fashion_size: "L", seller_phone: "+998909876543", shipping_tiyin: 250 },
    { fashion_size: "M", seller_phone: "+998909876543", shipping_tiyin: 250 },
    { fashion_size: "XL", seller_phone: "+998909876543", shipping_tiyin: 250 },
  ]);
});

it("publishes one stocked representative, preserving listing IDs, variants and legacy clothing", async () => {
  const id = crypto.randomUUID();
  const color = black();
  await save(id, [color]);
  const catalog = await asUser(null, "select title, fashion_color, fashion_size, fashion_brand, price_tiyin from marketplace_public_fashion_catalog where fashion_product_id = $1", [id]);
  expect(catalog.rows).toEqual([{ title: "Polo", fashion_color: "Black", fashion_size: "M", fashion_brand: "Brand", price_tiyin: 1200 }]);
  expect((await asUser(null, "select id from marketplace_public_fashion_catalog where fashion_product_id is null")).rows).toEqual([{ id: legacyFashion }]);
  const original = (await snapshot(id)).versions.map(row => row.id).sort();
  await save(id, [{ ...color, variants: [color.variants[1]] }], await snapshot(id));
  expect((await asUser(null, "select fashion_size from marketplace_public_listings where fashion_product_id = $1", [id])).rows).toEqual([{ fashion_size: "L" }]);
  await save(id, [color], await snapshot(id));
  expect((await snapshot(id)).versions.map(row => row.id).sort()).toEqual(original);
  await db.query("update marketplace_listings set state='archived', moderation_status='blocked' where fashion_product_id=$1 and fashion_size='M'", [id]);
  await expect(save(id, [color], await snapshot(id))).rejects.toMatchObject({ code: "42501" });
});

it("rolls back duplicate combinations, rejects stale and unauthorized submissions", async () => {
  const id = crypto.randomUUID();
  const color = black();
  for (const who of [buyer, otherSeller, null]) {
    await expect(save(id, [color], { who })).rejects.toMatchObject({ code: "42501" });
  }
  await expect(save(id, [color], { aal: "aal1" })).rejects.toMatchObject({ code: "42501" });
  await expect(save(id, [{ ...color, variants: [...color.variants, { ...color.variants[0], size: " m " }] }])).rejects.toThrow();
  await save(id, [color]);
  await expect(save(id, [color])).rejects.toMatchObject({ code: "40001" });
  await expect(save(id, [color], { ...await snapshot(id), who: fashionSeller })).rejects.toMatchObject({ code: "42501" });
  await expect(save(crypto.randomUUID(), [color], { who: fashionSeller })).rejects.toThrow();
  const previous = await snapshot(id);
  await expect(save(id, [color], { ...previous, versions: [] })).rejects.toMatchObject({ code: "40001" });
  expect((await asUser(fashionSeller, "select id from marketplace_fashion_products where id = $1", [id])).rows).toEqual([]);
});

it("limits gallery previews, protects referenced photos and revokes anonymous access on archive", async () => {
  const id = crypto.randomUUID();
  const color = { ...black(), images: [photo] };
  const path = color.id + "/" + photo;
  await expect(save(id, [color])).rejects.toThrow();
  await expect(uploadObject(otherSeller, path)).rejects.toMatchObject({ code: "42501" });
  await uploadObject(seller, path);
  await save(id, [color], { state: "draft" });
  expect((await readObject(null, path)).rows).toEqual([]);
  expect((await readObject(seller, path)).rows).toEqual([{ name: path }]);
  expect((await readObject(fashionSeller, path)).rows).toEqual([]);
  expect((await deleteObject(seller, path)).rows).toEqual([]);
  await save(id, [color], await snapshot(id));
  expect((await readObject(null, path)).rows).toEqual([{ name: path }]);
  expect((await readObject(null, path, { operation: "storage.object.list" })).rows).toEqual([]);
  await asUser(seller, "update marketplace_listings set state='archived' where fashion_product_id=$1", [id]);
  expect((await readObject(null, path)).rows).toEqual([]);
  await expect(asUser(seller, "update marketplace_listings set state='published' where fashion_product_id=$1", [id])).rejects.toThrow();
  await save(id, [{ ...black(), name: "White" }], await snapshot(id));
  expect((await deleteObject(seller, path)).rows).toEqual([{ name: path }]);
});

it("reserves the selected size, rejects stale inventory, and applies product checkout terms", async () => {
  const id = crypto.randomUUID();
  const color = black();
  await save(id, [color]);
  const previous = await snapshot(id);
  await db.exec("update marketplace_private.direct_order_settings set accepting_orders = true");
  const terms = "select marketplace_set_fashion_checkout_terms($1,'+998901234567',150)";
  await expect(asUser(fashionSeller, terms, [id])).rejects.toMatchObject({ code: "42501" });
  await asUser(seller, terms, [id]);
  expect((await db.query("select count(*)::int as count from marketplace_checkout_terms where listing_id=any($1::uuid[])", [previous.versions.map(v => v.id)])).rows).toEqual([{ count: 2 }]);
  const { rows: [offer] } = await asUser<{ listing_id: string; quote: string }>(null,
    "select listing_id,quote from marketplace_checkout_offers where listing_id=any($1::uuid[])", [previous.versions.map(v => v.id)]);
  await asUser(buyer, "select marketplace_reserve_order($1,$2,$3,1,'Customer','+998901234567','Delivery address')", [crypto.randomUUID(), offer.listing_id, offer.quote]);
  await expect(save(id, [color], previous)).rejects.toMatchObject({ code: "40001" });
  expect((await asUser(seller, "select fashion_size,quantity from marketplace_listings where fashion_product_id=$1 order by fashion_size", [id])).rows)
    .toEqual([{ fashion_size: "L", quantity: 0 }, { fashion_size: "M", quantity: 2 }]);
  expect((await asUser(buyer, "select listing_id,variant,total_tiyin from marketplace_orders where listing_id=$1", [offer.listing_id])).rows)
    .toEqual([{ listing_id: offer.listing_id, variant: "Black · M", total_tiyin: 1350 }]);
});

it("orders photos by seller choice and chooses the least expensive stocked color per product", async () => {
  const id = crypto.randomUUID();
  const main = black();
  const secondPhoto = crypto.randomUUID() + ".webp";
  const white = { ...black(), name: "White", images: [secondPhoto, photo],
    variants: [{ size: "M", price_tiyin: 900, quantity: 1 }] };
  for (const filename of white.images) await uploadObject(seller, white.id + "/" + filename);
  await save(id, [main, white]);
  expect((await asUser(null, `select fashion_color_id,fashion_size,fashion_images,fashion_size_guide
    from marketplace_public_fashion_catalog where fashion_product_id=$1`, [id])).rows).toEqual([
    { fashion_color_id: white.id, fashion_size: "M", fashion_images: [secondPhoto, photo], fashion_size_guide: details.size_guide },
  ]);
  expect((await asUser(null, "select count(*)::int as count from marketplace_public_listings where fashion_product_id=$1", [id])).rows)
    .toEqual([{ count: 3 }]);
  await save(id, [{ ...main, name: white.name }, { ...white, name: main.name }], await snapshot(id));
  await db.query("insert into marketplace_private.suspended_accounts(user_id) values ($1)", [seller]);
  try {
    expect((await readObject(null, white.id + "/" + photo)).rows).toEqual([]);
    expect((await readObject(seller, white.id + "/" + photo)).rows).toEqual([]);
    expect((await asUser(null, "select id from marketplace_public_fashion_catalog where fashion_product_id=$1", [id])).rows).toEqual([]);
  } finally {
    await db.query("delete from marketplace_private.suspended_accounts where user_id = $1", [seller]);
  }
});

it("rejects oversized matrices, duplicate color names, and incorrectly owned galleries atomically", async () => {
  const id = crypto.randomUUID();
  const main = black();
  await uploadObject(fashionSeller, main.id + "/" + photo);
  for (const colors of [
    [{ ...main, images: [photo] }],
    [main, { ...black(), name: "BLACK" }],
    [main, { ...main, name: "Different" }],
    Array.from({ length: 6 }, (_, i) => ({ ...black(), name: "Color " + i })),
    [{ ...main, variants: Array.from({ length: 13 }, (_, i) => ({ size: String(i), price_tiyin: 100, quantity: 1 })) }],
    [{ ...main, images: Array.from({ length: 5 }, () => crypto.randomUUID() + ".webp") }],
  ]) await expect(save(id, colors)).rejects.toThrow();
  expect((await asUser(seller, "select id from marketplace_fashion_products where id=$1", [id])).rows).toEqual([]);
  await save(id, [main]);
  const { versions } = await snapshot(id);
  await expect(asUser(seller, "update marketplace_fashion_colors set images='{}' where id=$1", [main.id])).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(seller, "update marketplace_listings set fashion_size='S' where id=$1", [versions[0].id])).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(seller, "update marketplace_listings set state='archived',quantity=999 where id=$1", [versions[0].id])).rejects.toMatchObject({ code: "42501" });
});

it("retains published clothing galleries and restricts variant writes after the transition", async () => {
  const id = crypto.randomUUID();
  const color = { ...black(), images: [photo] };
  const path = `${color.id}/${photo}`;
  await uploadObject(seller, path);
  await save(id, [color]);
  const version = await snapshot(id);
  await db.query("insert into public.marketplace_user_roles(user_id, role) values ($1, 'admin')", [fashionSeller]);
  for (const name of ["202611220012_seller_application_intake.sql", "202611220014_single_vendor_transition.sql"]) {
    await db.exec(await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8"));
  }

  expect((await readObject(null, path)).rows).toEqual([{ name: path }]);
  await expect(uploadObject(seller, `${color.id}/${crypto.randomUUID()}.webp`)).rejects.toMatchObject({ code: "42501" });
  await expect(save(id, [color], version)).rejects.toMatchObject({ code: "42501" });
  const storeProduct = crypto.randomUUID();
  expect((await save(storeProduct, [black()], { who: fashionSeller })).rows).toEqual([{ id: storeProduct }]);
});
