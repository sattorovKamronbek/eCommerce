// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
const owner = "00000000-0000-4000-8000-000000000001";
const admin = "00000000-0000-4000-8000-000000000002";
const user = "00000000-0000-4000-8000-000000000003";
async function asUser(id: string, sql: string) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
    return tx.query(sql);
  });
}
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
  await db.query("insert into auth.users values ($1, '{}', now()), ($2, '{}', now()), ($3, '{\"role\":\"owner\"}', now())", [owner, admin, user]);
  await db.exec(await readFile(new URL("../migrations/202611110001_accounts.sql", import.meta.url), "utf8"));
  await db.query("insert into public.marketplace_user_roles values ($1, 'admin', now())", [admin]);
  await db.exec(await readFile(new URL("../migrations/202611160002_owner_role.sql", import.meta.url), "utf8"));
  await db.query("insert into public.marketplace_user_roles(user_id, role) values ($1, 'owner')", [owner]);
}, 30000);
afterAll(async () => { await db.close(); });

it("lets an explicitly assigned owner use admin reads while preserving existing admins", async () => {
  expect((await asUser(owner, "select id from public.marketplace_profiles")).rows).toHaveLength(3);
  expect((await asUser(admin, "select id from public.marketplace_profiles")).rows).toHaveLength(3);
  expect((await asUser(user, "select id from public.marketplace_profiles")).rows).toEqual([{ id: user }]);
});
it("never grants owner from signup metadata or permits role writes", async () => {
  expect((await asUser(user, "select * from public.marketplace_user_roles")).rows).toEqual([]);
  await expect(asUser(user, `insert into public.marketplace_user_roles(user_id, role) values ('${user}', 'owner')`)).rejects.toThrow(/permission denied/);
  await expect(asUser(owner, `update public.marketplace_user_roles set role='owner' where user_id='${user}'`)).rejects.toThrow(/permission denied/);
});
