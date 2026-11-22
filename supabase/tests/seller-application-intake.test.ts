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
const storeBuyer = "00000000-0000-4000-8000-000000000008";

const getIntake = "select * from public.marketplace_seller_intake_status()";
const setIntake = "select public.marketplace_set_seller_intake($1)";
const insertApplication = `insert into public.marketplace_seller_applications
  (applicant_id, applicant_type, name, contact, region, requested_scope)
  values ($1, 'individual', 'Applicant', 'applicant@example.test', 'Tashkent', $2)`;
const resubmit = `select public.marketplace_resubmit_seller_application(
  'individual', 'Applicant revised', 'applicant@example.test', 'Tashkent', 'both', null)`;

function asUser<T = Record<string, unknown>>(id: string | null, sql: string, params: unknown[] = [], level = "aal1") {
  return db.transaction(async (tx) => {
    await tx.exec(id ? "set local role authenticated" : "set local role anon");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)",
      [id ?? "", JSON.stringify({ aal: level })]);
    return tx.query<T>(sql, params);
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
  for (const id of [applicant, pendingSeller, customer, admin, owner, inactiveCustomer, unverifiedAdmin, storeBuyer]) {
    await db.query("insert into auth.users (id, raw_user_meta_data, email_confirmed_at) values ($1, '{}', now())", [id]);
  }
  for (const name of ["202611110001_accounts.sql", "202611160001_seller_applications.sql", "202611160002_owner_role.sql",
    "202611160003_seller_catalog.sql", "202611180004_enforce_mfa.sql", "202611210005_direct_orders.sql",
    "202611210006_admin_accounts.sql", "202611210011_direct_order_ecosystems.sql"]) {
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

it("locks single-vendor intake and catalog writes while preserving existing orders and history", async () => {
  const listingId = "10000000-0000-4000-8000-000000000001";
  const orderId = "20000000-0000-4000-8000-000000000001";
  const createListing = `insert into public.marketplace_listings
    (id, seller_id, ecosystem, title, description, price_tiyin, quantity, state)
    values ($1, $2, 'fashion', 'Store shirt', 'Details', 100, 2, 'published')`;
  const editListing = "update public.marketplace_listings set price_tiyin = 150 where id = $1 returning id";
  const checkoutTerms = "select public.marketplace_set_checkout_terms($1, '+998901234567', 50, null)";
  const applicantStatus = "select status, revision from public.marketplace_seller_applications where applicant_id = $1";
  const applicationBefore = await asUser(applicant, applicantStatus, [applicant]);

  await asUser(owner, setIntake, [true], "aal2");
  for (const id of [pendingSeller, owner, admin]) {
    await db.query(`${insertApplication} on conflict (applicant_id) do nothing`, [id, "fashion"]);
    await db.query("update public.marketplace_seller_applications set status = 'approved' where applicant_id = $1", [id]);
    await db.query("insert into public.marketplace_seller_grants (seller_id, application_revision) values ($1, 1) on conflict do nothing", [id]);
  }
  await asUser(pendingSeller, createListing, [listingId, pendingSeller], "aal2");
  await asUser(pendingSeller, checkoutTerms, [listingId], "aal2");
  await db.exec("update marketplace_private.direct_order_settings set accepting_orders = true");
  const getOffer = "select quote from public.marketplace_checkout_offers where listing_id = $1";
  const offer = await asUser<{ quote: string }>(null, getOffer, [listingId]);
  const reserve = "select public.marketplace_reserve_order($1, $2, $3, 1, 'Buyer', '+998909876543', 'Test street') as id";
  const reservation = [orderId, listingId, offer.rows[0].quote];
  await asUser(storeBuyer, reserve, reservation);

  await db.exec(await readFile(new URL("../migrations/202611220014_single_vendor_transition.sql", import.meta.url), "utf8"));

  expect((await asUser(storeBuyer, getIntake)).rows).toEqual([{ is_open: false, has_application: false }]);
  await expect(asUser(owner, setIntake, [true], "aal2")).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(storeBuyer, insertApplication, [storeBuyer, "both"])).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(applicant, resubmit)).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(admin, "select public.marketplace_verify_seller($1, 1, $2)", [applicant, "a".repeat(64)], "aal2"))
    .rejects.toMatchObject({ code: "42501" });
  await expect(asUser(admin, "select public.marketplace_review_seller_application($1, 'reopen', 1)", [applicant], "aal2"))
    .rejects.toMatchObject({ code: "42501" });
  await expect(asUser(pendingSeller, "select public.marketplace_create_seller_challenge()", [], "aal2"))
    .rejects.toMatchObject({ code: "42501" });

  expect((await asUser(applicant, applicantStatus, [applicant])).rows).toEqual(applicationBefore.rows);
  await expect(asUser(pendingSeller, createListing, [crypto.randomUUID(), pendingSeller], "aal2")).rejects.toMatchObject({ code: "42501" });
  expect((await asUser(pendingSeller, editListing, [listingId], "aal2")).rows).toEqual([]);
  await expect(asUser(pendingSeller, checkoutTerms, [listingId], "aal2")).rejects.toMatchObject({ code: "42501" });
  for (const id of [owner, admin]) {
    const internalListing = crypto.randomUUID();
    await expect(asUser(id, createListing, [internalListing, id], "aal1")).rejects.toMatchObject({ code: "42501" });
    await asUser(id, createListing, [internalListing, id], "aal2");
    expect((await asUser(id, editListing, [internalListing], "aal2")).rows).toEqual([{ id: internalListing }]);
    await asUser(id, checkoutTerms, [internalListing], "aal2");
    expect((await asUser(id, editListing, [listingId], "aal2")).rows).toEqual([]);
  }
  expect((await asUser(null, "select price_tiyin from public.marketplace_public_listings where id = $1", [listingId])).rows)
    .toEqual([{ price_tiyin: 100 }]);
  expect((await asUser(null, getOffer, [listingId])).rows).toEqual([]);
  await expect(asUser(storeBuyer, reserve, [crypto.randomUUID(), ...reservation.slice(1)])).rejects.toMatchObject({ code: "P0002" });
  expect((await asUser(storeBuyer, reserve, reservation)).rows).toEqual([{ id: orderId }]);
  await asUser(pendingSeller, "select public.marketplace_update_order($1, 'report', 1, null, 'reference', 150, now())", [orderId], "aal2");
  expect((await asUser(storeBuyer, "select status from public.marketplace_orders where id = $1", [orderId])).rows)
    .toEqual([{ status: "reported" }]);
});
