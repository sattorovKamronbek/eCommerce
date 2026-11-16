// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const admin = "00000000-0000-4000-8000-000000000003";

async function asUser(id: string | null, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${id ? "authenticated" : "anon"}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [id ?? ""]);
    return tx.query<Record<string, unknown>>(sql, params);
  });
}

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;`);
  await db.query("insert into auth.users values ($1, '{}', now()), ($2, '{}', now()), ($3, '{}', now())", [alice, bob, admin]);
  await db.exec(await readFile(new URL("../migrations/202611110001_accounts.sql", import.meta.url), "utf8"));
  await db.query("insert into public.marketplace_user_roles (user_id, role) values ($1, 'admin')", [admin]);
  await db.exec(await readFile(new URL("../migrations/202611160001_seller_applications.sql", import.meta.url), "utf8"));
}, 30000);
afterAll(async () => { await db.close(); });

describe("seller application database authorization", () => {
  it("lets a customer submit an application and hides it from other customers", async () => {
    await asUser(alice, "insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope) values ($1, 'individual', 'Alice', 'alice@example.test', 'Tashkent', 'cs2')", [alice]);
    expect((await asUser(alice, "select status, requested_scope from public.marketplace_seller_applications")).rows).toEqual([{ status: "pending", requested_scope: "cs2" }]);
    expect((await asUser(bob, "select * from public.marketplace_seller_applications")).rows).toEqual([]);
    expect((await asUser(admin, "select applicant_id from public.marketplace_seller_applications")).rows).toEqual([{ applicant_id: alice }]);
  });
  it("rejects anonymous applications, impersonation, invalid scopes and self-approval", async () => {
    await expect(asUser(null, "select * from public.marketplace_seller_applications")).rejects.toThrow(/permission denied/);
    await expect(asUser(bob, "insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope) values ($1, 'individual', 'Impostor', 'x', 'x', 'both')", [alice])).rejects.toThrow();
    await expect(asUser(bob, "insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope) values ($1, 'individual', 'Bob', 'x', 'x', 'other')", [bob])).rejects.toThrow();
    await expect(asUser(alice, "update public.marketplace_seller_applications set status = 'approved'")).rejects.toThrow(/permission denied/);
    await expect(asUser(alice, "select public.marketplace_review_seller_application($1, 'approved', 1)", [alice])).rejects.toThrow();
  });
  it("requires company registration details", async () => {
    await expect(asUser(bob, "insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope) values ($1, 'company', 'Company', 'x', 'x', 'fashion')", [bob])).rejects.toThrow();
  });
  it("allows applicants to correct rejected applications without changing the review history", async () => {
    await asUser(admin, "select public.marketplace_review_seller_application($1, 'rejected', 1)", [alice]);
    await asUser(alice, "select public.marketplace_resubmit_seller_application('individual', 'Alice revised', 'alice@example.test', 'Tashkent', 'both', null)");
    expect((await asUser(alice, "select name, status, requested_scope, reviewed_at from public.marketplace_seller_applications")).rows).toEqual([{ name: "Alice revised", status: "pending", requested_scope: "both", reviewed_at: null }]);
    expect((await asUser(admin, "select actor_id, applicant_id, decision from public.marketplace_seller_review_audit")).rows).toEqual([{ actor_id: admin, applicant_id: alice, decision: "rejected" }]);
    expect((await asUser(admin, "select actor_id, applicant_id, old_scope, new_scope, revision from public.marketplace_seller_revision_audit")).rows).toEqual([{ actor_id: alice, applicant_id: alice, old_scope: "cs2", new_scope: "both", revision: 2 }]);
    expect((await asUser(alice, "select * from public.marketplace_seller_revision_audit")).rows).toEqual([]);
    await expect(asUser(bob, "select public.marketplace_resubmit_seller_application('individual', 'Impostor', 'x', 'x', 'both', null)")).rejects.toThrow();
  });
  it("allows an admin to record a review while preserving a private audit trail", async () => {
    await expect(asUser(admin, "select public.marketplace_review_seller_application($1, 'approved', 1)", [alice])).rejects.toThrow();
    await asUser(admin, "select public.marketplace_review_seller_application($1, 'approved', 2)", [alice]);
    expect((await asUser(alice, "select status from public.marketplace_seller_applications")).rows).toEqual([{ status: "approved" }]);
    expect((await asUser(admin, "select decision from public.marketplace_seller_review_audit order by id")).rows).toEqual([{ decision: "rejected" }, { decision: "approved" }]);
    expect((await asUser(alice, "select * from public.marketplace_seller_review_audit")).rows).toEqual([]);
    await expect(asUser(alice, "select public.marketplace_resubmit_seller_application('individual', 'Changed', 'x', 'x', 'cs2', null)")).rejects.toThrow();
  });
  it("lets an administrator reopen an accidental approval without accepting stale decisions", async () => {
    await expect(asUser(alice, "select public.marketplace_review_seller_application($1, 'reopen', 2)", [alice])).rejects.toThrow();
    await expect(asUser(admin, "select public.marketplace_review_seller_application($1, 'reopen', 1)", [alice])).rejects.toThrow();
    await asUser(admin, "select public.marketplace_review_seller_application($1, 'reopen', 2)", [alice]);
    expect((await asUser(alice, "select status, revision from public.marketplace_seller_applications")).rows).toEqual([{ status: "pending", revision: 3 }]);
    expect((await asUser(admin, "select decision, revision, requested_scope from public.marketplace_seller_review_audit order by id")).rows).toEqual([
      { decision: "rejected", revision: 1, requested_scope: "cs2" },
      { decision: "approved", revision: 2, requested_scope: "both" },
      { decision: "reopen", revision: 2, requested_scope: "both" },
    ]);
  });
  it("does not prevent an auth account deletion while retaining anonymized audit events", async () => {
    await db.query("delete from auth.users where id = $1", [alice]);
    expect((await asUser(admin, "select applicant_id from public.marketplace_seller_review_audit order by id")).rows).toEqual([{ applicant_id: null }, { applicant_id: null }, { applicant_id: null }]);
    expect((await asUser(admin, "select actor_id, applicant_id from public.marketplace_seller_revision_audit")).rows).toEqual([{ actor_id: null, applicant_id: null }]);
    await db.query("delete from auth.users where id = $1", [admin]);
    expect((await db.query("select actor_id from public.marketplace_seller_review_audit order by id")).rows).toEqual([{ actor_id: null }, { actor_id: null }, { actor_id: null }]);
  });
});
