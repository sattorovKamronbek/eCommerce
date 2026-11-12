# Account workspace refinement implementation plan

> **For agentic workers:** Use executing-plans to implement the bounded tasks in
> this session. Preserve prior uncommitted work; do not commit or deploy it.

**Goal:** Finish the approved accounts UI and read-only users workspace with
restrained typography and useful, real controls.

**Architecture:** Keep Next.js App Router Server Components and existing
Supabase authorization. Isolate form interactivity in AccountForm. Server-side
profile queries use the user's authenticated client and existing RLS.

**Tech Stack:** Existing strict TypeScript, Next.js, React, shadcn, Supabase,
Vitest, embedded PostgreSQL and Playwright; no new dependency.

**Spec:** ../specs/2026-11-12-account-workspace-polish.md

## Global constraints

- Dedicated project xevzbtivteugbqbmmtyz only; no database/schema changes.
- Read-only admin users; real identities, no fabricated business data.
- All customer copy in src/messages, en/uz/ru.
- Preserve existing uncommitted changes and original storefront functionality.

## Review focus

- Search wildcard characters must be literal, never broaden a private query.
- Invalid/repeated parameters must be bounded; pagination must preserve filters.
- Unauthenticated/customer access must remain denied before profile queries.
- Resend must not reveal account existence or claim delivery on provider failure.
- Password visibility must preserve values and native form submission semantics.

### Task 1: Complete account controls

Files: account/actions.ts, components/account/form.tsx, messages/account.ts;
new account/resend-confirmation/page.tsx; existing action/component tests.

- [x] Add and run failing resend action and password visibility regressions.
- [x] Implement provider-backed resend, non-enumerating feedback, existing trusted
  redirect, all translated labels and visibility controls.
- [x] Run action/form tests, confirming neutral provider outcomes and truthful guidance.

### Task 2: Real read-only administration search

Files: new lib/auth/admin-users.ts and tests; admin/users/page.tsx.

Interfaces: parseAdminFilters(query) returns bounded page, literal search text and
supported language; adminUsersHref(locale, filters, page) preserves query context;
loadAdminProfiles(client, filters) uses the current authenticated Supabase client.

- [x] Add and run failing query-boundary, literal-search and pagination tests.
- [x] Add validated, deterministic, 20-row + lookahead server query.
- [x] Render actual profiles, meaningful empty/error states and filter form only
  after requireAdmin; test authorization and rendered states with SDK fixtures.

### Task 3: Consistent account/workspace and marketplace presentation

Files: account shell/entry, new workspace component/styles, account/page.tsx,
admin/page.tsx, marketplace/styles.css and localized copy.

- [x] Extract design tokens, spacing and type from generated references.
- [x] Implement split account entry, profile/workspace navigation, data table,
  compact typography and responsive layout using the existing primitives.
- [x] Inspect desktop/mobile screenshots, exercise visibility/resend and retained
  marketplace flows; fix observed layout/accessibility problems.

### Task 4: Verification and record

- [x] Run npm run check and all Playwright projects against the new build.
- [x] Review the entire change; preserve external provider limits honestly.
- [x] Update PROJECT_PROGRESS.md with commands, results and live-auth limitations.

## Execution record

- Baseline: 53 tests in 9 files passed.
- Source checkpoint: /home/kamron/.codex/artifacts/ecommerce-polish-20261112/source-before.tar.gz
  (164 files, credential-free), with SHA-256 manifest in source-before.json.
- Work in place: the authorized accounts implementation is uncommitted and needed
  for these refinements. Preserve it rather than create an incomplete clean checkout.
- SMTP correction and target administrator email requested asynchronously; all
  independent local implementation and verification continues.

- Task 1/2: initial new controls/query tests failed before implementation; 23 targeted
  cases then passed. Literal-search review identified the PostgREST asterisk alias;
  its failing request regression was fixed with escaped regexIMatch. All 12 query
  and embedded-PostgreSQL cases passed afterward.
- Task 3: all nine first-pass browser captures passed axe, image/overflow, page and
  console checks. Protected admin captures were explicitly labelled isolated
  component fixtures; no application authorization bypass exists.
- Final review: one material finding, address-dependent resend responses could
  reveal pending accounts. Confirmed against upstream Supabase source. The new
  regression failed, then all 19 targeted action/form cases passed after neutral,
  non-delivery-promising guidance for all provider outcomes. Retry stays available.
- Final integration limit: owner confirmed SMTP credentials are still rejected.
  Intended owner administrator SQL prepared outside Git and NOT executed; no
  privileged connection or confirmed account session available.

- Final checks: npm run check passed (65 cases, 73 generated pages). The first
  browser attempt identified a test-only callback/cookie host mismatch; all three
  targeted cases passed after aligning the test server origin. The fresh full
  Playwright run then passed all 60 cases in 5.2 minutes with zero retries.
  Typecheck/lint were rerun after the test configuration fix and passed.
