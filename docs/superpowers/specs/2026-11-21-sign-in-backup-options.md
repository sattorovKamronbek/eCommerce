# Backup methods for VERSAX sign-in

Status is proposed for owner review.

The owner wants to sign in from another device when the primary KeePassXC
authenticator is unavailable. The owner selected all three offered options.
The existing password and authenticator sign-in remains the primary flow.

## Proposed behavior

- **Backup authenticator.** While signed in with MFA, add another TOTP
  authenticator in account security. Give it a name so it can be selected
  reliably at the sign-in challenge. Both authenticators continue to work.
- **One-time backup codes.** Generate a set from an MFA-verified session.
  VERSAX shows the codes once. A user who has already signed in with their
  password can use a saved code to complete the second step. Supabase Auth
  consumes the code and supplies the resulting session.
- **SMS verification.** While signed in with MFA, enroll and confirm a phone.
  On a later sign-in, the user can request a code for the enrolled number.
  Use Supabase Auth's phone MFA and show the option after the delivery provider
  is configured and verified. The owner's previous answer recorded that an
  SMS provider was unavailable.

Use provider-issued authorization for all three methods. Owner-only
administrator-role changes continue to require recent TOTP under the existing
database policy. Preserve the verified session through navigation and make
the current TOTP prompt reachable when that sensitive action requires it.

## Approach and rollout

Use native Supabase Auth factors so the Next.js account guard, RLS and
marketplace functions continue to rely on the provider's AAL2 claim.
VERSAX-managed recovery would require its own secret lifecycle and separate
authorization contract for all private routes and database operations.

The dedicated project's Auth API recognizes recovery codes and its PostgreSQL
schema contains the recovery-code factor type. Verify the enrollment and
verification settings and SDK support before treating this as available to app
users. Keep the existing Node.js support range unless a separately approved
runtime upgrade is required. Before enabling SMS, select an SMS provider and
verify delivery in a designated test account. The contact verification workflow
for profile reviews is separate from sign-in.

Validate TOTP enrollment and selection, backup code display and one-time use,
SMS enrollment and challenge, account isolation, denied AAL1 access, migration
and deployment compatibility, and the recent-TOTP checks on existing owner
actions. Browser cases cover separate sessions and locales.
