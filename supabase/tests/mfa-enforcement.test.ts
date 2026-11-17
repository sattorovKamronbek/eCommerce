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


async function asUser(id: string | null, aal: "aal1" | "aal2" | null, sql: string, params: unknown[] = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${id ? "authenticated" : "anon"}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)", [id ?? "", JSON.stringify(aal ? { aal } : {})]);
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
  await db.query("insert into auth.mfa_factors values ($1, 'verified'), ($2, 'verified')", [admin, sellerA]);
  await db.query("insert into public.marketplace_user_roles (user_id, role) values ($1, 'admin')", [admin]);
  await db.query("insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope) values ($1, 'individual', 'Seller A', 'a', 'Tashkent', 'cs2'), ($2, 'individual', 'Seller B', 'b', 'Tashkent', 'fashion')", [sellerA, sellerB]);
  await db.query("insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope) values ($1, 'individual', 'Seller C', 'c', 'Tashkent', 'cs2')", [sellerC]);
}, 45000);
afterAll(async () => { await db.close(); });

describe("MFA database enforcement", () => {
  it("protects private records from password-only sessions while preserving users without factors", async () => {
    expect((await asUser(sellerA, "aal1", "select * from public.marketplace_seller_applications")).rows).toEqual([]);
    expect((await asUser(sellerA, "aal2", "select applicant_id from public.marketplace_seller_applications")).rows).toEqual([{ applicant_id: sellerA }]);
    expect((await asUser(sellerB, "aal1", "select applicant_id from public.marketplace_seller_applications")).rows).toEqual([{ applicant_id: sellerB }]);
    await expect(asUser(sellerA, null, "select public.marketplace_resubmit_seller_application('individual', 'Changed', 'a', 'Tashkent', 'cs2', null)")).rejects.toThrow();
    await expect(asUser(sellerA, "aal1", "select public.marketplace_resubmit_seller_application('individual', 'Changed', 'a', 'Tashkent', 'cs2', null)")).rejects.toThrow();
    expect((await asUser(admin, "aal1", "select * from public.marketplace_seller_applications")).rows).toEqual([]);
    expect((await asUser(admin, "aal2", "select * from public.marketplace_seller_applications")).rows).toHaveLength(3);
  });
  it("denies privileged operations after factor removal even with an old AAL2 token", async () => {
    await db.query("delete from auth.mfa_factors where user_id=$1", [admin]);
    await expect(asUser(admin, "aal2", "select public.marketplace_review_seller_application($1, 'rejected', 1)", [sellerA])).rejects.toThrow();
    await db.query("delete from auth.mfa_factors where user_id=$1", [sellerA]);
    await expect(asUser(sellerA, "aal2", "select public.marketplace_create_seller_challenge()")).rejects.toThrow();
  });
});
