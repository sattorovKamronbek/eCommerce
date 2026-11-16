# Accounts and initial admin workspace

Date: 2026-11-11. Status: owner approved detailed design and instructed coding to begin.
The owner has selected the phased approach and confirmed the initial feature set;
this document makes its implementation and acceptance boundaries reviewable.
Independent read-only builder check completed: no important unanswered planning
questions. Owner approval received on 2026-11-11. The owner subsequently confirmed
that project `xevzbtivteugbqbmmtyz` is newly dedicated to this marketplace.

## Intent and confirmed decisions

Move beyond the frontend preview with real customer accounts and an initial admin
workspace, while preserving both marketplace ecosystems and the original store.
The owner asked to make the site functional, including accounts and administration,
and selected this first delivery: email/password registration, email confirmation,
password recovery, profiles and an administrator-only users list. Seller operations
and a real catalog follow in later phases.

The owner has a Supabase project, but it serves another application that is still
running. Its database, users, auth settings and integrations must remain untouched.
Builder recommendation: a separate Supabase project for this application, within
the existing account if available. A new account is not an implementation
requirement. No new remote project has been created or connected.

## Approaches

1. **Selected:** deliver accounts and the initial admin workspace first, verify
   them independently, then address sellers/catalog and commerce in later slices.
   This provides usable identity without inventing seller or payment rules.
2. Build accounts, sellers and commercial workflows together. This would depend
   on unresolved commission, fulfillment, custody, payment and reversal decisions;
   it was not selected for the first slice.

Supabase remains the selected backend direction. Replacing it with custom identity
infrastructure would add work without an owner requirement.

## Existing code and constraints

- Next.js 16 App Router, React, strict TypeScript, Tailwind and existing shadcn
  components. There is no auth SDK, session validation, database or admin route.
- `src/app/(marketplace)/[locale]/layout.tsx` provides the three-language document
  and marketplace frame. Public catalogs are currently rendered from samples.
- `src/components/marketplace/frame.tsx` owns navigation/theme client behavior.
  Keep public browsing independent of auth availability; do not make every catalog
  request fetch the current user merely to render a personalized header.
- `/hisob` is an informational placeholder in the old storefront. Keep it
  reachable and replace obsolete account-unavailable text with navigation to the
  real localized account flow. Preserve legacy catalog/cart/wishlist functionality.
- Customer copy stays in `src/messages`; shared brand defaults in
  `src/lib/config.ts`. Preserve Uzbek, Russian and English.
- The checkout contains pre-existing uncommitted frontend/documentation changes.
  Preserve them; no history rewriting, resets or destructive database operations.

## Customer behavior and routes

Proposed route names are implementation choices, not business decisions:

| Route | Behavior |
| --- | --- |
| `/{locale}/account` | Verified user's profile, or a local sign-in redirect |
| `/{locale}/account/register` | Name, email, password; real Supabase signup |
| `/{locale}/account/login` | Real password sign-in; errors and pending state |
| `/{locale}/account/forgot-password` | Non-enumerating recovery-request response |
| `/{locale}/account/reset-password` | Password change using a valid recovery flow |
| `/{locale}/auth/confirm` | Validate email token and complete confirmation/recovery |
| `/{locale}/admin` | Administrator entry with users navigation |
| `/{locale}/admin/users` | Paginated list of this application's profiles |

Flow sketch:

```text
Account link -> Sign in <-> Register -> Check email -> Confirm -> Profile
                   |
                   +-> Forgot password -> Email -> Reset -> Sign in

Verified admin -> Admin -> Users
Other customer -> Profile; direct admin access denied
```

Sign-in/logout and profile changes use server-side operations with validated
inputs. Profile editing is limited to display name and preferred supported locale.
Email and password are not editable profile columns. Signout clears the session
and invalidates private pages. Invalid, expired or already-used confirmation and
recovery links yield a translated failure and a retry path.

Recovery links must establish a verified recovery flow; an arbitrary signed-in
session must not be treated as proof of recovery. Login return paths are limited
to explicitly allowed local destinations. Do not accept arbitrary redirect URLs.
Registration and recovery messages avoid revealing whether an email is registered.
No passwords, tokens or provider payloads enter logs or URLs beyond the provider's
required confirmation-token transport.

Forms have associated labels, appropriate autocomplete, keyboard focus, accessible
error/pending feedback and disabled duplicate submission. Retain existing visual
tokens rather than redesigning the application.

## Identity and authorization

- Use `@supabase/supabase-js` and `@supabase/ssr`, with separate server/browser
  clients only where needed. Use Next.js 16 `proxy.ts` for auth-route session
  refresh. Protected Server Components, actions and database policies each enforce
  access; the proxy or a hidden navigation link is not the authorization boundary.
- Verify session identity with the provider. Never authorize with an unverified
  `getSession()` user object or with Zustand/localStorage/browser-submitted roles.
- Private/auth responses must not enter shared caches. Limit cookie refresh to
  account, auth and admin routes so static sample browsing remains independent.
- Initial application roles: customer and administrator. Every new signup is a
  customer. Seller/moderator/staff roles remain for the separately designed phase.
- Store admin assignments in a protected database table. Check current role rows
  on privileged access so role removal does not wait for stale JWT claims.
- No public role-writing API, role selector at signup, first-user-is-admin logic
  or email-only admin allowlist. The first administrator is bootstrapped using the
  verified account UUID through a documented privileged database operation.
- Authenticated customers cannot read another profile, modify roles or enter admin
  routes. Anonymous callers cannot read private rows. Admin access is read-only in
  this slice: no banning, deletion, impersonation or role-management UI.

## Database contract

Versioned additive migrations under `supabase/migrations`, applied only to the
dedicated application project after its identity and existing schema are checked.
Do not reuse the other application's database or enable auth triggers there.

- `marketplace_profiles`: auth-user UUID primary key, bounded display name,
  supported preferred locale, server-generated creation/update timestamps.
- `marketplace_user_roles`: auth-user UUID, constrained administrator role and
  server-generated assignment timestamp; uniqueness and foreign keys enforced.
  Absence of an admin assignment means customer; clients cannot grant themselves
  or other users privileges.
- Profile creation is server-controlled for each new verified identity; safely
  handle confirmation timing, retries and any accounts registered in the dedicated
  project before the migration. Display name from signup metadata is untrusted
  input and must satisfy database constraints before insertion.
- RLS and explicit grants are present from table creation. Users read/update their
  own profile with column-limited write privileges. Admins read all application
  profiles, without passwords, tokens or unrelated `auth.users` records. Signup
  and profile editing cannot write UUID, timestamps or role assignments.
- No service-role credentials are required in the application runtime for this
  read-only admin slice. Privileged migration/bootstrap credentials stay outside
  Git and outside browser code. Document a privileged recovery procedure for an
  unavailable/misassigned first administrator.

The users list shows real application profile identifiers, display names,
preferred language and creation dates. It does not claim to expose every Supabase
Auth account, verified identity, seller status, revenue or other business metrics.
Order pagination deterministically; bound page size and validate page parameters.

## Configuration and external dependencies

The owner needs to supply/connect the dedicated project. Required public runtime
settings: `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or a deliberately supported legacy anon
key). Keep actual values in ignored local/deployment environment configuration.
Use an explicitly configured trusted application origin for email redirects;
do not derive it from an unchecked request Host header.

Configure the dedicated project's site URL, exact allowed auth redirect URLs,
password policy and email confirmation. Public-user email delivery needs the
project's email/SMTP setup and an end-to-end delivery check; do not equate the
provider's limited development email service with production readiness.

No secret should be pasted into chat. A Supabase integration has been suggested
but its installation/connection is not confirmed. Local Docker is installed but
the current user cannot access its socket; neither Supabase CLI nor psql was found
on PATH during discovery. These are test/setup limitations, not grounds to modify
the other live application's project.

If required configuration is absent, auth/admin surfaces clearly report
unavailability and do not simulate signup, login or database writes. Public sample
browsing continues. Missing migrations, provider outages and denied permissions
produce actionable translated errors without exposing internal details.

## Delivery and verification

1. Review this design; prepare implementation plan and preservation baseline.
2. Implement migration/RLS and actual provider-backed account flows.
3. Implement profile and protected read-only admin users surfaces.
4. Verify and record exact evidence and remaining deployment dependencies.

Required acceptance evidence:

- Strict typecheck, lint, unit tests, production build and relevant Playwright
  workflows, including existing public and legacy browsing regressions.
- A clean migration application and independent database authorization tests:
  anonymous denial, customer A/B isolation, permitted self-profile updates,
  immutable profile identifiers, denied role escalation and current admin access.
- Real-provider signup, confirmation, login, session refresh, logout and recovery;
  failed/expired links, invalid credentials and open-redirect attempts rejected.
- Admin direct requests denied for anonymous/customer sessions; admin pagination
  works against actual rows; removing admin access takes effect immediately.
- Localized keyboard/error feedback, mobile layouts and accessibility checks.
- Tests can use mocks for isolated SDK failure branches, but these do not count as
  proof of provider, email or RLS integration. Report integration checks blocked by
  missing infrastructure as unverified, without inventing a successful result.

## Later work and remaining owner decisions

This is the first part of the owner's broader request, not a declaration that
the marketplace is complete. Seller onboarding/policies and catalog ownership
come next. Published inventory, seller isolation, images, moderation and catalog
admin actions require their own reviewed contract. Orders, shipping, commission,
payment provider, CS2 custody/trade verification, refunds and payouts remain gated
by the unanswered decisions in `PRODUCT_REQUIREMENTS.md`.

No fake auth, sample users disguised as customers, checkout confirmations, sales
metrics, wallets, escrow, trading bots or unsupported Steam integrations.

## Primary references checked during discovery

- [Supabase server-side clients and Next.js session refresh](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase password-based auth](https://supabase.com/docs/guides/auth/passwords)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase roles and permissions](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)

The design chooses current database role checks rather than requiring a custom
JWT hook for the first read-only admin slice.
