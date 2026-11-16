# Unconfirmed customer accounts and owner-controlled roles

Date: 2026-11-16. Status: **design proposal; no runtime or remote changes made**.

## Confirmed outcomes and existing state

The owner wants new customers to sign in with their email and password without
first confirming their email, and only the site owner to manage roles. The owner
also selected that administrators can manage products and user status, while
moderators can review. Blocked users must not access private or trading
functions; independent clothing sellers apply and require administrator approval.
Exact moderation actions remain open. The
current application requires provider confirmation for signup, profile creation,
private routes and the read-only administrator panel. The current administrator
role is assigned out of band; there is no owner role or role-management UI.

## Design choices and trade-offs

Keeping confirmation for all users preserves the current evidence of email
control but conflicts with the owner's requested signup experience. Disabling
Supabase confirmation alone provides immediate sessions but Supabase implicitly
sets `email_confirmed_at`, so existing checks cannot distinguish an actually
verified mailbox from one entered by an arbitrary registrant. This is especially
unsafe for privilege checks and email-based recovery. The recommended approach
is to allow limited customer accounts without mailbox proof, while keeping
separate, independently verified authorization for privileged operations.

An unverified email is a login identifier, not evidence that the user controls
that mailbox. A person can register someone else's address; the real mailbox
holder may later recover that account. Until an independently verified identity
is available, no workflow should rely on the email address as evidence of
ownership, grant sensitive authority, or promise that an account cannot be
claimed through mailbox recovery. This residual risk must be made clear when
designing real financial and seller workflows.

## Implementation contract to resolve before rollout

- Distinguish existing genuinely verified accounts from accounts created after
  provider auto-confirmation is enabled. Do not treat provider
  `email_confirmed_at` or client-controlled metadata as proof after the change.
  Design a migration and cutover that avoid falsely upgrading existing pending
  accounts, races between writes and rollout, or lost access for existing users.
- Provision the owner through a separately verified provider UUID and controlled
  privileged operation, never a first-visitor rule, public signup metadata or
  email allowlist. Determine the exact safe bootstrap and recovery process with
  the owner. Require strong MFA and recent authentication for owner role changes;
  enforce authority in the database and server, including direct API requests.
- Design owner/admin/moderator permissions, transactional role changes, audit
  records, revocation and a final-owner invariant before exposing any role write.
  Existing administrators must not become owners automatically.
- For the selected user-blocking behavior, store an authoritative access state
  that private server actions and RLS check on each request, so an already
  issued session cannot bypass a new block. Keep public browsing and a safe signout
  path available. Specify support/recovery, audit and any exceptions before
  enabling writes; do not call it an Auth-provider ban unless it actually is one.
- Independent clothing sellers submit an application for administrator review.
  Define application fields, eligibility, rejection/reapplication and seller
  responsibilities before creating the workflow. Approval must grant only the
  approved seller's resources, with isolation tests for separate sellers; it
  must not imply permission to process payments or settle funds.
- Review provider signup response differences, direct Auth endpoints, abuse
  controls and rate limits when confirmation is disabled. App-level neutral
  messages alone cannot hide provider responses from direct API clients.
- Keep recovery dependent on actual mailbox access and retain token expiry,
  session revocation and neutral responses. The previously reported SMTP failure
  must be fixed and real delivery tested; otherwise password recovery is not a
  working service. Avoid exposing account data in logs or client-side secrets.
- Use a dedicated Supabase project (`xevzbtivteugbqbmmtyz`) only. Implement
  migrations and RLS together with server checks and meaningful local database
  tests. Validate two customer identities, direct API denial, owner MFA,
  escalation attempts, revoked access, recovery and concurrent role updates.
  Run live integration checks only against designated test identities and the
  dedicated project. Provider configuration, migration and app deploy must be
  coordinated; no step alone establishes a secure end-to-end system.

## Other requested work

The owner wants skin and fashion experiences with selectable themes and more
complete administration and automation. A separate visual concept is being
developed; product and transaction records remain explicitly marked as samples.
Seller eligibility, CS2 delivery/custody, payment provider, money flow, fees,
shipping and refund rules remain open in `PRODUCT_REQUIREMENTS.md`. Do not build
dependent live commerce or imply functionality that is not connected.

References: [Supabase Auth general configuration](https://supabase.com/docs/guides/auth/general-configuration),
[Supabase password authentication](https://supabase.com/docs/guides/auth/passwords).
