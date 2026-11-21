// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
const seller = "00000000-0000-4000-8000-000000000001";
const buyer = "00000000-0000-4000-8000-000000000002";
const outsider = "00000000-0000-4000-8000-000000000003";
const owner = "00000000-0000-4000-8000-000000000005";
const ownerSession = "00000000-0000-4000-8000-000000000006";
const admin = "00000000-0000-4000-8000-000000000004";
const fashion = "10000000-0000-4000-8000-000000000001";
const skin = "10000000-0000-4000-8000-000000000002";
const reservation = "20000000-0000-4000-8000-000000000001";
const second = "20000000-0000-4000-8000-000000000002";
const csOrder = "20000000-0000-4000-8000-000000000003";
const expiring = "20000000-0000-4000-8000-000000000004";

function asUser(id: string | null, sql: string, params: unknown[] = [], level = "aal2", claims: Record<string, unknown> = {}) {
  return db.transaction(async tx => {
    await tx.exec(id ? "set local role authenticated" : "set local role anon");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)", [id ?? "", JSON.stringify({ aal: level, ...claims })]);
    return tx.query(sql, params);
  });
}

const migration = "202611210005_direct_orders.sql";
const terms = "select public.marketplace_set_checkout_terms($1, $2, $3, $4)";
const offer = "select quote, shipping_tiyin from public.marketplace_checkout_offers where listing_id = $1";
const reserve = "select public.marketplace_reserve_order($1,$2,$3,$4,$5,$6,$7)";
const change = "select public.marketplace_update_order($1,$2,$3,$4,$5,$6,$7)";
const report = (actor: string, id: string, reference: string, amount = 550) => asUser(actor, change, [id, "report", 1, null, reference, amount, new Date().toISOString()]);
const action = (actor: string, id: string, event: string, version: number, note: string | null = null, level = "aal2") =>
  asUser(actor, change, [id, event, version, note, null, null, null], level);

async function quote(listing: string) {
  const data = await asUser(null, offer, [listing]);
  return (data.rows[0] as { quote: string }).quote;
}
async function stock(listing: string) {
  return (await db.query("select quantity from public.marketplace_listings where id = $1", [listing])).rows;
}

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb, email_confirmed_at timestamptz, banned_until timestamptz, deleted_at timestamptz);
    create table auth.mfa_factors(user_id uuid, status text);
    create table auth.sessions(id uuid primary key, user_id uuid);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
    grant usage on schema auth to anon, authenticated;`);
  for (const id of [seller, buyer, outsider, admin, owner]) await db.query("insert into auth.users(id, raw_user_meta_data, email_confirmed_at) values ($1, '{}', now())", [id]);
  for (const name of ["202611110001_accounts.sql", "202611160001_seller_applications.sql", "202611160002_owner_role.sql", "202611160003_seller_catalog.sql", "202611180004_enforce_mfa.sql", migration, "202611210006_admin_accounts.sql"]) {
    await db.exec(await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8"));
  }
  await db.query("insert into auth.mfa_factors values ($1, 'verified'), ($2, 'verified'), ($3, 'verified')", [seller, admin, owner]);
  await db.query("insert into auth.sessions values ($1,$2)", [ownerSession, owner]);
  await db.query("insert into public.marketplace_user_roles(user_id, role) values ($1,'admin'), ($2,'owner')", [admin, owner]);
  await db.query("insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope, status) values ($1, 'individual', 'Seller', 'a', 'Tashkent', 'both', 'approved')", [seller]);
  await db.query("insert into public.marketplace_seller_grants (seller_id, application_revision) values ($1, 1)", [seller]);
  await asUser(seller, "insert into public.marketplace_listings (id, seller_id, ecosystem, title, description, price_tiyin, quantity, state) values ($1, $2, 'fashion', 'Shirt', 'Details', 250, 2, 'published'), ($3, $2, 'cs2', 'Skin', 'Details', 100, 1, 'published')", [fashion, seller, skin]);
}, 45000);
afterAll(async () => { await db.close(); });

it("reserves stock once against a current quote and keeps order data private", async () => {
  await expect(asUser(outsider, terms, [fashion, "+998901234567", 50, null])).rejects.toThrow();
  await asUser(seller, terms, [fashion, "+998901234567", 50, null]);
  expect((await asUser(null, offer, [fashion])).rows).toEqual([]);
  await db.exec("update marketplace_private.direct_order_settings set accepting_orders = true");
  const firstQuote = await quote(fashion);
  await asUser(seller, terms, [fashion, "+998901234567", 100, null]);
  const input = [reservation, fashion, await quote(fashion), 2, "Buyer", "+998909876543", "Test street 1"];
  await expect(asUser(buyer, reserve, [reservation, fashion, firstQuote, 2, ...input.slice(4)])).rejects.toThrow(/quote changed/);
  await asUser(seller, terms, [fashion, "+998901234567", 50, null]);
  input[2] = await quote(fashion);
  await expect(asUser(seller, reserve, input)).rejects.toThrow();
  const previous = await db.query<{ snapshot: string }>("select updated_at::text as snapshot from public.marketplace_listings where id=$1", [fashion]);
  await asUser(buyer, reserve, input);
  await asUser(buyer, reserve, input);
  expect((await asUser(seller, "update public.marketplace_listings set quantity=2 where id=$1 and updated_at=$2 returning id",
    [fashion, previous.rows[0].snapshot])).rows).toEqual([]);
  await expect(asUser(buyer, reserve, [reservation, fashion, input[2], 1, ...input.slice(4)])).rejects.toThrow();
  await expect(asUser(outsider, reserve, [second, ...input.slice(1)])).rejects.toThrow();
  await expect(asUser(null, "select * from public.marketplace_orders")).rejects.toThrow(/permission denied/);
  await expect(asUser(buyer, "update public.marketplace_orders set status='completed'")).rejects.toThrow(/permission denied/);
  for (const id of [buyer, seller, admin]) {
    expect((await asUser(id, "select total_tiyin, delivery_address from public.marketplace_orders")).rows).toEqual([{ total_tiyin: 550, delivery_address: "Test street 1" }]);
  }
  for (const [id, level] of [[outsider, "aal2"], [admin, "aal1"], [seller, "aal1"]]) {
    expect((await asUser(id, "select id from public.marketplace_orders", [], level)).rows).toEqual([]);
  }
  expect(await stock(fashion)).toEqual([{ quantity: 0 }]);
});

it("records reports, admin decisions and separate confirmations without assuming settlement", async () => {
  await expect(report(outsider, reservation, "fixture")).rejects.toThrow();
  await expect(report(buyer, reservation, "fixture", 0)).rejects.toThrow();
  await report(seller, reservation, "fixture", 500);
  expect((await asUser(admin, "select total_tiyin, reported_amount_tiyin from public.marketplace_orders")).rows).toEqual([{ total_tiyin: 550, reported_amount_tiyin: 500 }]);
  await expect(action(buyer, reservation, "approve", 2, "Checked")).rejects.toThrow();
  await expect(action(admin, reservation, "approve", 2, "Checked", "aal1")).rejects.toThrow();
  await action(admin, reservation, "approve", 2, "Matched the transaction");
  await action(seller, reservation, "confirm", 3);
  await expect(action(buyer, reservation, "confirm", 3)).rejects.toThrow(/order changed/);
  expect((await asUser(buyer, "select status, buyer_confirmed_at is null as buyer_pending, seller_confirmed_at is not null as seller_done from public.marketplace_orders")).rows).toEqual([{ status: "approved", buyer_pending: true, seller_done: true }]);
  await action(buyer, reservation, "dispute", 4, "Delivery contested");
  await action(admin, reservation, "resume", 5, "Continue delivery");
  await action(seller, reservation, "confirm", 6);
  await action(buyer, reservation, "confirm", 7);
  expect((await asUser(buyer, "select status from public.marketplace_orders")).rows).toEqual([{ status: "completed" }]);
  expect((await asUser(admin, "select action from public.marketplace_order_events order by id")).rows.map(row => (row as { action: string }).action)).toEqual(["reserved", "report", "approve", "confirm", "dispute", "resume", "confirm", "confirm"]);
});

it("expires unreported reservations but leaves reported orders for administrator review", async () => {
  await asUser(seller, terms, [skin, "+998901234567", 0, "123456789"]);
  const anotherSkin = "10000000-0000-4000-8000-000000000003";
  await asUser(seller, "insert into public.marketplace_listings (id, seller_id, ecosystem, title, description, price_tiyin, quantity, state) values ($1, $2, 'cs2', 'Skin 2', 'Details', 100, 1, 'published')", [anotherSkin, seller]);
  await expect(asUser(seller, terms, [anotherSkin, "+998901234567", 0, "123456789"])).rejects.toThrow();
  const input = [skin, await quote(skin), 1, null, null, null];
  await asUser(buyer, reserve, [expiring, ...input]);
  await db.query("update public.marketplace_orders set expires_at = now() - interval '1 minute' where id = $1", [expiring]);
  await expect(report(buyer, expiring, "late", 100)).rejects.toThrow();
  await db.exec("select marketplace_private.expire_direct_orders()");
  await db.exec("select marketplace_private.expire_direct_orders()");
  expect(await stock(skin)).toEqual([{ quantity: 1 }]);
  await asUser(buyer, change, [expiring, "report_late", 2, null, "late-transfer", 100, new Date().toISOString()]);
  await expect(action(admin, expiring, "resume", 3, "Cannot reserve released stock")).rejects.toThrow();
  await action(admin, expiring, "cancel_keep", 3, "Resolved outside the marketplace");
  expect(await stock(skin)).toEqual([{ quantity: 1 }]);
  expect((await asUser(seller, "select status, stock_state from public.marketplace_orders where id=$1", [expiring])).rows).toEqual([{ status: "cancelled", stock_state: "released" }]);
  await asUser(buyer, reserve, [csOrder, ...input]);
  await report(buyer, csOrder, "review-me", 100);
  await db.query("update public.marketplace_orders set expires_at = now() - interval '1 minute' where id = $1", [csOrder]);
  await db.exec("select marketplace_private.expire_direct_orders()");
  expect(await stock(skin)).toEqual([{ quantity: 0 }]);
  await action(admin, csOrder, "reject", 2, "Evidence is inconclusive");
  await action(admin, csOrder, "cancel_release", 3, "Intact skin remains with the seller");
  expect(await stock(skin)).toEqual([{ quantity: 1 }]);
  expect((await asUser(seller, "select status from public.marketplace_orders where id = $1", [csOrder])).rows).toEqual([{ status: "cancelled" }]);
});

it("restricts suspensions and administrator assignment to the correct roles", async () => {
  const manage = "select public.marketplace_manage_user_access($1,$2,$3,$4,$5)";
  const query = (actor: string, target: string, event: string, role: string, suspended = false, claims: Record<string, unknown> = {}) =>
    asUser(actor, manage, [target, event, "Local review fixture", role, suspended], "aal2", claims);
  const verifyRecently = (age: number, sessionId = ownerSession, method = "totp") => ({
    session_id: sessionId, amr: [{ method, timestamp: Math.floor(Date.now() / 1000) - age }],
  });

  await expect(query(buyer, seller, "suspend", "customer")).rejects.toThrow();
  await expect(query(admin, owner, "suspend", "owner")).rejects.toThrow();
  await expect(query(admin, outsider, "grant_admin", "customer")).rejects.toThrow();
  await query(admin, seller, "suspend", "customer");
  expect((await asUser(null, "select id from public.marketplace_public_listings")).rows).toEqual([]);
  expect((await asUser(seller, "select id from public.marketplace_profiles")).rows).toEqual([]);
  expect((await asUser(seller, "select id from public.marketplace_orders")).rows).toEqual([]);
  expect((await asUser(seller, "select public.marketplace_account_is_active() as active")).rows).toEqual([{ active: false }]);
  await expect(query(admin, seller, "suspend", "customer")).rejects.toThrow(/account changed/);
  await query(admin, seller, "unsuspend", "customer", true);
  expect((await asUser(null, "select id from public.marketplace_public_listings")).rows).toHaveLength(3);

  await expect(query(owner, outsider, "grant_admin", "customer", false, verifyRecently(601))).rejects.toThrow(/fresh authenticator/);
  await expect(query(owner, outsider, "grant_admin", "customer", false, verifyRecently(1, "00000000-0000-4000-8000-000000000000"))).rejects.toThrow(/fresh authenticator/);
  await expect(query(owner, outsider, "grant_admin", "customer", false, verifyRecently(1))).rejects.toThrow(/role change is unavailable/);
  await db.query("insert into auth.mfa_factors values ($1, 'verified')", [outsider]);
  await query(owner, outsider, "grant_admin", "customer", false, verifyRecently(1));
  await expect(query(owner, owner, "revoke_admin", "owner", false, verifyRecently(1))).rejects.toThrow();
  await query(owner, outsider, "revoke_admin", "admin", false, verifyRecently(1, ownerSession, "mfa/totp"));
  expect((await asUser(outsider, "select role from public.marketplace_user_roles")).rows).toEqual([]);
  expect((await asUser(owner, "select action from public.marketplace_user_access_events order by id")).rows).toEqual([
    { action: "suspend" }, { action: "unsuspend" }, { action: "grant_admin" }, { action: "revoke_admin" },
  ]);
});

it("binds manual identity decisions to the selected profile and consumes the owner's proof once", async () => {
  await db.exec(await readFile(new URL("../migrations/202611210007_profile_identity.sql", import.meta.url), "utf8"));
  const request = "select public.marketplace_request_profile_identity($1) as id";
  const proof = "select public.marketplace_own_profile_identity_code($1) as code";
  const review = "select public.marketplace_review_profile_identity($1,$2,$3,$4)";
  const visible = "select id, status from public.marketplace_profile_identity_requests";

  await expect(asUser(admin, request, [buyer])).rejects.toThrow(/owner access required/);
  await expect(asUser(owner, request, [buyer], "aal1")).rejects.toThrow(/owner access required/);
  await expect(asUser(owner, request, [owner])).rejects.toThrow();
  const { rows } = await asUser(owner, request, [buyer]);
  const { id } = rows[0] as { id: string };
  await expect(asUser(owner, request, [buyer])).rejects.toThrow(/duplicate key/);
  await expect(asUser(null, visible)).rejects.toThrow(/permission denied/);
  expect((await asUser(outsider, visible)).rows).toEqual([]);
  expect((await asUser(admin, visible)).rows).toEqual([]);
  expect((await asUser(buyer, visible)).rows).toEqual([{ id, status: "pending" }]);
  expect((await asUser(owner, visible)).rows).toEqual([{ id, status: "pending" }]);
  expect((await asUser(buyer, "select public.marketplace_account_is_active() as active")).rows).toEqual([{ active: true }]);
  await expect(asUser(owner, "select code from public.marketplace_profile_identity_requests")).rejects.toThrow(/permission denied/);
  expect((await asUser(owner, proof, [id])).rows).toEqual([{ code: null }]);
  expect((await asUser(outsider, proof, [id])).rows).toEqual([{ code: null }]);
  const { code } = (await asUser(buyer, proof, [id])).rows[0] as { code: string };
  expect(code).toMatch(/^[a-f\d-]{36}$/);
  await expect(asUser(buyer, review, [id, buyer, "verified", code])).rejects.toThrow(/owner access required/);
  await expect(asUser(owner, review, [id, outsider, "verified", code])).rejects.toThrow();
  await expect(asUser(owner, review, [id, buyer, "verified", null])).rejects.toThrow();
  await asUser(owner, review, [id, buyer, "verified", code]);
  expect((await asUser(buyer, proof, [id])).rows).toEqual([{ code: null }]);
  await expect(asUser(owner, review, [id, buyer, "verified", code])).rejects.toThrow();
  expect((await db.query("select created_by, reviewed_by, status, code from public.marketplace_profile_identity_requests where id = $1", [id])).rows)
    .toEqual([{ created_by: owner, reviewed_by: owner, status: "verified", code: null }]);
  const secondRequest = await asUser(owner, request, [buyer]);
  const secondId = (secondRequest.rows[0] as { id: string }).id;
  await asUser(owner, review, [secondId, buyer, "cancelled", null]);
  expect((await asUser(buyer, proof, [secondId])).rows).toEqual([{ code: null }]);
});
