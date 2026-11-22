-- Manual application intake for both ecosystems in the dedicated marketplace.
begin;

create table marketplace_private.seller_application_intake (
  singleton boolean primary key default true check (singleton),
  is_open boolean not null default false
);
alter table marketplace_private.seller_application_intake enable row level security;
revoke all on marketplace_private.seller_application_intake from public, anon, authenticated;
insert into marketplace_private.seller_application_intake default values;

create function public.marketplace_seller_intake_status()
returns table (is_open boolean, has_application boolean)
language sql stable security definer set search_path = '' as $$
  select coalesce((select i.is_open from marketplace_private.seller_application_intake i where i.singleton), false),
    exists (select 1 from public.marketplace_seller_applications a where a.applicant_id = (select auth.uid()))
  where marketplace_private.mfa_satisfied();
$$;
revoke all on function public.marketplace_seller_intake_status() from public, anon, authenticated;
grant execute on function public.marketplace_seller_intake_status() to authenticated;

create function public.marketplace_set_seller_intake(p_is_open boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if marketplace_private.is_admin() is not true then
    raise exception 'verified administrator session required' using errcode = '42501';
  end if;
  if p_is_open is null then
    raise exception 'intake state is required' using errcode = '22023';
  end if;

  update marketplace_private.seller_application_intake set is_open = p_is_open where singleton;
  if not found then
    raise exception 'seller application intake state is unavailable' using errcode = '55000';
  end if;
end;
$$;
revoke all on function public.marketplace_set_seller_intake(boolean) from public, anon, authenticated;
grant execute on function public.marketplace_set_seller_intake(boolean) to authenticated;

create function marketplace_private.require_open_seller_intake() returns void
language plpgsql set search_path = '' as $$
declare v_is_open boolean;
begin
  -- Keep the intake row locked through the submission. The admin UPDATE
  -- must wait for this transaction, and later submissions see its new state.
  select i.is_open into v_is_open from marketplace_private.seller_application_intake i where i.singleton for share;
  if v_is_open is not true then
    raise exception 'seller application intake is closed' using errcode = '55000';
  end if;
end;
$$;
revoke all on function marketplace_private.require_open_seller_intake() from public, anon, authenticated;

create function marketplace_private.check_seller_application_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform marketplace_private.require_open_seller_intake();
  return new;
end;
$$;
revoke all on function marketplace_private.check_seller_application_insert() from public, anon, authenticated;
create trigger marketplace_seller_application_intake before insert on public.marketplace_seller_applications
  for each row execute function marketplace_private.check_seller_application_insert();

create or replace function public.marketplace_resubmit_seller_application(
  p_type text, p_name text, p_contact text, p_region text, p_scope text, p_registration text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_old_scope text; v_revision integer;
begin
  if marketplace_private.mfa_satisfied() is not true then raise exception 'MFA required' using errcode = '42501'; end if;
  perform marketplace_private.require_open_seller_intake();
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

commit;
