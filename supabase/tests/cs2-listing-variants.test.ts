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
const groupedFn = "10000000-0000-4000-8000-000000000003";
const groupedMw = "10000000-0000-4000-8000-000000000004";
const otherFn = "10000000-0000-4000-8000-000000000005";
const withPhotos = "10000000-0000-4000-8000-000000000006";
const uploadPrefix = "10000000-0000-4000-8000-000000000007";
const visibilityListing = "10000000-0000-4000-8000-000000000008";
const group = "20000000-0000-4000-8000-000000000001";
const photosGroup = "20000000-0000-4000-8000-000000000002";
const photo = "30000000-0000-4000-8000-000000000001.webp";
const extraPhoto = "30000000-0000-4000-8000-000000000002.webp";
const foreignPhoto = "30000000-0000-4000-8000-000000000003.webp";
const photoPath = `${withPhotos}/${photo}`;
const extraPath = `${withPhotos}/${extraPhoto}`;
const bucket = "marketplace-cs2-images";
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

const typedColumns = `id, seller_id, ecosystem, title, description, category, variant, price_tiyin, quantity, state,
  cs2_group_id, cs2_category, cs2_model, cs2_wear, cs2_images`;
const createVariant = `insert into public.marketplace_listings(${typedColumns})
  values ($1, $2, $3, $4, 'Seller-provided details', $5, $6, $7, 1, $8, $9, $10, $11, $12, $13)`;
const updateImages = "update public.marketplace_listings set cs2_images = $2 where id = $1";

function createRifleGroup(fn: string, mw: string, groupId: string) {
  return asUser(seller, `insert into public.marketplace_listings (${typedColumns}) values
    ($1, $3, 'cs2', 'AK-47 | Redline', 'Details', 'rifle', 'FN', 38000000, 1, 'published', $4, 'rifle', 'AK-47', 'FN', '{}'),
    ($2, $3, 'cs2', 'AK-47 | Redline', 'Details', 'rifle', 'MW', 19000000, 1, 'published', $4, 'rifle', 'AK-47', 'MW', '{}')`,
  [fn, mw, seller, groupId]);
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
  for (const migration of migrations.filter(name => name < "202611210008")) {
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
  await db.exec(await readFile(new URL("202611210008_cs2_listing_variants.sql", directory), "utf8"));
}, 45000);

afterAll(async () => { await db.close(); });

it("retains the legacy public fields and defaults old listings to an empty gallery", async () => {
  const { rows } = await asUser(null, "select * from public.marketplace_public_listings where id = any($1::uuid[]) order by id", [[legacy, legacyFashion]]);
  expect(rows).toEqual([
    { id: legacy, ecosystem: "cs2", title: "Legacy skin", description: "Details", category: "", variant: "", price_tiyin: 100, available: true,
      created_at: expect.any(Date), cs2_group_key: null, cs2_category: null, cs2_model: null, cs2_wear: null, cs2_images: [] },
    { id: legacyFashion, ecosystem: "fashion", title: "Legacy shirt", description: "Details", category: "", variant: "", price_tiyin: 250, available: true,
      created_at: expect.any(Date), cs2_group_key: null, cs2_category: null, cs2_model: null, cs2_wear: null, cs2_images: [] },
  ]);
  await asUser(seller, "update public.marketplace_listings set price_tiyin = 150, category = 'legacy' where id = $1", [legacy]);
  expect((await asUser(null, "select price_tiyin, category from public.marketplace_public_listings where id = $1", [legacy])).rows)
    .toEqual([{ price_tiyin: 150, category: "legacy" }]);
});

it("assigns independent prices and one public key per seller and group", async () => {
  await createRifleGroup(groupedFn, groupedMw, group);
  await asUser(otherSeller, createVariant,
    [otherFn, otherSeller, "cs2", "AK-47 | Redline", "rifle", "FN", 20000000, "published", group, "rifle", "AK-47", "FN", []]);

  const { rows } = await asUser(null, `select id, cs2_group_key, cs2_model, cs2_wear, price_tiyin
    from public.marketplace_public_listings where cs2_category = 'rifle' and id = any($1::uuid[]) order by id`,
  [[groupedFn, groupedMw, otherFn]]);
  expect(rows).toEqual([
    { id: groupedFn, cs2_group_key: expect.stringMatching(/^[a-f0-9]{32}$/), cs2_model: "AK-47", cs2_wear: "FN", price_tiyin: 38000000 },
    { id: groupedMw, cs2_group_key: rows[0]?.cs2_group_key, cs2_model: "AK-47", cs2_wear: "MW", price_tiyin: 19000000 },
    { id: otherFn, cs2_group_key: expect.stringMatching(/^[a-f0-9]{32}$/), cs2_model: "AK-47", cs2_wear: "FN", price_tiyin: 20000000 },
  ]);
  expect(rows[2].cs2_group_key).not.toBe(rows[0].cs2_group_key);
  await expect(asUser(seller, createVariant,
    [uploadPrefix, seller, "cs2", "AK-47 | Redline", "rifle", "FN", 38000000, "draft", group, "rifle", "AK-47", "FN", []]))
    .rejects.toMatchObject({ code: "23505" });
  for (const column of ["cs2_group_id", "cs2_category", "cs2_model", "cs2_wear"]) {
    await expect(asUser(seller, `update public.marketplace_listings set ${column} = default where id = $1`, [groupedFn]))
      .rejects.toMatchObject({ code: "42501" });
  }
});

it("requires a complete, canonical CS2 classification for each typed row", async () => {
  const valid: (string | number | string[] | null)[] = [uploadPrefix, seller, "cs2", "Karambit | Doppler", "knife", "NP", 100,
    "draft", photosGroup, "knife", "Karambit", "NP", []];
  for (const [field, value] of [[2, "fashion"], [3, "Doppler"], [4, "Knives"], [5, "Factory New"], [8, null],
    [9, null], [10, "AK-47"], [11, "NA"], [11, null]] as const) {
    const values = [...valid];
    values[field] = value;
    await expect(asUser(seller, createVariant, values)).rejects.toMatchObject({ code: "23514" });
  }
  await asUser(seller, createVariant, valid);
  await expect(asUser(seller, "update public.marketplace_listings set variant = 'FN' where id = $1", [uploadPrefix]))
    .rejects.toMatchObject({ code: "23514" });
});

it("permits just one submission marker per seller and group regardless of wear", async () => {
  const submissionGroup = "20000000-0000-4000-8000-000000000003";
  const createPrimary = `insert into public.marketplace_listings(${typedColumns}, cs2_group_primary)
    values (gen_random_uuid(), $1, 'cs2', 'M4A1-S | Printstream', 'Details', 'rifle', $2,
      100, 1, 'draft', $3, 'rifle', 'M4A1-S', $2, '{}', true) returning id`;
  const { rows } = await asUser(seller, createPrimary, [seller, "FN", submissionGroup]);
  await expect(asUser(seller, createPrimary, [seller, "MW", submissionGroup])).rejects.toMatchObject({ code: "23505" });
  await asUser(otherSeller, createPrimary, [otherSeller, "FN", submissionGroup]);
  await expect(asUser(seller, "update public.marketplace_listings set cs2_group_primary = false where id = $1", [rows[0].id]))
    .rejects.toMatchObject({ code: "42501" });
  await expect(asUser(seller, `insert into public.marketplace_listings
    (seller_id, ecosystem, title, description, price_tiyin, quantity, cs2_group_primary)
    values ($1, 'cs2', 'Legacy title', 'Details', 100, 1, true)`, [seller])).rejects.toMatchObject({ code: "23514" });
});

it("allows only a current MFA-approved CS2 seller to upload owned WebP paths", async () => {
  const path = `${uploadPrefix}/${photo}`;
  expect((await db.query("select public, file_size_limit, allowed_mime_types from storage.buckets where id = $1", [bucket])).rows)
    .toEqual([{ public: false, file_size_limit: 163840, allowed_mime_types: ["image/webp"] }]);
  for (const [user, properties] of [[seller, { aal: "aal1" }], [fashionSeller, {}], [buyer, {}],
    [seller, { owner: otherSeller }], [seller, { operation: "" }], [seller, { operation: "storage.object.copy" }]] as const) {
    await expect(uploadObject(user, path, properties)).rejects.toMatchObject({ code: "42501" });
  }
  for (const invalidPath of [`${uploadPrefix}/file.webp`, `${uploadPrefix}/${photo}.jpg`, `${uploadPrefix}/nested/${photo}`, `root/${photo}`]) {
    await expect(uploadObject(seller, invalidPath)).rejects.toMatchObject({ code: "42501" });
  }
  await expect(uploadObject(otherSeller, `${legacy}/${photo}`)).rejects.toMatchObject({ code: "42501" });
  await uploadObject(seller, path);
  await expect(uploadObject(seller, path)).rejects.toMatchObject({ code: "23505" });
  await expect(asUser(seller, `insert into storage.objects(bucket_id, name, owner_id) values ($1, $2, $3)
    on conflict (bucket_id, name) do update set owner_id = excluded.owner_id`, [bucket, path, seller], { operation: upload }))
    .rejects.toMatchObject({ code: "42501" });
});

it("only attaches unique existing photos belonging to the listing owner and path", async () => {
  await uploadObject(seller, photoPath);
  await uploadObject(seller, extraPath);
  await uploadObject(otherSeller, `${withPhotos}/${foreignPhoto}`);
  await uploadObject(seller, `${legacy}/${foreignPhoto}`);
  const values = [withPhotos, seller, "cs2", "USP-S | Printstream", "pistol", "FT", 200, "draft",
    photosGroup, "pistol", "USP-S", "FT"];
  await expect(asUser(seller, createVariant, [...values, [foreignPhoto]])).rejects.toMatchObject({ code: "23514" });
  await asUser(seller, createVariant, [...values, [photo]]);
  for (const images of [[extraPhoto, extraPhoto], [photo, extraPhoto, foreignPhoto, photo, extraPhoto], [null], [foreignPhoto], [`not-a-uuid.webp`]]) {
    await expect(asUser(seller, updateImages, [withPhotos, images])).rejects.toMatchObject({ code: "23514" });
  }
  await expect(asUser(seller, updateImages, [legacy, [foreignPhoto]])).rejects.toMatchObject({ code: "23514" });
  await asUser(seller, updateImages, [withPhotos, [extraPhoto, photo]]);
  expect((await asUser(seller, "select cs2_images from public.marketplace_listings where id = $1", [withPhotos])).rows)
    .toEqual([{ cs2_images: [extraPhoto, photo] }]);
});

it("uses listing visibility to authorize photo downloads and limits cleanup to unreferenced owner objects", async () => {
  const primaryPath = `${visibilityListing}/${photo}`;
  const secondaryPath = `${visibilityListing}/${extraPhoto}`;
  const unreferencedPath = `${visibilityListing}/${foreignPhoto}`;
  await uploadObject(seller, primaryPath);
  await uploadObject(seller, secondaryPath);
  await uploadObject(seller, unreferencedPath);
  await asUser(seller, createVariant, [visibilityListing, seller, "cs2", "USP-S | Printstream", "pistol", "WW", 200,
    "draft", photosGroup, "pistol", "USP-S", "WW", [photo, extraPhoto]]);
  expect((await readObject(null, primaryPath)).rows).toEqual([]);
  expect((await readObject(seller, primaryPath)).rows).toEqual([{ name: primaryPath }]);
  expect((await readObject(seller, primaryPath, { aal: "aal1" })).rows).toEqual([]);
  expect((await readObject(otherSeller, primaryPath)).rows).toEqual([]);
  await asUser(seller, "update public.marketplace_listings set state = 'published' where id = $1", [visibilityListing]);
  expect((await readObject(null, primaryPath)).rows).toEqual([{ name: primaryPath }]);
  expect((await readObject(null, primaryPath, { operation: "storage.object.list" })).rows).toEqual([]);
  expect((await readObject(null, unreferencedPath)).rows).toEqual([]);
  expect((await deleteObject(seller, primaryPath)).rows).toEqual([]);
  await asUser(seller, updateImages, [visibilityListing, [photo]]);
  expect((await readObject(null, secondaryPath)).rows).toEqual([]);
  expect((await deleteObject(otherSeller, secondaryPath)).rows).toEqual([]);
  expect((await deleteObject(seller, secondaryPath, "")).rows).toEqual([]);
  expect((await deleteObject(seller, secondaryPath)).rows).toEqual([{ name: secondaryPath }]);

  await asUser(seller, "update public.marketplace_listings set state = 'archived' where id = $1", [visibilityListing]);
  expect((await readObject(null, primaryPath)).rows).toEqual([]);
  await db.query("update public.marketplace_listings set state = 'published', moderation_status = 'blocked' where id = $1", [visibilityListing]);
  expect((await readObject(null, primaryPath)).rows).toEqual([]);
  expect((await asUser(null, "select id from public.marketplace_public_listings where id = $1", [visibilityListing])).rows).toEqual([]);
  await db.query("update public.marketplace_listings set moderation_status = 'allowed' where id = $1", [visibilityListing]);
  await db.query("insert into marketplace_private.suspended_accounts(user_id) values ($1)", [seller]);
  expect((await readObject(null, primaryPath)).rows).toEqual([]);
  expect((await readObject(seller, primaryPath)).rows).toEqual([]);
  await expect(uploadObject(seller, secondaryPath)).rejects.toMatchObject({ code: "42501" });
  await db.query("delete from marketplace_private.suspended_accounts where user_id = $1", [seller]);
});

it("reserves only the selected wear at the existing checkout terms", async () => {
  const reserveFn = "10000000-0000-4000-8000-000000000009";
  const reserveMw = "10000000-0000-4000-8000-000000000010";
  await createRifleGroup(reserveFn, reserveMw, "20000000-0000-4000-8000-000000000004");
  await db.exec("update marketplace_private.direct_order_settings set accepting_orders = true");
  const terms = "select public.marketplace_set_checkout_terms($1, '+998901234567', 0, $2)";
  await asUser(seller, terms, [reserveFn, "10000001"]);
  await asUser(seller, terms, [reserveMw, "10000002"]);
  const { rows } = await asUser<{ quote: string }>(null, "select quote from public.marketplace_checkout_offers where listing_id = $1", [reserveFn]);
  await asUser(buyer, "select public.marketplace_reserve_order($1, $2, $3, 1, null, null, null)",
    ["40000000-0000-4000-8000-000000000001", reserveFn, rows[0].quote]);
  const listingRows = await asUser(null, `select cs2_wear, price_tiyin, available from public.marketplace_public_listings
    where id = any($1::uuid[]) order by id`, [[reserveFn, reserveMw]]);
  expect(listingRows.rows).toEqual([
    { cs2_wear: "FN", price_tiyin: 38000000, available: false },
    { cs2_wear: "MW", price_tiyin: 19000000, available: true },
  ]);
  expect((await asUser(buyer, "select listing_id, total_tiyin from public.marketplace_orders")).rows)
    .toEqual([{ listing_id: reserveFn, total_tiyin: 38000000 }]);
});
