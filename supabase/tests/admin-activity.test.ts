// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
const buyer = "00000000-0000-4000-8000-000000000001";
const seller = "00000000-0000-4000-8000-000000000002";
const admin = "00000000-0000-4000-8000-000000000003";
const owner = "00000000-0000-4000-8000-000000000004";
const unverifiedAdmin = "00000000-0000-4000-8000-000000000005";
const suspendedAdmin = "00000000-0000-4000-8000-000000000006";
const listing = "10000000-0000-4000-8000-000000000001";
const previousSignIn = "2026-11-21T09:00:00Z";
const nextSignIn = "2026-11-22T10:00:00Z";
const laterSignIn = "2026-11-22T11:00:00Z";
const buyerSession = "30000000-0000-4000-8000-000000000001";
const laterSession = "30000000-0000-4000-8000-000000000002";
const adminSession = "30000000-0000-4000-8000-000000000003";
const recoverySession = "30000000-0000-4000-8000-000000000004";
const profile = "select * from public.marketplace_admin_user_overview($1)";
const dashboard = "select * from public.marketplace_admin_dashboard()";
const history = "select signed_in_at from public.marketplace_sign_in_events where user_id = $1 order by signed_in_at desc, id desc";

function asUser(id: string | null, sql: string, params: unknown[] = [], level = "aal2") {
  return db.transaction(async tx => {
    await tx.exec(id ? "set local role authenticated" : "set local role anon");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)",
      [id ?? "", JSON.stringify({ aal: level })]);
    return tx.query(sql, params);
  });
}

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (
      id uuid primary key, raw_user_meta_data jsonb default '{}', email text, created_at timestamptz default now(),
      email_confirmed_at timestamptz default now(), last_sign_in_at timestamptz,
      banned_until timestamptz, deleted_at timestamptz);
    create table auth.mfa_factors (user_id uuid, status text);
    create table auth.sessions (id uuid primary key, user_id uuid, aal text, created_at timestamptz default now());
    create table auth.mfa_amr_claims (
      session_id uuid references auth.sessions(id) on delete cascade, authentication_method text,
      primary key (session_id, authentication_method));
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
    grant usage on schema auth to anon, authenticated;`);
  for (const user of [buyer, seller, admin, owner, unverifiedAdmin, suspendedAdmin]) {
    await db.query("insert into auth.users(id) values ($1)", [user]);
  }
  await db.query("update auth.users set email = 'buyer@example.test', last_sign_in_at = $2 where id = $1", [buyer, previousSignIn]);
  for (const file of ["202611110001_accounts.sql", "202611160001_seller_applications.sql", "202611160002_owner_role.sql",
    "202611160003_seller_catalog.sql", "202611180004_enforce_mfa.sql", "202611210005_direct_orders.sql",
    "202611210006_admin_accounts.sql", "202611210011_direct_order_ecosystems.sql"]) {
    await db.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
  }
  await db.query("insert into auth.mfa_factors values ($1, 'verified'), ($2, 'verified'), ($3, 'verified')", [admin, owner, suspendedAdmin]);
  await db.query("insert into public.marketplace_user_roles(user_id, role) values ($1, 'admin'), ($2, 'owner'), ($3, 'admin'), ($4, 'admin')",
    [admin, owner, unverifiedAdmin, suspendedAdmin]);
  await db.query("insert into marketplace_private.suspended_accounts (user_id) values ($1)", [suspendedAdmin]);
  await db.query(`insert into public.marketplace_seller_applications (applicant_id, applicant_type, name, contact, region, requested_scope, status)
    values ($1, 'individual', 'Shop', 'test', 'Tashkent', 'both', 'approved'),
           ($2, 'individual', 'Buyer', 'test', 'Tashkent', 'both', 'pending')`, [seller, buyer]);
  await db.query("insert into public.marketplace_seller_grants (seller_id, application_revision) values ($1, 1)", [seller]);
  await db.query(`insert into public.marketplace_listings (id, seller_id, seller_revision, ecosystem, title, description, price_tiyin, quantity)
    values ($1, $2, 1, 'fashion', 'Shirt', 'Details', 350, 5)`, [listing, seller]);
  for (const [index, status, quantity, customer] of [
    [1, "completed", 3, buyer], [2, "completed", 2, buyer], [3, "reserved", 4, buyer],
    [4, "cancelled", 4, buyer], [5, "reported", 1, buyer], [6, "disputed", 1, buyer], [7, "completed", 1, owner],
  ] as const) {
    await db.query(`insert into public.marketplace_orders
      (id, listing_id, buyer_id, seller_id, ecosystem, title, category, variant, description, quote,
       quantity, unit_price_tiyin, shipping_tiyin, total_tiyin, seller_phone, status)
      values ($1, $2, $3, $4, 'fashion', 'Shirt', '', '', 'Details', 'q', $5, 350, 20, 350 * $5::integer + 20, '+998901234567', $6)`,
    [`20000000-0000-4000-8000-00000000000${index}`, listing, customer, seller, quantity, status]);
  }
  await db.exec("update marketplace_private.direct_order_settings set accepting_orders = true, accepting_ecosystems = array['cs2']");
  await db.exec(await readFile(new URL("../migrations/202611220013_admin_activity.sql", import.meta.url), "utf8"));
}, 45000);

afterAll(async () => { await db.close(); });

it("requires an active verified administrator or owner for privileged account, history, and queue reads", async () => {
  for (const [id, level] of [[buyer, "aal2"], [seller, "aal2"], [admin, "aal1"], [unverifiedAdmin, "aal2"], [suspendedAdmin, "aal2"]]) {
    await expect(asUser(id, profile, [buyer], level)).rejects.toMatchObject({ code: "42501" });
    await expect(asUser(id, dashboard, [], level)).rejects.toMatchObject({ code: "42501" });
    expect((await asUser(id, history, [buyer], level)).rows).toEqual([]);
  }
  await expect(asUser(null, profile, [buyer])).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(null, dashboard)).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(null, history, [buyer])).rejects.toMatchObject({ code: "42501" });
  await expect(asUser(admin, "insert into public.marketplace_sign_in_events (user_id, signed_in_at) values ($1, now())", [buyer]))
    .rejects.toMatchObject({ code: "42501" });
  await expect(asUser(admin, "select session_id from public.marketplace_sign_in_events"))
    .rejects.toMatchObject({ code: "42501" });
  expect((await asUser(owner, profile, [buyer])).rows).toHaveLength(1);
});

it("keeps the provider's previous sign-in and counts only this buyer's completed units", async () => {
  expect((await asUser(admin, profile, [buyer])).rows).toEqual([{
    email: "buyer@example.test", registered_at: expect.any(Date), confirmed_at: expect.any(Date),
    last_sign_in_at: new Date(previousSignIn), mfa_enabled: false,
    completed_orders: 2, purchased_units: 5, completed_total_uzs: "17.90",
  }]);
  expect((await asUser(admin, history, [buyer])).rows).toEqual([]);
  expect((await asUser(admin, profile, [seller])).rows[0]).toMatchObject({
    last_sign_in_at: null, completed_orders: 0, purchased_units: 0, completed_total_uzs: "0.00",
  });
  expect((await asUser(admin, profile, [listing])).rows).toEqual([]);
});

it("records each new session once and waits for required MFA before recording success", async () => {
  await db.query(`insert into auth.sessions (id, user_id, aal, created_at)
    values ($1, $2, 'aal1', $3), ($4, $2, 'aal1', $5), ($6, $7, 'aal1', $3)`,
  [buyerSession, buyer, nextSignIn, laterSession, laterSignIn, adminSession, admin]);
  await db.query("insert into auth.mfa_amr_claims values ($1, 'password'), ($2, 'password'), ($3, 'password')",
    [buyerSession, laterSession, adminSession]);
  expect((await asUser(owner, history, [admin])).rows).toEqual([]);
  await db.query("update auth.sessions set aal = 'aal2' where id in ($1, $2)", [buyerSession, adminSession]);
  await db.query("update auth.sessions set aal = 'aal2' where id = $1", [adminSession]);
  await db.query("delete from auth.sessions where id = $1", [buyerSession]);
  expect((await asUser(admin, history, [buyer])).rows).toEqual([
    { signed_in_at: new Date(laterSignIn) }, { signed_in_at: new Date(nextSignIn) },
  ]);
  expect((await asUser(owner, history, [admin])).rows).toEqual([{ signed_in_at: expect.any(Date) }]);
  expect((await asUser(buyer, history, [buyer])).rows).toEqual([]);
});

it("excludes temporary OTP sessions used for password recovery", async () => {
  await db.query("insert into auth.sessions (id, user_id, aal) values ($1, $2, 'aal1')", [recoverySession, seller]);
  await db.query("insert into auth.mfa_amr_claims values ($1, 'otp')", [recoverySession]);
  await db.query("update auth.sessions set aal = 'aal2' where id = $1", [recoverySession]);
  expect((await asUser(admin, history, [seller])).rows).toEqual([]);
});

it("reports current counts and reservation settings from persisted data", async () => {
  expect((await asUser(admin, dashboard)).rows).toEqual([{
    users: 6, sellers: 1, listings: 1, orders: 7, payments: 1, disputes: 1, completed: 3,
    cs2_reservations: true, fashion_reservations: false,
  }]);
});
