# Account and initial admin setup

This slice adds real Supabase email/password accounts, profiles and a read-only
admin users list. Seller operations, catalog inventory, orders and payments are
separate work. Public sample catalogs remain visibly illustrative.

## Dedicated project and local environment

The owner confirmed that `xevzbtivteugbqbmmtyz` is a new project dedicated to this
marketplace. Do not apply these instructions to the other live application.

Copy `.env.example` to ignored `.env.local` if no local configuration exists.
Fill `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the project's publishable key.
`APP_ORIGIN` must be the trusted application origin, with no path/query. Use
`http://localhost:3000` for local work and the real HTTPS origin for deployment.
No service-role key, database password or management token belongs in browser
variables, Git, chat, screenshots or application logs.

The application validates public credentials and requires `APP_ORIGIN`; incomplete
configuration yields an unavailable-account page while browsing continues.
Restart the local server after changing environment settings.

## Apply the migration

Review `supabase/migrations/202611110001_accounts.sql` and apply it using Supabase
CLI migrations or the dedicated project's SQL Editor. With CLI, link only the
confirmed project and inspect the pending migration before pushing it. Do not
reset any database. SQL Editor application does not populate the CLI migration
history automatically; reconcile migration history before later CLI deployment.

The migration creates two application tables, a private helper schema, RLS,
column grants and a confirmed-email profile trigger. It also backfills confirmed
users in this dedicated project. It intentionally fails on name collisions rather
than replacing unknown objects. Save the migration in the repository; do not
modify an already-applied migration when making later schema changes.

Run `npm test -- supabase/tests/accounts.test.ts` to exercise the actual migration
and RLS under embedded PostgreSQL. That harness simulates the JWT identity setting;
it does not prove live Supabase Auth, SMTP or deployment settings.

## Authentication configuration

In the dedicated project's Authentication settings:

- Enable email/password signup and email confirmation. Keep automatic email
  confirmation disabled. Choose a password policy compatible with the app's
  12–128 character input boundary; stricter provider policies may reject passwords.
- Set Site URL to `APP_ORIGIN`.
- Allow exactly these redirect paths under the trusted application origin:
  `/uz/auth/confirm`, `/ru/auth/confirm`, `/en/auth/confirm`. Add the production
  equivalents when a deployment origin is selected; avoid broad wildcard domains.
- Configure the signup and password-recovery email templates below. They use the
  provider token hash directly, rather than implicitly consuming it on an email
  scanner's GET request. Template link labels can be localized by your mail setup.
- Configure appropriate SMTP delivery before opening registration to public users.
  Supabase's limited development email service is not production delivery proof.
  Verify sender, deliverability and project rate limits with actual test inboxes.

Signup confirmation link:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=signup">Confirm email</a>
```

Password recovery link:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery">Reset password</a>
```

### Gmail SMTP for the current local test

If no domain or email provider has been purchased, an existing personal Gmail
account with App Passwords available can be used for this local test. Enable
Google 2-Step Verification, then create an app password named for this application
at https://myaccount.google.com/apppasswords. In this project's Authentication SMTP
settings (`https://supabase.com/dashboard/project/xevzbtivteugbqbmmtyz/auth/smtp`),
enable custom SMTP and set:

| Setting | Value |
| --- | --- |
| Host | `smtp.gmail.com` |
| Port | `587` (STARTTLS) |
| Username | The full Gmail address |
| Password | The generated app password, entered only in Supabase |
| Sender email | The same Gmail address |
| Sender name | The configured brand name |

Do not use the ordinary Google account password, paste the app password into chat
or add it to this repository. No Gmail SMTP credential is required in the app's
local environment. If the App Passwords page is unavailable, check Google's
account-specific eligibility before choosing another email service.

If Google says App Passwords are unavailable, first inspect Google Account →
Security → 2-Step Verification. It must be enabled before App Passwords can be
created. Google's documented additional restrictions include accounts using only
security keys for 2-Step Verification, managed work/school accounts and Advanced
Protection. Do not assume every Gmail account supports this setup. Confirm the
actual account state before selecting another SMTP provider.

For Gmail error `535 5.7.8 Username and Password not accepted`, Gmail has rejected
SMTP authentication. Check the Google account that generated the App Password;
its full Gmail address must match the SMTP Username and Sender email. Generate a
new App Password for this application and enter its 16 characters in Supabase's
SMTP Password field without the display-grouping spaces, then Save. The App name
is a descriptive label; it is not the generated SMTP password. Do not change the
application's authentication rules or disable email confirmation to hide an SMTP
authentication failure. Request one new delivery check after configuration is
corrected, rather than repeatedly submitting signup/resend against rejected SMTP.

The built-in Supabase email provider has strict recipient and sending limits;
live HTTP 429 was observed during registration debugging on 2026-11-12. Custom
SMTP and project request limits still need verification after configuration.
Avoid repeated resend/signup tests while the provider reports a rate limit.

Primary instructions:
[Google App Passwords](https://support.google.com/accounts/answer/185833?hl=en),
[Gmail SMTP ports](https://developers.google.com/workspace/gmail/imap/imap-smtp),
[Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp) and
[Supabase limits](https://supabase.com/docs/guides/auth/rate-limits).

Opening either link stages a 10-minute HttpOnly flow cookie and redirects to a
clean local URL. The provider token is consumed only after the user submits the
confirmation/reset form. A normal signed-in session cannot authorize recovery.
If the provider consumes a recovery token but rejects the new password, request a
new recovery email; consumed tokens are not reused. Private/auth responses use
no-store caching and no-referrer policy. Do not add session-bearing pages to ISR
or shared CDN caching.

## First administrator

1. Register the intended owner's account through `/{locale}/account/register`.
2. Complete email confirmation. Check the exact UUID in the dedicated project's
   Auth user list; confirm it is your account before granting any role.
3. Through a privileged SQL Editor/migration connection, run the following after
   replacing the UUID. Check that exactly one row was assigned. This is never an
   application endpoint, browser action or email-only allowlist.

```sql
insert into public.marketplace_user_roles (user_id, role)
select id, 'admin' from auth.users
where id = 'REPLACE-WITH-VERIFIED-OWNER-UUID'::uuid
  and email_confirmed_at is not null
on conflict (user_id) do nothing;
```

Visit `/{locale}/admin/users`. The list shows application profile IDs, names,
preferred languages and creation dates, not authentication secrets or revenue.
The administrator can search literal display-name text, filter a supported
preferred language and page through 20 profiles at a time. These are server-side
queries using the authenticated administrator's client and the existing RLS;
there is no service-role runtime key or profile/role mutation interface.
Role assignments are read from the database on each privileged request. Revoke
access through the privileged SQL connection:

```sql
delete from public.marketplace_user_roles
where user_id = 'REPLACE-WITH-EXACT-ACCOUNT-UUID'::uuid;
```

If the first account becomes unavailable, recover the account through Supabase's
verified recovery process, or verify another intended owner's UUID and assign it
through the same privileged operation. Record administrative grants/revocations
in the owner's operational change log. No first-visitor auto-admin, default admin
password, impersonation, role editor or destructive user-management UI is included.

## Confirmation retry

`/{locale}/account/resend-confirmation` requests another signup-confirmation email
through Supabase. It is linked from login, registration and the confirmation
screen. Requests use only the configured trusted callback origin. Feedback does
not reveal whether an address is registered. All provider outcomes receive the
same neutral guidance, without promising delivery; address-dependent SMTP and
cooldown differences stay in the provider's Auth logs. This requires working SMTP,
the same redirect allowlist and the signup template above. It does not bypass
email verification or confirm an account locally.

The owner confirmed on 2026-11-12 that the known Gmail SMTP `535 5.7.8` rejection
has not been corrected. Generate a new App Password in the same Google account as
the full SMTP username/sender email, save it directly in the dedicated project's
SMTP Password field and then verify one actual confirmation delivery. Do not send
the App Password in chat. The UI improvement alone cannot fix remote credentials.

Implementation follows the official [Supabase resend API](https://supabase.com/docs/reference/javascript/auth-resend)
and [PostgREST pattern operators](https://docs.postgrest.org/en/stable/references/api/tables_views.html#operators).
Name search escapes regular-expression metacharacters for literal substring
matching and avoids PostgREST's LIKE asterisk alias.
The uniform resend outcome follows the provider's [resend implementation](https://github.com/supabase/auth/blob/master/internal/api/resend.go),
which returns early for unknown or already-confirmed addresses.

## Browser test origin

The repository Playwright server sets `APP_ORIGIN` to its own
`http://127.0.0.1:3000` base URL. Confirmation redirects and HttpOnly flow cookies
must use the same host; mixing 127.0.0.1 with localhost loses the staged cookie.
This test-only override does not edit `.env.local` or remote redirect settings.
Run against the configured trusted origin for actual email-provider testing.

## Verify before public release

### Response privacy and session policy update — 2026-11-15

Signup, recovery and confirmation-resend requests now use neutral public
acknowledgments for every provider outcome, including email delivery failures,
per-address cooldowns, transport failures and existing/unknown addresses. Local
input validation and missing configuration still report errors; unexpectedly
returned signup sessions still report unavailable. A neutral acknowledgment does
not establish registration or email delivery. Consult Supabase Auth logs for
operator diagnostics rather than differentiating responses by address. This
supersedes the earlier UI-specific registration SMTP/rate-limit feedback.

Registration/recovery forms remain usable for a later retry and clear entered
passwords after the acknowledgment. Wait before requesting another email; the
provider's actual limits and SMTP setup remain necessary. No local success state
confirms an account or bypasses password verification.

All application Auth calls and session refresh remain on the server. Both SSR
clients explicitly set HttpOnly, SameSite=Lax, root-path session cookies and Secure
when `APP_ORIGIN` is HTTPS; loopback HTTP remains usable for development. The
provider still determines token lifetime. Do not add a browser Supabase Auth client
that expects to read these cookies without reviewing the identity design.
See [Supabase session guidance](https://supabase.com/docs/guides/auth/sessions),
[password auth](https://supabase.com/docs/guides/auth/passwords) and
[provider rate limits](https://supabase.com/docs/guides/auth/rate-limits).

Run typecheck, lint, unit/database tests, production build, then Playwright. Against
the dedicated test project, additionally verify real signup mail, explicit email
confirmation, sign-in, session refresh, profile changes, logout, real recovery mail
and password reset. Use two test accounts to confirm database isolation, denied
role writes and immediate admin revocation. Anonymous API calls must not read
private profiles. Provider tests and email delivery require configured dedicated
test credentials/inboxes; do not substitute SDK mocks for those checks.

Do not call this application production-ready merely because local checks pass.
Record exact executed checks and external blockers in `PROJECT_PROGRESS.md`.

For opt-in live-provider authorization checks, create two confirmed, non-admin
test accounts in the dedicated project. Configure `AUTH_TEST_A_EMAIL`,
`AUTH_TEST_A_PASSWORD`, `AUTH_TEST_B_EMAIL` and `AUTH_TEST_B_PASSWORD` in ignored
local configuration, then run `RUN_SUPABASE_LIVE_TESTS=1 npm run test:auth:live`.
The script refuses other project hosts, tests real provider sessions and RLS,
temporarily updates/restores test profile A and signs out its test clients.
The npm command enables Node 20's native WebSocket support required by the
standalone SDK constructor; the Next.js runtime supplies its own WebSocket setup.
It does not send signup/recovery emails or grant admin rights. Do not run it using
real customer credentials. Never post test-account passwords into chat.

## Current signup contract — 2026-11-16

The owner explicitly selected email/password signup without email confirmation.
This supersedes the earlier instruction to keep confirmation enabled. In the
**dedicated** project `xevzbtivteugbqbmmtyz`, disable **Confirm email** in
Authentication → Sign In / Providers → Email, then save. No secret key is needed
in the application. Never change the owner's other project's settings.

Signup now reads uncached public Auth settings before calling `signUp`. If email
confirmation remains enabled, no signup is submitted; the UI reports the setup
issue instead of claiming mail delivery. Unavailable/malformed settings fail
closed. Once auto-confirmation is enabled, a successful provider-issued session
redirects directly to the account. Failed attempts return neutral failure copy.
Settings verification and signup are separate requests: changing the provider
setting between them is a cutover race, so keep the setting stable during rollout.

Supabase auto-populates `email_confirmed_at` in this mode. It is an account state,
not proof of mailbox ownership. Existing profile creation and RLS remain in
place; roles are still explicitly granted by UUID, never by matching emails or
signup metadata. Never bootstrap an administrator from an unverified email.
The actual mailbox holder can recover an account registered with their address;
enter only an address you control. Recovery still requires working SMTP and a
valid recovery token. Disabling confirmation does not establish recovery delivery
or necessarily resolve previously pending accounts; inspect those individually,
without bulk-confirming or deleting accounts.

Read-only live settings check on this date returned HTTP 200, email enabled,
`mailer_autoconfirm: false`. No management credential/connection was available;
no provider settings or existing accounts were modified. Verify a new designated
test account, login, logout, profile and recovery after changing the setting.
Public Auth signup endpoints may reveal whether an address exists when auto-
confirmation is enabled; neutral app errors cannot hide direct provider behavior.
Provider rate limits/CAPTCHA and production transport still require verification.
