// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const sellerA = "00000000-0000-4000-8000-000000000001";
const sellerB = "00000000-0000-4000-8000-000000000002";
const admin = "00000000-0000-4000-8000-000000000003";
const customer = "00000000-0000-4000-8000-000000000004";
const sellerC = "00000000-0000-4000-8000-000000000005";
const listing = "10000000-0000-4000-8000-000000000001";
const second = "10000000-0000-4000-8000-000000000002";
let challengeA = "";
let challengeB = "";

async function asUser(id: string | null, aal: "aal1" | "aal2", sql: string, params: unknown[] = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${id ? "authenticated" : "anon"}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)", [id ?? "", JSON.stringify({ aal })]);
    return tx.query<Record<string, unknown>>(sql, params);
  });
}

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb, email_confirmed_at timestamptz);
    create table auth.mfa_factors(user_id uuid, status text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid(), auth.jwt() to anon, authenticated;`);
  for (const id of [sellerA, sellerB, admin, customer, sellerC]) await db.query("insert into auth.users values ($1, '{}', now())", [id]);
  for (const migration of ["202611110001_accounts.sql", "202611160001_seller_applications.sql", "202611160002_owner_role.sql", "202611160003_seller_catalog.sql", "202611180004_enforce_mfa.sql"]) {
    await db.exec(await readFile(new URL(`../migrations/${migration}`, import.meta.url), "utf8"));
  }
  await db.query("insert into auth.mfa_factors values ($1, 'verified'), ($2, 'verified'), ($3, 'verified'), ($4, 'verified')", [admin, sellerA, sellerB, sellerC]);
  await db.query("insert into public.marketplace_user_roles (user_id, role) values ($1, 'admin')", [admin]);
  await db.query("insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope) values ($1, 'individual', 'Seller A', 'a', 'Tashkent', 'cs2'), ($2, 'individual', 'Seller B', 'b', 'Tashkent', 'fashion')", [sellerA, sellerB]);
  await db.query("insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope) values ($1, 'individual', 'Seller C', 'c', 'Tashkent', 'cs2')", [sellerC]);
}, 45000);
afterAll(async () => { await db.close(); });

describe("verified seller listing authorization", () => {
  it("requires a current admin with MFA to attest the exact application revision", async () => {
    await db.query("insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope) values ($1, 'individual', 'Customer', 'c', 'Tashkent', 'cs2')", [customer]);
    await expect(asUser(admin, "aal1", "select public.marketplace_review_seller_application($1, 'approved', 1)", [customer])).rejects.toThrow();
    await expect(asUser(admin, "aal2", "select public.marketplace_review_seller_application($1, 'approved', 1)", [customer])).rejects.toThrow();
    expect((await asUser(customer, "aal2", "select status from public.marketplace_seller_applications")).rows).toEqual([{ status: "pending" }]);
    await expect(asUser(customer, "aal2", "insert into public.marketplace_listings (seller_id, ecosystem, title, description, price_tiyin, quantity) values ($1, 'cs2', 'Other', 'Details', 100, 1)", [customer])).rejects.toThrow();
    await expect(asUser(sellerA, "aal1", "select public.marketplace_create_seller_challenge()")).rejects.toThrow();
    challengeA = String((await asUser(sellerA, "aal2", "select public.marketplace_create_seller_challenge() as code")).rows[0].code);
    challengeB = String((await asUser(sellerB, "aal2", "select public.marketplace_create_seller_challenge() as code")).rows[0].code);
    expect(challengeA).toMatch(/^[0-9a-f]{64}$/);
    await expect(asUser(sellerA, "aal2", "select * from public.marketplace_seller_identity_challenges")).rejects.toThrow(/permission denied/);
    await expect(asUser(admin, "aal1", "select public.marketplace_verify_seller($1, 1, $2)", [sellerA, challengeA])).rejects.toThrow();
    await expect(asUser(customer, "aal2", "select public.marketplace_verify_seller($1, 1, $2)", [sellerA, challengeA])).rejects.toThrow();
    await expect(asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 99, $2)", [sellerA, challengeA])).rejects.toThrow();
    await expect(asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 1, $2)", [sellerA, challengeB])).rejects.toThrow();
    await asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 1, $2)", [sellerA, challengeA]);
    await expect(asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 1, $2)", [sellerA, challengeA])).rejects.toThrow();
    await asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 1, $2)", [sellerB, challengeB]);
    expect((await asUser(sellerA, "aal2", "select seller_id, application_revision from public.marketplace_seller_grants")).rows).toEqual([{ seller_id: sellerA, application_revision: 1 }]);
    expect((await asUser(customer, "aal2", "select * from public.marketplace_seller_grants")).rows).toEqual([]);
  });
  it("allows an MFA-verified seller only their own approved categories", async () => {
    const sql = "insert into public.marketplace_listings (id, seller_id, ecosystem, title, description, price_tiyin, quantity) values ($1, $2, $3, 'Real item', 'Seller-provided description', 100000, 1)";
    await expect(asUser(sellerA, "aal1", sql, [listing, sellerA, "cs2"])).rejects.toThrow();
    await expect(asUser(sellerA, "aal2", sql, [listing, sellerA, "fashion"])).rejects.toThrow();
    await expect(asUser(sellerB, "aal2", sql, [listing, sellerA, "cs2"])).rejects.toThrow();
    await asUser(sellerA, "aal2", sql, [listing, sellerA, "cs2"]);
    await asUser(sellerB, "aal2", sql, [second, sellerB, "fashion"]);
    expect((await asUser(sellerB, "aal2", "select id from public.marketplace_listings where id = $1", [listing])).rows).toEqual([]);
    expect((await asUser(sellerB, "aal2", "update public.marketplace_listings set title='Intrusion' where id=$1 returning id", [listing])).rows).toEqual([]);
    await expect(asUser(sellerA, "aal2", "update public.marketplace_listings set seller_id=$1 where id=$2", [sellerB, listing])).rejects.toThrow(/permission denied/);
    await expect(asUser(sellerA, "aal2", "update public.marketplace_listings set quantity=2 where id=$1", [listing])).rejects.toThrow();
  });
  it("rejects expired, rotated and stale-revision identity challenges", async () => {
    let code = String((await asUser(sellerC, "aal2", "select public.marketplace_create_seller_challenge() as code")).rows[0].code);
    await db.query("update public.marketplace_seller_identity_challenges set expires_at = now() - interval '1 second' where seller_id=$1", [sellerC]);
    await expect(asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 1, $2)", [sellerC, code])).rejects.toThrow();
    code = String((await asUser(sellerC, "aal2", "select public.marketplace_create_seller_challenge() as code")).rows[0].code);
    const rotated = String((await asUser(sellerC, "aal2", "select public.marketplace_create_seller_challenge() as code")).rows[0].code);
    await expect(asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 1, $2)", [sellerC, code])).rejects.toThrow();
    await asUser(sellerC, "aal2", "select public.marketplace_resubmit_seller_application('individual', 'Seller C', 'c', 'Tashkent', 'cs2', null)");
    await expect(asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 1, $2)", [sellerC, rotated])).rejects.toThrow();
    const current = String((await asUser(sellerC, "aal2", "select public.marketplace_create_seller_challenge() as code")).rows[0].code);
    await asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 2, $2)", [sellerC, current]);
  });
  it("exposes only published listings from currently verified sellers and removes access on review reopening", async () => {
    await expect(asUser(null, "aal1", "select * from public.marketplace_listings")).rejects.toThrow(/permission denied/);
    expect((await asUser(null, "aal1", "select id from public.marketplace_public_listings")).rows).toEqual([]);
    await asUser(sellerA, "aal2", "update public.marketplace_listings set state='published' where id=$1", [listing]);
    expect((await asUser(null, "aal1", "select id from public.marketplace_public_listings")).rows).toEqual([{ id: listing }]);
    expect((await asUser(sellerB, "aal2", "select quantity, seller_id from public.marketplace_listings where id=$1", [listing])).rows).toEqual([]);
    const visible = (await asUser(null, "aal1", "select * from public.marketplace_public_listings where id=$1", [listing])).rows[0];
    expect(visible).toMatchObject({ id: listing, available: true });
    expect(visible).not.toHaveProperty("quantity");
    expect(visible).not.toHaveProperty("seller_id");
    expect(visible).not.toHaveProperty("seller_revision");
    await expect(asUser(admin, "aal1", "select public.marketplace_review_seller_application($1, 'reopen', 1)", [sellerA])).rejects.toThrow();
    await asUser(admin, "aal2", "select public.marketplace_review_seller_application($1, 'reopen', 1)", [sellerA]);
    expect((await asUser(null, "aal1", "select id from public.marketplace_public_listings")).rows).toEqual([]);
    await expect(asUser(sellerA, "aal2", "insert into public.marketplace_listings (seller_id, ecosystem, title, description, price_tiyin, quantity) values ($1, 'cs2', 'Other', 'Details', 100, 1)", [sellerA])).rejects.toThrow();
    challengeA = String((await asUser(sellerA, "aal2", "select public.marketplace_create_seller_challenge() as code")).rows[0].code);
    await asUser(admin, "aal2", "select public.marketplace_verify_seller($1, 2, $2)", [sellerA, challengeA]);
    expect((await asUser(null, "aal1", "select id from public.marketplace_public_listings")).rows).toEqual([]);
    await asUser(sellerA, "aal2", "update public.marketplace_listings set title='Updated item' where id=$1", [listing]);
    expect((await asUser(null, "aal1", "select id from public.marketplace_public_listings")).rows).toEqual([{ id: listing }]);
  });
  it("does not let a seller republish an administrator-suppressed listing", async () => {
    await expect(asUser(admin, "aal1", "select public.marketplace_admin_archive_listing($1)", [listing])).rejects.toThrow();
    await asUser(admin, "aal2", "select public.marketplace_admin_archive_listing($1)", [listing]);
    expect((await asUser(null, "aal1", "select id from public.marketplace_public_listings")).rows).toEqual([]);
    expect((await asUser(sellerA, "aal2", "update public.marketplace_listings set state='published' where id=$1 returning id", [listing])).rows).toEqual([]);
    expect((await asUser(null, "aal1", "select id from public.marketplace_public_listings")).rows).toEqual([]);
    await expect(asUser(customer, "aal2", "select public.marketplace_admin_restore_listing($1)", [listing])).rejects.toThrow();
    await asUser(admin, "aal2", "select public.marketplace_admin_restore_listing($1)", [listing]);
    await asUser(sellerA, "aal2", "update public.marketplace_listings set state='published' where id=$1", [listing]);
    expect((await asUser(null, "aal1", "select id from public.marketplace_public_listings")).rows).toEqual([{ id: listing }]);
    expect((await asUser(admin, "aal2", "select actor_id, state, moderation_status, operation from public.marketplace_listing_audit where listing_id=$1 order by id desc limit 3", [listing])).rows).toEqual([
      { actor_id: sellerA, state: "published", moderation_status: "allowed", operation: "UPDATE" },
      { actor_id: admin, state: "draft", moderation_status: "allowed", operation: "UPDATE" },
      { actor_id: admin, state: "archived", moderation_status: "blocked", operation: "UPDATE" },
    ]);
  });
});
