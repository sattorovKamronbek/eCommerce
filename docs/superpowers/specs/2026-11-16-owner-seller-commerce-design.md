# Owner, seller workspace and path to real commerce

Date: 2026-11-16. Status: **owner requested implementation; phased work in progress**.
The owner asked for the code on 2026-11-16 after review of this design. Previously
unresolved business decisions and external provider setup remain open.

## Intent and existing state

The owner wants `sattorovkamronbek2@gmail.com` to be the principal owner, seller
accounts with CS2-only, clothing-only or both scopes, useful seller listing tools,
and genuine customer purchasing in place of sample items. The existing application
has real Supabase authentication and a read-only admin user list, but its only
privileged database role is `admin`; its public catalog is static sample data and
there is no real seller, inventory, order or payment system. The owner reports that
the intended account exists and they can access SQL Editor in the dedicated project
`xevzbtivteugbqbmmtyz`. This report does not verify an account UUID or grant access.
The separate live application's project must never be touched.

## Approaches

1. Build and launch identity, catalog, checkout, payment and fulfillment together.
   This requires decisions and a payment provider that do not yet exist and makes
   a safe end-to-end launch dependent on all of them at once.
2. Extend the current Next.js and Supabase application in verified phases: first
   establish owner authorization, seller approval and real catalog management;
   then introduce orders, fulfillment and payments once their operating rules and
   provider capabilities are settled. This is the recommended technical approach.

Neither approach invents a Steam custody model or treats a user's email string as
proof of mailbox control. Each phase preserves the existing application and can
be verified before the next. The implementation follows the second approach.

## Owner and authorization

- Add an explicitly distinct owner role. Only an independently verified account
  UUID may be bootstrapped through a privileged operation in the dedicated project;
  neither signup email nor provider auto-confirmation alone is proof of control.
  Never auto-promote existing admins. Provide a reviewable, idempotent procedure,
  exact checks, audit trail and recovery plan before any live grant.
- Existing `marketplace_user_roles` permits only one `admin` row per user, and
  current server and RLS checks recognize only that role. The owner must be able
  to access administrator functions without breaking existing administrators;
  define and test a migration and matching authorization rules before rollout.
  Seller membership and approved category scope are separate from platform roles.
- Independently verify that the person performing bootstrap controls the exact
  authenticated account UUID and its recovery and MFA factors. SQL Editor access,
  a matching email and `email_confirmed_at` alone do not prove ongoing account
  control; refuse the grant when verification is inconclusive.
- Only the owner may manage application roles. Administrators may manage products
  and user status and approve sellers; moderators may review. Blocked accounts
  lose private and trading access. Define narrow actions and enforce permissions
  in server code and database policies, including direct API access.
- Role mutation must require strong MFA and recent authentication, audit changes
  transactionally, protect the last owner and respond to revocation immediately.
  Enforce these requirements at every privileged server and database/RPC path,
  using trusted provider-verified session evidence; fail closed where it cannot be
  established. Confirm provider MFA, session and recovery capabilities first.
- Unconfirmed email signup remains the requested customer experience; it does not
  authenticate ownership of an email inbox. Seller and privileged onboarding must
  account for recovery and impersonation risk. Existing broken SMTP/recovery and
  live authentication checks remain launch blockers until actually verified.

## Seller and catalog phase

- Individuals and companies may apply; every prospective seller requires administrator approval. Approved
  scope is CS2 only, clothing only or both. Enforcement occurs on the server and
  in database authorization, not solely by hiding interface controls. Changes to
  scopes and seller access must be audited; the exact actor and procedure for
  scope changes require confirmation alongside the existing role policy.
- The owner requested all important application information. Proposed initial
  fields are applicant type, individual or company name, contact details,
  operating area and requested categories, plus company registration details
  for companies. Admin reviews applications; seller approval and publication are
  separate actions. The owner selected administrator contact and secure checking
  of identity documents outside the site; the actual verification and retention
  procedure, including reliable binding to the applicant account, remains open.
  Do not collect identity documents in the application form.
- The seller workspace should provide a clear draft-to-publication workflow,
  editing and archiving, image upload, search and category-specific fields. For
  clothing, variants and exact stock quantities must be represented without
  implying availability that has not been established. For CS2, only information
  actually supplied or verified should be shown, with unverified claims identified;
  do not invent ownership, Steam item data, market prices or transfer eligibility.
- Seller private records and write operations must be isolated by seller. Validate
  uploads, enforce ownership and storage policies, and keep unauthorized files
  private. Public catalog reads only published listings; money uses integer minor
  units, with server-side validation. Exact application fields, identity/business
  verification, listing moderation, allowed categories and image/data rights are
  open decisions, not silent defaults.
- Once a seller is approved, the owner wants that seller to publish new products
  immediately without per-product preapproval. Server validation and category
  restrictions still apply, and administrators retain product management powers.
  Detailed removal, complaint and audit procedures remain to be defined.
- Applicants can correct pending or rejected applications and resubmit for admin
  review. Preserve past decisions and reject reviews made against an older version
  of the application so changed information is never silently approved.
- Admins can reopen an erroneous approval or rejection with an audited decision.
  Reopening must atomically remove any seller authority when such authority exists;
  the present application-intake phase grants no seller authority. Audit records
  preserve the reviewed scope and scope revisions, but not historical copies of
  all contact information or independent identity evidence.
- The existing sample catalog stays visibly labeled until replaced with real
  records. A real catalog can show an honest empty state; it cannot claim items
  are purchasable before the purchase workflow works. Retain the legacy preview
  route and preserve existing behavior while switching deliberately to real data.
- Add migrations rather than editing applied migrations, RLS, explicit grants,
  server authorization and meaningful direct-access and seller-isolation tests.
  Use transaction-safe inventory before accepting real orders.

## Customer orders, payment and fulfillment

The owner selected the following product rules:

- CS2 supports direct-to-seller payment and a platform-received payment path.
  Administrators can see transactions. For direct payment, buyer or seller reports
  payment and an administrator checks it; a report is not proof of payment.
- Seller initially delivers the CS2 item. Seller and buyer each confirm delivery.
  For platform-received money, seller payout follows both confirmations. If either
  party does not confirm or objects, do not release payout and have an admin review.
  The site cannot hold money already transferred directly to a seller. Future
  site-mediated delivery is only an ambition, with no approved integration/custody.
- The owner answered "seller" when asked who receives clothing payment and who
  delivers; the working interpretation is seller for both, subject to correction.
  Hybrid clothing supply remains intended; own-stock operations are unspecified.
- No platform commission for now. Visa is desired and crypto was mentioned as a
  later capability, but no provider, banking contract or crypto model is selected.

Before enabling actual purchases, settle provider and operating-entity feasibility,
payment evidence and manual review, payout/reversal and refund obligations, CS2
delivery/dispute evidence, clothing shipping and returns, and multi-seller basket
rules. Platform custody or holding of funds cannot be assumed to be available:
the chosen provider and operating model must support the exact flow. Orders and
totals must be server-authoritative; inventory reservation must be transactional;
verified provider events and idempotency must govern payment status. Admin views
show actual records and distinguish manual reports, reviews and verified events.
No fabricated orders, payments, seller balances, reviews or business metrics.

## Verification and rollout

Each phase needs a separately reviewable implementation plan, migration and
rollback strategy. Test anonymous, customer, seller A/B, moderator, administrator,
owner and blocked access, including direct database APIs and concurrent changes.
Test real seller product lifecycle, upload isolation, stock concurrency and
event/idempotency behavior as those features are introduced. Run typecheck, lint,
unit/database tests, production build and relevant Playwright workflows. Verify
actual provider sessions, owner MFA, real email recovery and any selected payment
provider separately; local tests cannot establish live readiness.

No remote migration, owner grant, provider change or deployment is performed by
this draft. Record evidence and outstanding limitations in `PROJECT_PROGRESS.md`.
