# Account and administration refinement

Date: 2026-11-12. Implementation brief for the owner's request to finish accounts,
make administration usable and give the site a restrained, professional design.
The approved 2026-11-11 accounts design remains the authorization and database
contract. The choices below are builder decisions within that scope.

## Direction and constraints

Extend the current ORO design rather than replace the application. Keep the
cool-white/navy/lime palette, local fonts, existing illustrations and three
languages. Reduce oversized display type: home 36–56px, catalog 32–44px,
account/workspace 26–30px, body 14–16px. Maintain touch targets of at least 44px.
Use an image-led sign-in/register layout and a functional workspace sidebar for
profiles and admin users. Forms, tables and controls remain real HTML.

Keep the dedicated Supabase project xevzbtivteugbqbmmtyz, current authorization,
read-only administrator access, RLS and public-browsing independence. No new
schema, public role-writing endpoint, fabricated users/metrics or commerce.
Customer copy belongs in src/messages. Preserve the dirty checkout and legacy
storefront/cart; retain a credential-free source checkpoint outside the repo.

## Deliverables

- Real confirmation-resend form with translated pending, validation and neutral
  request guidance; retain non-enumerating responses, trusted redirects and email
  confirmation. No provider outcome promises actual mail delivery.
- Accessible password visibility controls, without changing submitted values.
- Shared account presentation; profile identity summary, editing and signout;
  protected admin navigation and actual profile table.
- Server-side literal display-name search and exact supported-language filters,
  deterministic pagination preserving query state, empty/error handling.
- Compact, consistent typography across the marketplace home, catalogs, details,
  information and account surfaces. Existing original-store routes remain intact.

## Approaches

Use the already-approved App Router/Supabase architecture and extend its existing
design system. A framework replacement adds migration risk without helping these
flows. Building seller/payment/admin mutation modules would require commercial
and permission decisions outside this accounts slice.

## Verification and limits

Run strict types, lint, all unit/database tests, production build, all existing
Playwright workflows and added resend/password/workspace checks. Inspect desktop
and mobile renders against generated account/admin references. Privileged page
rendering may be exercised with clearly identified SDK fixtures in component
tests; those are not live Supabase or SMTP evidence. Do not put fixtures in runtime.

Live email delivery depends on the owner's correction of Gmail SMTP 535 5.7.8.
An actual confirmed account, privileged first-admin assignment and live-provider
credentials must be available before claiming those integration workflows pass.
No secret is requested in chat or included in a checkpoint, test output or Git.
