// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const seller = "00000000-0000-4000-8000-000000000001";
const buyer = "00000000-0000-4000-8000-000000000002";
const other = "00000000-0000-4000-8000-000000000003";
const banned = "00000000-0000-4000-8000-000000000004";
const listing = "10000000-0000-4000-8000-000000000001";
const fashion = "10000000-0000-4000-8000-000000000002";
const hold = "20000000-0000-4000-8000-000000000001";
const second = "20000000-0000-4000-8000-000000000002";
const fashionHold = "20000000-0000-4000-8000-000000000003";
const soldHold = "20000000-0000-4000-8000-000000000004";

async function run(id: string | null, sql: string, params: unknown[] = [], role?: "authenticated" | "anon") {
  return db.transaction(async tx => {
    if (role) await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)", [id ?? "", JSON.stringify({ aal: "aal2" })]);
    return tx.query<Record<string, unknown>>(sql, params);
  });
}
const reserve = "select marketplace_private.reserve_inventory($1, $2, $3, $4)";
const release = "select marketplace_private.release_inventory($1)";

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb, email_confirmed_at timestamptz, banned_until timestamptz, deleted_at timestamptz);
    create table auth.mfa_factors(user_id uuid, status text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid(), auth.jwt() to anon, authenticated;`);
  for (const id of [seller, buyer, other, banned]) await db.query("insert into auth.users(id, raw_user_meta_data, email_confirmed_at) values ($1, '{}', now())", [id]);
  for (const migration of ["202611110001_accounts.sql", "202611160001_seller_applications.sql", "202611160002_owner_role.sql", "202611160003_seller_catalog.sql", "202611180004_enforce_mfa.sql"]) {
    await db.exec(await readFile(new URL(`../migrations/${migration}`, import.meta.url), "utf8"));
  }
  await db.exec(await readFile(new URL("../drafts/202611180005_inventory_research.sql", import.meta.url), "utf8"));
  await db.query("insert into auth.mfa_factors values ($1, 'verified')", [seller]);
  await db.query("update auth.users set banned_until=now()+interval '1 day' where id=$1", [banned]);
  await db.query("insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope, status) values ($1, 'individual', 'Seller', 'a', 'Tashkent', 'both', 'approved')", [seller]);
  await db.query("insert into public.marketplace_seller_grants (seller_id, application_revision) values ($1, 1)", [seller]);
  await run(seller, "insert into public.marketplace_listings (id, seller_id, ecosystem, title, description, price_tiyin, quantity, state) values ($1, $2, 'cs2', 'Skin', 'Details', 100, 1, 'published'), ($3, $2, 'fashion', 'Shirt', 'Details', 250, 3, 'published')", [listing, seller, fashion], "authenticated");
}, 45000);
afterAll(async () => { await db.close(); });

describe("private inventory reservations", () => {
  it("does not expose holds or reservation functions to public clients", async () => {
    await expect(run(buyer, "select * from public.marketplace_inventory_holds", [], "authenticated")).rejects.toThrow(/permission denied/);
    await expect(run(buyer, reserve, [hold, listing, buyer, 1], "authenticated")).rejects.toThrow(/permission denied/);
    await expect(run(null, reserve, [hold, listing, buyer, 1], "anon")).rejects.toThrow(/permission denied/);
  });
  it("reserves only once for an eligible buyer and snapshots item data", async () => {
    await expect(run(seller, reserve, [hold, listing, seller, 1])).rejects.toThrow();
    await expect(run(banned, reserve, [hold, listing, banned, 1])).rejects.toThrow();
    await expect(run(other, reserve, [hold, listing, buyer, 1])).rejects.toThrow();
    await run(buyer, reserve, [hold, listing, buyer, 1]);
    await run(buyer, reserve, [hold, listing, buyer, 1]);
    await expect(run(buyer, reserve, [hold, listing, buyer, 2])).rejects.toThrow();
    expect((await db.query("select quantity from public.marketplace_listings where id=$1", [listing])).rows).toEqual([{ quantity: 0 }]);
    expect((await db.query("select title, unit_price_tiyin, quantity, status from public.marketplace_inventory_holds where id=$1", [hold])).rows).toEqual([{ title: "Skin", unit_price_tiyin: 100, quantity: 1, status: "held" }]);
    await expect(run(other, reserve, [second, listing, other, 1])).rejects.toThrow();
    await expect(run(seller, "update public.marketplace_listings set quantity=1 where id=$1", [listing], "authenticated")).rejects.toThrow();
    await expect(run(seller, "update public.marketplace_listings set ecosystem='fashion' where id=$1", [listing], "authenticated")).rejects.toThrow();
    await run(seller, "update public.marketplace_listings set title='Changed', price_tiyin=300 where id=$1", [listing], "authenticated");
    expect((await db.query("select title, unit_price_tiyin from public.marketplace_inventory_holds where id=$1", [hold])).rows).toEqual([{ title: "Skin", unit_price_tiyin: 100 }]);
  });
  it("releases stock once, and never releases a consumed hold", async () => {
    await run(buyer, release, [hold]);
    await run(buyer, release, [hold]);
    expect((await db.query("select quantity from public.marketplace_listings where id=$1", [listing])).rows).toEqual([{ quantity: 1 }]);
    await run(buyer, reserve, [soldHold, listing, buyer, 1]);
    await run(buyer, "select marketplace_private.consume_inventory($1)", [soldHold]);
    await run(buyer, "select marketplace_private.consume_inventory($1)", [soldHold]);
    await expect(run(buyer, release, [soldHold])).rejects.toThrow();
    await expect(run(seller, "update public.marketplace_listings set quantity=1 where id=$1", [listing], "authenticated")).rejects.toThrow();
    await expect(run(seller, "update public.marketplace_listings set ecosystem='fashion' where id=$1", [listing], "authenticated")).rejects.toThrow();
    expect((await db.query("select quantity from public.marketplace_listings where id=$1", [listing])).rows).toEqual([{ quantity: 0 }]);
  });
  it("allows bounded fashion restocking without losing held units", async () => {
    await run(buyer, reserve, [fashionHold, fashion, buyer, 2]);
    await expect(run(seller, "update public.marketplace_listings set quantity=999999 where id=$1", [fashion], "authenticated")).rejects.toThrow();
    await run(seller, "update public.marketplace_listings set quantity=4 where id=$1", [fashion], "authenticated");
    await run(buyer, release, [fashionHold]);
    expect((await db.query("select quantity from public.marketplace_listings where id=$1", [fashion])).rows).toEqual([{ quantity: 6 }]);
  });
  it("does not republish an old revision when an inventory hold is released", async () => {
    const newHold = "20000000-0000-4000-8000-000000000005";
    await run(buyer, reserve, [newHold, fashion, buyer, 1]);
    await db.query("update public.marketplace_seller_applications set revision=2 where applicant_id=$1", [seller]);
    await db.query("update public.marketplace_seller_grants set application_revision=2 where seller_id=$1", [seller]);
    await run(seller, release, [newHold]);
    const row = await db.query("select seller_revision from public.marketplace_listings where id=$1", [fashion]);
    expect(row.rows).toEqual([{ seller_revision: 1 }]);
    expect((await run(null, "select id from public.marketplace_public_listings where id=$1", [fashion], "anon")).rows).toEqual([]);
    await run(seller, "update public.marketplace_listings set quantity=quantity where id=$1", [fashion], "authenticated");
    expect((await run(null, "select id from public.marketplace_public_listings where id=$1", [fashion], "anon")).rows).toEqual([{ id: fashion }]);
  });
});
