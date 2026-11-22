-- Retain historical records while closing public onboarding and legacy seller writes.
begin;

update marketplace_private.seller_application_intake set is_open = false where singleton;
-- Deny new reservations until the merchant and checkout terms are confirmed.
-- Existing order updates, reservation retries and expiration remain available.
update marketplace_private.direct_order_settings set accepting_orders = false where singleton;

revoke insert on public.marketplace_seller_applications from public, anon, authenticated;
revoke insert (applicant_id, applicant_type, name, contact, region, requested_scope, registration_details)
  on public.marketplace_seller_applications from public, anon, authenticated;
revoke execute on function public.marketplace_set_seller_intake(boolean),
  public.marketplace_resubmit_seller_application(text, text, text, text, text, text),
  public.marketplace_review_seller_application(uuid, text, integer),
  public.marketplace_create_seller_challenge(),
  public.marketplace_verify_seller(uuid, integer, text)
  from public, anon, authenticated;

-- Private catalog management gains the role check. Published reads and
-- fulfillment access still use their existing policies and identities.
create or replace function marketplace_private.can_manage_listing(p_seller uuid, p_ecosystem text)
returns boolean language sql stable security definer set search_path = '' as $$
  select marketplace_private.is_admin() and (select auth.uid()) = p_seller and exists (
    select 1 from public.marketplace_seller_grants g
    join public.marketplace_seller_applications a on a.applicant_id = g.seller_id
    where g.seller_id = p_seller and a.status = 'approved'
      and a.revision = g.application_revision and a.requested_scope in (p_ecosystem, 'both')
  );
$$;

commit;
