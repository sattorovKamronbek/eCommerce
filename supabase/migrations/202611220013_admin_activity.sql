-- Account activity and operational counts for verified administrators.
begin;

create table public.marketplace_sign_in_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null unique,
  signed_in_at timestamptz not null
);
create index marketplace_sign_in_events_user_time_idx
  on public.marketplace_sign_in_events (user_id, signed_in_at desc, id desc);
alter table public.marketplace_sign_in_events enable row level security;
revoke all on public.marketplace_sign_in_events from public, anon, authenticated;
grant select (id, user_id, signed_in_at) on public.marketplace_sign_in_events to authenticated;
create policy sign_in_events_admin_read on public.marketplace_sign_in_events
  for select to authenticated using ((select marketplace_private.is_admin()));

create function marketplace_private.record_sign_in() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_session_id uuid;
begin
  if tg_op = 'INSERT' then
    v_session_id := new.session_id;
  else
    v_session_id := new.id;
  end if;

  insert into public.marketplace_sign_in_events (session_id, user_id, signed_in_at)
    select s.id, s.user_id, case when tg_op = 'INSERT' then coalesce(s.created_at, statement_timestamp())
      else statement_timestamp() end
    from auth.sessions s
    where s.id = v_session_id
      and marketplace_private.is_active_user(s.user_id)
      and exists (
        select 1 from auth.mfa_amr_claims c where c.session_id = s.id and c.authentication_method = 'password'
      )
      and (s.aal::text = 'aal2' or not exists (
        select 1 from auth.mfa_factors f where f.user_id = s.user_id and f.status::text = 'verified'
      ))
    on conflict (session_id) do nothing;
  return new;
end;
$$;
revoke all on function marketplace_private.record_sign_in() from public, anon, authenticated;

-- Supabase creates a password method claim after issuing the session. Recovery
-- and email confirmation use OTP claims and do not count as password sign-ins.
create trigger marketplace_record_password_sign_in after insert on auth.mfa_amr_claims
  for each row when (new.authentication_method = 'password')
  execute function marketplace_private.record_sign_in();
create trigger marketplace_record_sign_in_mfa after update of aal on auth.sessions
  for each row when (new.aal::text = 'aal2' and new.aal is distinct from old.aal)
  execute function marketplace_private.record_sign_in();

create function public.marketplace_admin_user_overview(p_user_id uuid)
returns table (
  email text, registered_at timestamptz, confirmed_at timestamptz, last_sign_in_at timestamptz,
  mfa_enabled boolean, completed_orders bigint, purchased_units bigint, completed_total_uzs text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if marketplace_private.is_admin() is not true then
    raise exception 'verified administrator session required' using errcode = '42501';
  end if;
  return query
    select u.email::text, u.created_at, u.email_confirmed_at, u.last_sign_in_at,
      exists (select 1 from auth.mfa_factors f where f.user_id = u.id and f.status::text = 'verified'),
      purchases.orders, purchases.units, purchases.total_uzs
    from public.marketplace_profiles p join auth.users u on u.id = p.id
    cross join lateral (
      select count(*) as orders, coalesce(sum(o.quantity), 0) as units,
        (coalesce(sum(o.total_tiyin), 0) * 0.01)::text as total_uzs
      from public.marketplace_orders o where o.buyer_id = u.id and o.status = 'completed'
    ) purchases
    where u.id = p_user_id;
end;
$$;
revoke all on function public.marketplace_admin_user_overview(uuid) from public, anon, authenticated;
grant execute on function public.marketplace_admin_user_overview(uuid) to authenticated;

create function public.marketplace_admin_dashboard()
returns table (
  users bigint, sellers bigint, listings bigint, orders bigint, payments bigint, disputes bigint, completed bigint,
  cs2_reservations boolean, fashion_reservations boolean
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if marketplace_private.is_admin() is not true then
    raise exception 'verified administrator session required' using errcode = '42501';
  end if;
  return query
    select (select count(*) from public.marketplace_profiles),
      (select count(*) from public.marketplace_seller_applications a where a.status = 'pending'),
      (select count(*) from public.marketplace_listings),
      totals.orders, totals.payments, totals.disputes, totals.completed,
      s.accepting_orders and 'cs2' = any(s.accepting_ecosystems),
      s.accepting_orders and 'fashion' = any(s.accepting_ecosystems)
    from marketplace_private.direct_order_settings s
    cross join (
      select count(*) as orders, count(*) filter (where o.status = 'reported') as payments,
        count(*) filter (where o.status = 'disputed') as disputes,
        count(*) filter (where o.status = 'completed') as completed
      from public.marketplace_orders o
    ) totals
    where s.singleton;
end;
$$;
revoke all on function public.marketplace_admin_dashboard() from public, anon, authenticated;
grant execute on function public.marketplace_admin_dashboard() to authenticated;

commit;
