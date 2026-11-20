// Generates the operator-reviewed all-or-nothing setup bundle from migrations.
import { readFile, writeFile } from "node:fs/promises";

const names = [
  "202611160001_seller_applications.sql",
  "202611160002_owner_role.sql",
  "202611160003_seller_catalog.sql",
  "202611180004_enforce_mfa.sql",
];
const header = `-- TARGET: project xevzbtivteugbqbmmtyz ONLY. Verify the dashboard project URL first.
-- Generated from repository migrations. Never run on another application.
-- This transaction does not grant an owner role or delete existing user data.
begin;
do $$
declare relation_name text;
begin
  if to_regclass('public.marketplace_user_roles') is null or to_regclass('public.marketplace_profiles') is null then
    raise exception 'Marketplace account tables are missing; stop and inspect the project';
  end if;
  if not coalesce((select relrowsecurity from pg_catalog.pg_class where oid = 'public.marketplace_profiles'::regclass), false)
     or not coalesce((select relrowsecurity from pg_catalog.pg_class where oid = 'public.marketplace_user_roles'::regclass), false)
     or not exists (select 1 from pg_catalog.pg_policy where polrelid = 'public.marketplace_profiles'::regclass and polname = 'marketplace_profile_read')
     or not exists (select 1 from pg_catalog.pg_policy where polrelid = 'public.marketplace_user_roles'::regclass and polname = 'marketplace_role_read')
     or to_regprocedure('marketplace_private.is_admin()') is null
     or has_table_privilege('anon', 'public.marketplace_profiles', 'SELECT')
     or has_table_privilege('anon', 'public.marketplace_user_roles', 'SELECT') then
    raise exception 'Accounts security prerequisites are missing; stop and inspect the existing installation';
  end if;
  if not exists (
    select 1 from auth.users u join public.marketplace_user_roles r on r.user_id = u.id
    where lower(u.email) = 'sattorovkamronbek2@gmail.com' and u.email_confirmed_at is not null and r.role = 'owner'
  ) then
    raise exception 'Confirmed designated owner role not found; inspect the owner UUID and do not proceed';
  end if;
  foreach relation_name in array array[
    'marketplace_seller_applications', 'marketplace_seller_review_audit',
    'marketplace_seller_revision_audit', 'marketplace_seller_grants',
    'marketplace_seller_identity_challenges', 'marketplace_seller_verification_audit',
    'marketplace_listings', 'marketplace_listing_audit', 'marketplace_public_listings'
  ] loop
    if to_regclass('public.' || relation_name) is not null then
      raise exception 'Seller setup is already present or partial (%); stop and inspect', relation_name;
    end if;
  end loop;
end $$;
`;
const blocks = await Promise.all(names.map(async name => {
  const text = await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");
  return `\n-- Migration: ${name}\n` + text.replace(/^begin;\s*$/gim, "").replace(/^commit;\s*$/gim, "").trim() + "\n";
}));
await writeFile(new URL("../supabase/setup/owner_seller_setup.sql", import.meta.url), header + blocks.join("\n") + "\ncommit;\n");
