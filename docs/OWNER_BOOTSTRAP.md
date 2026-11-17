# Owner bootstrap for the dedicated marketplace project

No role has been granted by this repository. Apply the reviewed migrations in order only to Supabase project `xevzbtivteugbqbmmtyz`, after backing up and verifying the project. Use the SQL editor with an appropriately privileged project account; do not use the other application's project. Test these steps in a non-production clone first.

Before granting access, verify the exact `auth.users.id` belongs to the intended person who controls `sattorovkamronbek2@gmail.com`: the email must be confirmed, and the person must be signed in and have completed this site's authenticator setup. A matching email alone does not prove account control. Obtain the UUID through a private administrative review; never paste passwords, authenticator secrets or service-role keys into SQL, source control or chat.

After independent verification, substitute the verified UUID locally (do not run the placeholder):

```sql
begin;
do $$
declare affected integer;
begin
  insert into public.marketplace_user_roles (user_id, role)
  select id, 'owner' from auth.users
  where id = 'REPLACE_WITH_VERIFIED_UUID'::uuid
    and lower(email) = 'sattorovkamronbek2@gmail.com'
    and email_confirmed_at is not null
    and exists (select 1 from auth.mfa_factors f where f.user_id = auth.users.id and f.status::text = 'verified')
  on conflict (user_id) do update set role = excluded.role;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Verified owner was not found'; end if;
end $$;
commit;
```

This statement does not remove other owner roles. Inspect existing owner assignments independently and resolve any unexpected access through a separately reviewed administrative change.

Once committed, sign in with that account, complete MFA for the session, and verify administrator access and a separate unprivileged account's denial. Store a recovery process securely. The owner-management UI and recovery automation are not implemented. Do not grant the role to an unverified account.
