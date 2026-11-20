-- READ ONLY. In the Supabase dashboard first verify the project URL contains
-- xevzbtivteugbqbmmtyz. Do not run this against the other live application.
-- Only booleans are returned; no password, MFA code or account UUID is exposed.
select
  exists (select 1 from auth.users u where lower(u.email) = 'sattorovkamronbek2@gmail.com') as owner_account_exists,
  exists (select 1 from auth.users u where lower(u.email) = 'sattorovkamronbek2@gmail.com' and u.email_confirmed_at is not null) as owner_email_confirmed,
  exists (select 1 from auth.users u join public.marketplace_user_roles r on r.user_id = u.id where lower(u.email) = 'sattorovkamronbek2@gmail.com' and r.role = 'owner') as owner_role_in_marketplace_table,
  exists (select 1 from auth.users u join auth.mfa_factors f on f.user_id = u.id where lower(u.email) = 'sattorovkamronbek2@gmail.com' and f.status::text = 'verified') as owner_has_verified_mfa,
  to_regclass('public.marketplace_seller_applications') is not null as seller_applications_installed,
  to_regclass('public.marketplace_seller_grants') is not null as seller_grants_installed,
  to_regclass('public.marketplace_listings') is not null as listings_installed,
  to_regclass('public.marketplace_public_listings') is not null as public_listings_installed,
  to_regprocedure('public.marketplace_verify_seller(uuid,integer,text)') is not null as seller_verification_installed,
  to_regprocedure('marketplace_private.mfa_satisfied()') is not null as mfa_guard_function_installed;
