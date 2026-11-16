-- Additive seller application intake for the dedicated marketplace project.
-- Approval records a review only; seller catalog authority is a separate phase.
begin;

create table public.marketplace_seller_applications (
  applicant_id uuid primary key references auth.users(id) on delete cascade,
  applicant_type text not null check (applicant_type in ('individual', 'company')),
  name text not null check (char_length(btrim(name)) between 1 and 120 and name !~ '[[:cntrl:]]'),
  contact text not null check (char_length(btrim(contact)) between 1 and 200 and contact !~ '[[:cntrl:]]'),
  region text not null check (char_length(btrim(region)) between 1 and 120 and region !~ '[[:cntrl:]]'),
  requested_scope text not null check (requested_scope in ('cs2', 'fashion', 'both')),
  registration_details text check (registration_details is null or (char_length(btrim(registration_details)) between 1 and 200 and registration_details !~ '[[:cntrl:]]')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (applicant_type <> 'company' or registration_details is not null)
);

create index marketplace_seller_applications_status_created_idx
  on public.marketplace_seller_applications(status, created_at, applicant_id);

create table public.marketplace_seller_review_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  applicant_id uuid references auth.users(id) on delete set null,
  decision text not null check (decision in ('approved', 'rejected', 'reopen')),
  revision integer not null check (revision > 0),
  requested_scope text not null check (requested_scope in ('cs2', 'fashion', 'both')),
  created_at timestamptz not null default now()
);

create table public.marketplace_seller_revision_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  applicant_id uuid references auth.users(id) on delete set null,
  old_scope text not null check (old_scope in ('cs2', 'fashion', 'both')),
  new_scope text not null check (new_scope in ('cs2', 'fashion', 'both')),
  revision integer not null check (revision > 0),
  created_at timestamptz not null default now()
);

alter table public.marketplace_seller_applications enable row level security;
alter table public.marketplace_seller_review_audit enable row level security;
alter table public.marketplace_seller_revision_audit enable row level security;
revoke all on public.marketplace_seller_applications, public.marketplace_seller_review_audit, public.marketplace_seller_revision_audit from public, anon, authenticated;
grant select on public.marketplace_seller_applications to authenticated;
grant insert (applicant_id, applicant_type, name, contact, region, requested_scope, registration_details)
  on public.marketplace_seller_applications to authenticated;
grant select on public.marketplace_seller_review_audit to authenticated;
grant select on public.marketplace_seller_revision_audit to authenticated;

create policy seller_application_read on public.marketplace_seller_applications
  for select to authenticated
  using (applicant_id = (select auth.uid()) or (select marketplace_private.is_admin()));
create policy seller_application_submit on public.marketplace_seller_applications
  for insert to authenticated with check (applicant_id = (select auth.uid()));
create policy seller_audit_admin_read on public.marketplace_seller_review_audit
  for select to authenticated using ((select marketplace_private.is_admin()));
create policy seller_revision_audit_admin_read on public.marketplace_seller_revision_audit
  for select to authenticated using ((select marketplace_private.is_admin()));

create function public.marketplace_review_seller_application(p_applicant_id uuid, p_decision text, p_revision integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_scope text;
begin
  if not marketplace_private.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected', 'reopen') or p_decision is null then
    raise exception 'invalid decision' using errcode = '22023';
  end if;
  if p_decision = 'reopen' then
    update public.marketplace_seller_applications
      set status = 'pending', reviewed_at = null, revision = revision + 1
      where applicant_id = p_applicant_id and status in ('approved', 'rejected') and revision = p_revision
      returning requested_scope into v_scope;
  else
    update public.marketplace_seller_applications
      set status = p_decision, reviewed_at = now()
      where applicant_id = p_applicant_id and status = 'pending' and revision = p_revision
      returning requested_scope into v_scope;
  end if;
  if not found then
    raise exception 'pending application not found' using errcode = 'P0002';
  end if;
  insert into public.marketplace_seller_review_audit(actor_id, applicant_id, decision, revision, requested_scope)
    values (auth.uid(), p_applicant_id, p_decision, p_revision, v_scope);
end;
$$;
revoke all on function public.marketplace_review_seller_application(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.marketplace_review_seller_application(uuid, text, integer) to authenticated;

create function public.marketplace_resubmit_seller_application(
  p_type text, p_name text, p_contact text, p_region text, p_scope text, p_registration text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_old_scope text; v_revision integer;
begin
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
revoke all on function public.marketplace_resubmit_seller_application(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.marketplace_resubmit_seller_application(text, text, text, text, text, text) to authenticated;

commit;
