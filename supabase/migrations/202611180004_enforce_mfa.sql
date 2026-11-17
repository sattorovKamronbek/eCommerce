-- Require step-up for MFA-enrolled users and all private administrative access.
begin;
create function marketplace_private.has_verified_mfa() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status::text = 'verified');
$$;
create function marketplace_private.mfa_satisfied() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (not marketplace_private.has_verified_mfa() or coalesce((select auth.jwt() ->> 'aal') = 'aal2', false));
$$;
revoke all on function marketplace_private.has_verified_mfa(), marketplace_private.mfa_satisfied() from public, anon, authenticated;
grant execute on function marketplace_private.has_verified_mfa(), marketplace_private.mfa_satisfied() to authenticated;
create or replace function marketplace_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false) and marketplace_private.has_verified_mfa() and exists (
    select 1 from public.marketplace_user_roles r join auth.users u on u.id = r.user_id
    where r.user_id = (select auth.uid()) and r.role in ('admin', 'owner') and u.email_confirmed_at is not null
  );
$$;
create policy mfa_required on public.marketplace_profiles as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_user_roles as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_applications as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_review_audit as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_revision_audit as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_grants as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_seller_verification_audit as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_listing_audit as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create policy mfa_required on public.marketplace_listings as restrictive for all to authenticated using ((select marketplace_private.mfa_satisfied())) with check ((select marketplace_private.mfa_satisfied()));
create or replace function public.marketplace_resubmit_seller_application(
  p_type text, p_name text, p_contact text, p_region text, p_scope text, p_registration text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_old_scope text; v_revision integer;
begin
  if marketplace_private.mfa_satisfied() is not true then raise exception 'MFA required' using errcode = '42501'; end if;
  select requested_scope into v_old_scope from public.marketplace_seller_applications
    where applicant_id = (select auth.uid()) and status in ('pending', 'rejected') for update;
  if not found then
    raise exception 'editable application not found' using errcode = 'P0002';
  end if;
  update public.marketplace_seller_applications
    set applicant_type = p_type, name = p_name, contact = p_contact,
        region = p_region, requested_scope = p_scope, registration_details = p_registration,
        status = 'pending', reviewed_at = null, revision = revision + 1
    where applicant_id = (select auth.uid()) and status in ('pending', 'rejected')
    returning revision into v_revision;
  insert into public.marketplace_seller_revision_audit(actor_id, applicant_id, old_scope, new_scope, revision)
    values (auth.uid(), auth.uid(), v_old_scope, p_scope, v_revision);
end;
$$;

create or replace function public.marketplace_create_seller_challenge() returns text
language plpgsql security definer set search_path = '' as $$
declare v_revision integer; v_code text;
begin
  if not marketplace_private.has_verified_mfa() or (select auth.uid()) is null or (select auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'verified seller session required' using errcode = '42501';
  end if;
  select revision into v_revision from public.marketplace_seller_applications
    where applicant_id = (select auth.uid()) and status = 'pending' for update;
  if not found then raise exception 'pending application not found' using errcode = 'P0002'; end if;
  v_code := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.marketplace_seller_identity_challenges(seller_id, application_revision, code_hash, expires_at)
    values (auth.uid(), v_revision, sha256(convert_to(v_code, 'UTF8')), now() + interval '10 minutes')
    on conflict (seller_id) do update set application_revision = excluded.application_revision,
      code_hash = excluded.code_hash, expires_at = excluded.expires_at;
  return v_code;
end;
$$;

create or replace function marketplace_private.can_manage_listing(p_seller uuid, p_ecosystem text)
returns boolean language sql stable security definer set search_path = '' as $$
  select marketplace_private.has_verified_mfa() and (select auth.uid()) = p_seller and (select auth.jwt() ->> 'aal') = 'aal2' and exists (
    select 1 from public.marketplace_seller_grants g
    join public.marketplace_seller_applications a on a.applicant_id = g.seller_id
    where g.seller_id = p_seller and a.status = 'approved'
      and a.revision = g.application_revision and a.requested_scope in (p_ecosystem, 'both')
  );
$$;

commit;
