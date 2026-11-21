// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
const applicant = "00000000-0000-4000-8000-000000000001";
const pendingSeller = "00000000-0000-4000-8000-000000000002";
const customer = "00000000-0000-4000-8000-000000000003";
const admin = "00000000-0000-4000-8000-000000000004";
const owner = "00000000-0000-4000-8000-000000000005";
const inactiveCustomer = "00000000-0000-4000-8000-000000000006";
const unverifiedAdmin = "00000000-0000-4000-8000-000000000007";

const getIntake = "select * from public.marketplace_seller_intake_status()";
const setIntake = "select public.marketplace_set_seller_intake($1)";
const insertApplication = `insert into public.marketplace_seller_applications
  (applicant_id, applicant_type, name, contact, region, requested_scope)
  values ($1, 'individual', 'Applicant', 'applicant@example.test', 'Tashkent', $2)`;
const resubmit = `select public.marketplace_resubmit_seller_application(
  'individual', 'Applicant revised', 'applicant@example.test', 'Tashkent', 'both', null)`;

function asUser(id: string | null, sql: string, params: unknown[] = [], level = "aal1") {
  return db.transaction(async (tx) => {
    await tx.exec(id ? "set local role authenticated" : "set local role anon");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)",
      [id ?? "", JSON.stringify({ aal: level })]);
    return tx.query(sql, params);
  });
}

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb, email_confirmed_at timestamptz,
      banned_until timestamptz, deleted_at timestamptz);
    create table auth.mfa_factors (user_id uuid, status text);
    create table auth.sessions (id uuid primary key, user_id uuid);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
    grant usage on schema auth to anon, authenticated;`);
  for (const id of [applicant, pendingSeller, customer, admin, owner, inactiveCustomer, unverifiedAdmin]) {
    await db.query("insert into auth.users (id, raw_user_meta_data, email_confirmed_at) values ($1, '{}', now())", [id]);
  }
  for (const name of ["202611110001_accounts.sql", "202611160001_seller_applications.sql", "202611160002_owner_role.sql",
    "202611160003_seller_catalog.sql", "202611180004_enforce_mfa.sql", "202611210005_direct_orders.sql", "202611210006_admin_accounts.sql"]) {
    await db.exec(await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8"));
  }
  await db.query("insert into auth.mfa_factors values ($1, 'verified'), ($2, 'verified'), ($3, 'verified'), ($4, 'unverified')",
    [admin, owner, pendingSeller, unverifiedAdmin]);
  await db.query("insert into public.marketplace_user_roles (user_id, role) values ($1, 'admin'), ($2, 'owner'), ($3, 'admin')",
    [admin, owner, unverifiedAdmin]);
  await db.query("insert into marketplace_private.suspended_accounts (user_id) values ($1)", [inactiveCustomer]);
  await db.query(insertApplication, [applicant, "cs2"]);
  await db.query(insertApplication, [pendingSeller, "fashion"]);
  await asUser(admin, "select public.marketplace_review_seller_application($1, 'rejected', 1)", [applicant], "aal2");

  await db.exec(await readFile(new URL("../migrations/202611220012_seller_application_intake.sql", import.meta.url), "utf8"));
}, 45000);

afterAll(async () => { await db.close(); });

it("starts closed for both ecosystems and returns only the caller's application presence", async () => {
  for (const scope of ["cs2", "fashion"]) {
    await expect(asUser(customer, insertApplication, [customer, scope])).rejects.toMatchObject({ code: "55000" });
  }
  expect((await asUser(customer, getIntake)).rows).toEqual([{ is_open: false, has_application: false }]);
  expect((await asUser(applicant, getIntake)).rows).toEqual([{ is_open: false, has_application: true }]);
  expect((await asUser(admin, getIntake, [], "aal2")).rows).toEqual([{ is_open: false, has_application: false }]);
  expect((await asUser(pendingSeller, getIntake)).rows).toEqual([]);
  expect((await asUser(inactiveCustomer, getIntake)).rows).toEqual([]);
  await expect(asUser(null, getIntake)).rejects.toMatchObject({ code: "42501" });
});

it("requires a verified second factor and an administrative role to toggle intake", async () => {
  await expect(asUser(null, setIntake, [true])).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(pendingSeller, setIntake, [true], "aal2")).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(admin, setIntake, [true])).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(unverifiedAdmin, setIntake, [true], "aal2")).rejects.toMatchObject({ code: "42501" });
  expect((await asUser(customer, getIntake)).rows).toEqual([{ is_open: false, has_application: false }]);
});

it("blocks stale submissions after closing and preserves later resubmission semantics", async () => {
  await asUser(admin, setIntake, [true], "aal2");
  expect((await asUser(customer, getIntake)).rows).toEqual([{ is_open: true, has_application: false }]);
  expect((await asUser(applicant, getIntake)).rows).toEqual([{ is_open: true, has_application: true }]);
  await asUser(owner, setIntake, [false], "aal2");

  await expect(asUser(customer, insertApplication, [customer, "both"])).rejects.toMatchObject({ code: "55000" });
  await expect(asUser(applicant, resubmit)).rejects.toMatchObject({ code: "55000" });
  expect((await asUser(applicant, "select status, revision from public.marketplace_seller_applications")).rows)
    .toEqual([{ status: "rejected", revision: 1 }]);

  await asUser(owner, setIntake, [true], "aal2");
  try {
    await asUser(customer, insertApplication, [customer, "both"]);
    expect((await asUser(customer, getIntake)).rows).toEqual([{ is_open: true, has_application: true }]);
    await asUser(applicant, resubmit);
    expect((await asUser(applicant, "select status, revision from public.marketplace_seller_applications")).rows)
      .toEqual([{ status: "pending", revision: 2 }]);
    expect((await asUser(admin, "select old_scope, new_scope, revision from public.marketplace_seller_revision_audit", [], "aal2")).rows)
      .toEqual([{ old_scope: "cs2", new_scope: "both", revision: 2 }]);
  } finally {
    await asUser(admin, setIntake, [false], "aal2");
  }
});

it("preserves verification and seller grants for pending applications while closed", async () => {
  expect((await asUser(pendingSeller, getIntake, [], "aal2")).rows).toEqual([{ is_open: false, has_application: true }]);
  const challenge = await asUser(pendingSeller, "select public.marketplace_create_seller_challenge() as code", [], "aal2");
  await asUser(admin, "select public.marketplace_verify_seller($1, 1, $2)",
    [pendingSeller, (challenge.rows[0] as { code: string }).code], "aal2");
  expect((await asUser(pendingSeller, "select status from public.marketplace_seller_applications", [], "aal2")).rows)
    .toEqual([{ status: "approved" }]);
  expect((await asUser(pendingSeller, "select application_revision from public.marketplace_seller_grants", [], "aal2")).rows)
    .toEqual([{ application_revision: 1 }]);
  expect((await asUser(pendingSeller, "select marketplace_private.can_manage_listing($1, 'fashion') as allowed", [pendingSeller], "aal2")).rows)
    .toEqual([{ allowed: true }]);
});
