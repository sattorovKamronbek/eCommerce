// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { literalNamePattern } from "@/lib/auth/admin-users";

// Real PostgreSQL policies; JWT identity settings are a test harness, not Supabase Auth.
const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const pending = "00000000-0000-4000-8000-000000000003";
const metadataUser = "00000000-0000-4000-8000-000000000004";

async function asUser(id: string | null, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${id ? "authenticated" : "anon"}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [id ?? ""]);
    return tx.query<Record<string, unknown>>(sql, params);
  });
}

beforeAll(async () => {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb,
      email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  await db.query("insert into auth.users values ($1, $2, now()), ($3, $4, now()), ($5, $6, null)",
    [alice, { display_name: "Alice", preferred_locale: "en" }, bob, { display_name: "Bob" }, pending, { display_name: "Pending" }]);
  await db.exec(await readFile(new URL("../migrations/202611110001_accounts.sql", import.meta.url), "utf8"));
}, 30000);
afterAll(async () => { await db.close(); });

describe("account migrations and PostgreSQL row-level authorization", () => {
  it("matches special characters in administrator name searches literally in PostgreSQL", async () => {
    for (const name of ["Ali.*|Bob", "50%_\\*", "[Admin](test)+?{2}^$", "Тест", "O‘ktam"]) {
      const result = await db.query<{ name: string }>("select name from (values ($1::text), ('Other person'), ('Bob')) names(name) where name ~* $2", [`prefix ${name} suffix`, literalNamePattern(name)]);
      expect(result.rows).toEqual([{ name: `prefix ${name} suffix` }]);
    }
  });
  it("backfills only email-confirmed profiles", async () => {
    const result = await db.query("select id from public.marketplace_profiles order by id");
    expect(result.rows).toEqual([{ id: alice }, { id: bob }]);
  });
  it("denies anonymous profile and role reads", async () => {
    await expect(asUser(null, "select * from public.marketplace_profiles")).rejects.toThrow(/permission denied/);
    await expect(asUser(null, "select * from public.marketplace_user_roles")).rejects.toThrow(/permission denied/);
  });
  it("isolates customers even without an application filter", async () => {
    expect((await asUser(alice, "select id from public.marketplace_profiles")).rows).toEqual([{ id: alice }]);
    expect((await asUser(bob, "select id from public.marketplace_profiles where id = $1", [alice])).rows).toEqual([]);
  });
  it("allows only own display name/locale edits and refreshes timestamp", async () => {
    const result = await asUser(alice, "update public.marketplace_profiles set display_name='Alice Updated', preferred_locale='ru' where id=$1 returning display_name, preferred_locale", [alice]);
    expect(result.rows).toEqual([{ display_name: "Alice Updated", preferred_locale: "ru" }]);
    expect((await asUser(bob, "update public.marketplace_profiles set display_name='Intruder' where id=$1 returning id", [alice])).rows).toEqual([]);
    await expect(asUser(alice, "update public.marketplace_profiles set preferred_locale='xx' where id=$1", [alice])).rejects.toThrow(/check constraint/);
  });
  it("rejects protected columns, inserts, deletes and role escalation", async () => {
    for (const sql of [
      "update public.marketplace_profiles set id=id",
      "update public.marketplace_profiles set created_at=now()",
      "update public.marketplace_profiles set updated_at=now()",
      `insert into public.marketplace_profiles (id) values ('${alice}')`,
      "delete from public.marketplace_profiles",
      `insert into public.marketplace_user_roles (user_id, role) values ('${alice}', 'admin')`,
      "update public.marketplace_user_roles set role='admin'",
      "delete from public.marketplace_user_roles",
    ]) await expect(asUser(alice, sql)).rejects.toThrow(/permission denied/);
  });
  it("creates profile on confirmation and safely normalizes untrusted metadata", async () => {
    await db.query("update auth.users set email_confirmed_at=now() where id=$1", [pending]);
    expect((await asUser(pending, "select id from public.marketplace_profiles")).rows).toEqual([{ id: pending }]);
    await db.query("insert into auth.users values ($1, $2, now())", [metadataUser, { display_name: "x".repeat(200) + "\n", preferred_locale: "not-a-locale", role: "admin" }]);
    const row = (await asUser(metadataUser, "select display_name, preferred_locale from public.marketplace_profiles")).rows[0];
    expect(row).toEqual({ display_name: "x".repeat(80), preferred_locale: "uz" });
    expect((await asUser(metadataUser, "select * from public.marketplace_user_roles")).rows).toEqual([]);
  });
  it("lets a database-assigned admin read profiles and removes access immediately on revocation", async () => {
    await db.query("insert into public.marketplace_user_roles(user_id,role) values ($1,'admin')", [bob]);
    expect((await asUser(bob, "select id from public.marketplace_profiles")).rows).toHaveLength(4);
    await db.query("delete from public.marketplace_user_roles where user_id=$1", [bob]);
    expect((await asUser(bob, "select id from public.marketplace_profiles")).rows).toEqual([{ id: bob }]);
  });
});
