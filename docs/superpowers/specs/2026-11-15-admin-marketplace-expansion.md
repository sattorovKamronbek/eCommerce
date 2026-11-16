# Unified accounts and marketplace administration

Date: 2026-11-15. Status: **proposal for owner review; not implementation approval**.

Independent builder review identified one material missing contract: new-account
username enrollment. It is resolved below as optional post-confirmation claim for
all accounts, with no signup reservation. No further material planning question
was identified for Phase A; later commercial decisions remain explicit gates.

## Request and existing authority

The owner requested complete admin panels, email or username sign-in/signout,
coherent CS2/clothing experiences, and checks for errors and login security.
Asked which modules matter now, the owner answered that all are important:
users/roles, both catalogues, sellers, orders and payments. This confirms the
overall desired scope; it does not select seller eligibility, fees, payment
providers, custody, shipping, refunds or settlement rules.

The 2026-11-11 accounts/read-only-admin design remains the authority for existing
runtime behavior and corrective maintenance. The changes in this session repair
response privacy, session-cookie policy and outdated account-data copy within
that slice. New username infrastructure, privileged writes and commerce require
the owner's review of their contracts below.

Use only dedicated Supabase project `xevzbtivteugbqbmmtyz`. The other running
application remains untouched. No remote migration, role assignment, deployment,
mail sending or new privileged credential is part of this proposal's preparation.

## Approach

Builder recommendation: extend the existing Next.js App Router/strict TypeScript
application and dedicated Supabase project as a modular monolith, with separately
verified delivery phases. Preserve the existing en/uz/ru routes, Server Components,
small interactive forms, tokens and sample-data labels. A replacement application
would duplicate the completed frontend and accounts work. Implementing commerce
all at once would require inventing the unanswered operating rules; it is not
recommended. This technical recommendation is not recorded as an owner decision.

## Shared customer experience

One verified account UUID identifies a person in CS2, clothing, their profile and
any authorized workspace. Shared navigation, language/theme preference, access
feedback and workspace conventions connect the experiences. Keep CS2's distinct
presentation and clothing's editorial presentation. Preserve `/storefront-preview`
and the original local cart/wishlist; do not silently merge those records into
real orders or a new mixed-ecosystem basket.

```text
Marketplace -> CS2 / Clothing -> catalogue -> product/listing detail
     |
     +-> Account -> email or username + password -> profile
                        |                         |
                        +-> email recovery        +-> authorized workspace

Admin: Users | Roles | CS2 catalogue | Clothing catalogue | Sellers | Audit
Later, after commerce approval and real records: Orders | Payments | Disputes
Seller: own catalogue and, later, own fulfillment records only
```

This is a navigation contract, not approval to show inoperative operational
buttons, invented orders, balances, reviews or dashboard statistics.

## Phase A: username and account reliability

Keep email/password login, confirmed email, recovery and logout backed by
Supabase Auth. Add a separate unique username; display names remain non-unique
profile labels. Proposed initial username rule: 3–30 ASCII lowercase letters,
digits or underscores, case-insensitive uniqueness enforced in PostgreSQL.
Reject reserved administrative/system names. Both new and existing accounts
retain email login and may optionally claim a username from their profile after
confirmed sign-in. Signup does not collect or reserve one; do not infer usernames
from display names. Claiming is a narrow authenticated transaction with a database
unique constraint; competing claims have exactly one winner. Store the mapping
privately with no public/customer bulk-read privilege. First release supports
initial claim, not rename or reassignment. Recovery always uses the verified email
address.

Username authentication must never publish a username-to-email lookup. Proposed
implementation: a dedicated Supabase Edge Function resolves the private mapping
and performs normal provider password authentication, with its privileged
credential remaining in provider-managed server secrets. The Next server action
accepts the resulting session using the normal server cookie adapter. Reject
unknown/wrong/unconfirmed credentials uniformly. The function must not expose
email, role, password hashes or provider diagnostics on failed authentication.
No direct browser access to the mapping or privileged database function.
Use separate per-request resolver and unprivileged Auth clients; never reuse a
mutable privileged client across user sign-ins. Resolve user IDs privately rather
than maintaining a second, potentially stale copy of an account's email address.

Before enabling this endpoint, implement and test durable request throttling
before private lookup and CAPTCHA validation before returning an authentication
outcome. Use one provider validation of each challenge token, not an Edge check
followed by reuse of the same single-use token at Auth. Unknown usernames must
receive the same challenge/failure contract without exposing a mapping result.
Proposed challenge provider: Cloudflare
Turnstile, supported by Supabase Auth; its site/secret keys require setup. Include
the same challenge integration in email signup/login/recovery/resend as supported
by the provider before enabling provider-wide CAPTCHA, so enabling protection
does not break the existing forms. Provide accessible challenge/retry feedback.
Identify the actual deployment's trusted
client-address boundary; never trust an arbitrary submitted forwarding header.
Secrets, CAPTCHA configuration and Edge Function deployment are external setup
requirements. If unavailable, keep working email login and clearly state that
username login is unavailable; do not fake a successful login.

All identity operations remain server-only. Session cookies are HttpOnly,
SameSite=Lax and Secure under a trusted HTTPS origin. Every private action/page
verifies identity. Staged recovery/signup tokens keep their existing ten-minute
scope and are consumed only by form submission. Public email-request feedback
does not assert delivery. Verify actual SMTP, confirmation, refresh, recovery and
logout against dedicated test inboxes/accounts before public release.

## Phase B: privileged administration

Proposed permission matrix for owner review:

| Actor | Proposed authority |
| --- | --- |
| Customer | Own identity/preferences; no administrative access |
| Seller/staff | Only explicitly assigned seller resources, after Phase D decisions |
| Moderator | Review permitted catalogue content; no identity/role/financial powers |
| Administrator | Manage approved catalogue content and customer access; no owner grants |
| Owner | Assign/revoke application roles and manage administrative access |

The owner role is new; bootstrap it only through an independently verified UUID
and privileged dedicated-project operation. Never promote an existing admin
implicitly, use an email allowlist, or make the first visitor owner.

For role/access changes, require verified current authority, provider MFA and
recent authentication. Use narrow transactional database functions that validate
actor and target under RLS, enforce the role matrix, and append audit events in
the same transaction. Prevent concurrent removal of the final owner with a
transaction lock and invariant check. Explicitly review self-role changes and
owner-to-owner removal before enabling those operations. No hard-delete or
impersonation interface is proposed.

Suspension is an application access state checked by private actions and RLS,
including direct database API access. A hidden menu or stale role JWT is not an
access control. Define its effect on active seller/commerce work before those
phases launch. Audit records contain actor/target IDs, action, timestamps and the
minimum changed fields; exclude credentials, tokens and provider payloads.

## Phase C: real CS2 and clothing catalogues

Create migrations, typed server repositories and explicit ownership/RLS before
replacing samples. Shared fields: stable identifier, ecosystem, content, category,
images with approved sources, exact integer money units, ownership and
draft/published/archived lifecycle. No floating-point accounting or customer-
supplied authoritative prices.

Clothing adds SKU, size/color variants and inventory. Inventory changes use
transactional operations and authorization, never browser stock values. CS2 adds
its distinct listing attributes and provenance; user-entered fields remain
self-reported until an approved source and verification method exist. Do not
claim Steam ownership, float, market prices or delivery from unverified data.

Catalogue administration supports validation, search, filters, pagination,
draft/save/publish/archive and authorized image handling. Storage policies must
restrict upload ownership, file type/size and write scope. Do not delete the
historical samples or legacy functionality during cutover. Published records are
not automatically purchasable before approved commerce flows exist.

## Phase D: seller workspace

The owner has confirmed hybrid clothing supply: own stock plus independent
sellers. Before implementing seller onboarding, decide invitation versus open
applications, individual/business eligibility, verification, staff permissions,
moderation and listing responsibility. Then build per-seller memberships and
catalogue scopes with A/B seller-isolation tests. A seller can never view or edit
another seller's private operational records. Do not guess commission, payout,
CS2 delivery or return policies.

## Phase E: orders, payments and fulfillment

Before dependent implementation, resolve the operating entity/countries, payment
provider and actual money flow, commission, settlement/reversals/refunds, clothing
shipping/returns, CS2 trade/delivery verification, and mixed-basket rules
(`PRODUCT_REQUIREMENTS.md`, D02–D09 and D13–D14).

Once approved, use server-authoritative totals, transactional inventory
reservation, idempotent order/payment transitions, authenticated provider events,
audit/reconciliation and separate physical/digital fulfillment states. Payment
administration reads verified records; a browser redirect is not payment proof.
Visa/crypto requests are desired capabilities, not chosen integrations. No Steam
passwords, session cookies, Guard secrets, unsupported bots or custody model.

## Acceptance and rollout

Each phase gets a separate implementation plan after its contract is approved.
Run typecheck, lint, unit/database tests, production build, and relevant
desktop/tablet/mobile Playwright flows. Include denied direct requests, customer
and seller A/B isolation, forged roles, revoked access, concurrent privileged
changes, and recovery/redirect/session tests where applicable. Use real records
and provider checks for integration claims; label fixtures and gaps honestly.

The immediate proposed next delivery is **Phase A**, followed by the owner-approved
permission matrix and non-financial admin/catalogue phases. All requested modules
remain on the roadmap; unresolved operating rules gate their dependent work.
Approval of this document is not blanket authorization for remote privileged
writes or unspecified commercial policies. Record any approval and subsequent
business answers in `PRODUCT_REQUIREMENTS.md` before implementing dependencies.

Primary references checked for the proposal: [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha),
[Edge Function secrets](https://supabase.com/docs/guides/functions/secrets),
[API keys](https://supabase.com/docs/guides/getting-started/api-keys) and
[server-side session constraints](https://supabase.com/docs/guides/auth/sessions).
