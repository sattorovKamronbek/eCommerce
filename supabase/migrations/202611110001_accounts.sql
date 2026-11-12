-- Dedicated marketplace project only. Additive migration; no application secrets.
begin;

create schema marketplace_private;
revoke all on schema marketplace_private from public, anon, authenticated;
grant usage on schema marketplace_private to authenticated;

create table public.marketplace_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default ''
    check (char_length(display_name) <= 80 and display_name !~ '[[:cntrl:]]'),
  preferred_locale text not null default 'uz' check (preferred_locale in ('uz', 'ru', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index marketplace_profiles_created_id_idx on public.marketplace_profiles(created_at desc, id desc);

create table public.marketplace_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role = 'admin'),
  created_at timestamptz not null default now()
);

alter table public.marketplace_profiles enable row level security;
alter table public.marketplace_user_roles enable row level security;
revoke all on public.marketplace_profiles from public, anon, authenticated;
revoke all on public.marketplace_user_roles from public, anon, authenticated;
grant select on public.marketplace_profiles to authenticated;
grant update (display_name, preferred_locale) on public.marketplace_profiles to authenticated;
grant select on public.marketplace_user_roles to authenticated;

create function marketplace_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.marketplace_user_roles r
    join auth.users u on u.id = r.user_id
    where r.user_id = (select auth.uid()) and r.role = 'admin'
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function marketplace_private.is_admin() from public, anon, authenticated;
grant execute on function marketplace_private.is_admin() to authenticated;

create policy marketplace_profile_read on public.marketplace_profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select marketplace_private.is_admin()));
create policy marketplace_profile_edit on public.marketplace_profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy marketplace_role_read on public.marketplace_user_roles
  for select to authenticated using (user_id = (select auth.uid()));

create function marketplace_private.touch_profile() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function marketplace_private.touch_profile() from public, anon, authenticated;
create trigger marketplace_profile_updated before update on public.marketplace_profiles
  for each row execute function marketplace_private.touch_profile();

create function marketplace_private.create_confirmed_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null then
    insert into public.marketplace_profiles(id, display_name, preferred_locale)
    values (
      new.id,
      left(btrim(regexp_replace(coalesce(new.raw_user_meta_data ->> 'display_name', ''), '[[:cntrl:]]', '', 'g')), 80),
      case when new.raw_user_meta_data ->> 'preferred_locale' in ('uz', 'ru', 'en')
        then new.raw_user_meta_data ->> 'preferred_locale' else 'uz' end
    ) on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function marketplace_private.create_confirmed_profile() from public, anon, authenticated;
create trigger marketplace_confirmed_profile after insert or update of email_confirmed_at on auth.users
  for each row execute function marketplace_private.create_confirmed_profile();

-- Cover accounts confirmed in this dedicated project before application setup.
insert into public.marketplace_profiles(id, display_name, preferred_locale)
select id,
  left(btrim(regexp_replace(coalesce(raw_user_meta_data ->> 'display_name', ''), '[[:cntrl:]]', '', 'g')), 80),
  case when raw_user_meta_data ->> 'preferred_locale' in ('uz', 'ru', 'en')
    then raw_user_meta_data ->> 'preferred_locale' else 'uz' end
from auth.users where email_confirmed_at is not null
on conflict (id) do nothing;

commit;
