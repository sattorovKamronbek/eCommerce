// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("installs seller setup atomically and preserves the verified existing owner", async () => {
  const bundle = await readFile(new URL("../setup/owner_seller_setup.sql", import.meta.url), "utf8");
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb, email_confirmed_at timestamptz);
      create table auth.mfa_factors(user_id uuid, status text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid(), auth.jwt() to anon, authenticated;`);
    const owner = "00000000-0000-4000-8000-000000000001";
    await db.query("insert into auth.users values ($1, 'sattorovkamronbek2@gmail.com', '{}', now())", [owner]);
    await db.exec(await readFile(new URL("../migrations/202611110001_accounts.sql", import.meta.url), "utf8"));
    await db.exec("alter table public.marketplace_user_roles drop constraint marketplace_user_roles_role_check; alter table public.marketplace_user_roles add constraint marketplace_user_roles_role_check check (role in ('owner', 'admin'));");
    await db.query("insert into public.marketplace_user_roles (user_id, role) values ($1, 'owner')", [owner]);
    // Matching email alone must never create or replace an owner grant.
    await db.query("delete from public.marketplace_user_roles where user_id=$1", [owner]);
    await expect(db.exec(bundle)).rejects.toThrow(/owner role not found/i);
    await db.exec("rollback");
    expect((await db.query("select role from public.marketplace_user_roles where user_id=$1", [owner])).rows).toEqual([]);
    await db.query("insert into public.marketplace_user_roles (user_id, role) values ($1, 'owner')", [owner]);
    // A modified, unsafe accounts schema must be reviewed before any installation.
    await db.exec("alter table public.marketplace_profiles disable row level security");
    await expect(db.exec(bundle)).rejects.toThrow(/accounts security/i);
    await db.exec("rollback");
    await db.exec("alter table public.marketplace_profiles enable row level security");
    // A partial installation must abort before creating the missing application table.
    await db.exec("create table public.marketplace_seller_revision_audit (id integer)");
    await expect(db.exec(bundle)).rejects.toThrow(/already present/i);
    await db.exec("rollback");
    expect((await db.query<{ table_name: string | null }>("select to_regclass('public.marketplace_seller_applications') as table_name")).rows[0].table_name).toBeNull();
    await db.exec("drop table public.marketplace_seller_revision_audit");
    await db.exec(bundle);
    expect((await db.query("select role from public.marketplace_user_roles where user_id=$1", [owner])).rows).toEqual([{ role: "owner" }]);
    expect((await db.query("select to_regclass('public.marketplace_seller_applications') is not null as applications, to_regclass('public.marketplace_public_listings') is not null as listings")).rows).toEqual([{ applications: true, listings: true }]);
  } finally { await db.close(); }
}, 60000);

it("keeps the operator bundle in sync with each source migration", async () => {
  const bundle = await readFile(new URL("../setup/owner_seller_setup.sql", import.meta.url), "utf8");
  for (const name of ["202611160001_seller_applications.sql", "202611160002_owner_role.sql", "202611160003_seller_catalog.sql", "202611180004_enforce_mfa.sql"]) {
    const migration = await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8");
    const body = migration.replace(/^begin;\s*$/gim, "").replace(/^commit;\s*$/gim, "").trim();
    expect(bundle).toContain(`-- Migration: ${name}\n${body}`);
  }
});
