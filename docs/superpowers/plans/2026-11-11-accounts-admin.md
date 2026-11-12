# Accounts and Initial Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Real Supabase email/password accounts, editable personal profiles and a server-authorized read-only admin users list.

**Architecture:** Keep public sample browsing static/independent. Add localized account/admin Server Components, small server-action form islands, cookie-based Supabase SSR and additive RLS-protected migrations in a dedicated project.

**Tech Stack:** Existing strict TypeScript/Next.js 16/React/shadcn, Supabase JS/SSR, Vitest/Playwright and embedded PostgreSQL for migration/RLS tests.

**Spec:** `docs/superpowers/specs/2026-11-11-accounts-admin-design.md`, approved by the owner on 2026-11-11.

## Global Constraints

- Preserve existing runtime and pre-existing uncommitted changes; no destructive operations, deployment, push or unrelated commits.
- Customer text in `src/messages`; brand configuration in `src/lib/config.ts`.
- No fake authentication, orders, payment confirmations, ratings or business metrics.
- Additive migrations, RLS and server authorization; no service-role credentials in application runtime.
- Dedicated project `xevzbtivteugbqbmmtyz` confirmed by owner; do not touch the other live application's database.
- No provider/RLS/email verification claims based only on SDK mocks.

## Review Focus

- Untrusted redirect input must never navigate to another origin or malformed path.
- A customer must not gain admin or edit protected profile columns through a direct API request.
- An ordinary login session must not be accepted as password-recovery proof.
- Confirmation links opened by email scanners must not consume tokens before user submission.
- Missing credentials, migrations and provider failures must leave public browsing usable and display honest localized failures.

## Files and contracts

- `supabase/migrations/202611110001_accounts.sql`: profiles, administrator assignments, verification-aware profile trigger, least-privilege grants/RLS.
- `supabase/tests/accounts.test.ts`: execute the real migration and policies in embedded PostgreSQL using simulated JWT identity settings, clearly distinct from live Auth validation.
- `src/lib/supabase/{config,server,proxy,database}.ts`, `src/proxy.ts`: typed environment validation, request-local client, token refresh, private-cache headers.
- `src/lib/auth/{validation,flow,access}.ts`: validation/allowlisted paths, temporary confirmation-token transport, verified identity/admin access.
- `src/lib/auth/*.test.ts`: hostile redirect/config/validation cases, action and authorization failures.
- `src/app/(marketplace)/[locale]/account/actions.ts`: provider-backed server mutations; typed message-code results.
- `src/app/(marketplace)/[locale]/account/{page,login/page,register/page,forgot-password/page,reset-password/page,confirm-email/page}.tsx`: localized account flow.
- `src/app/(marketplace)/[locale]/auth/confirm/route.ts`: stage provider token in a short-lived HttpOnly cookie, clear query using a local redirect; verification on explicit POST.
- `src/app/(marketplace)/[locale]/admin/{page,users/page}.tsx`: independently protected admin entry/list with bounded deterministic pagination.
- `src/components/account/{form,shell}.tsx`, `src/messages/account.ts`: accessible action forms, common server presentation, complete en/uz/ru copy.
- Existing frame/layout, `/hisob`, localized dictionaries/styles: account links and consistent visuals without public-user fetching.
- `.env.example`, ignored `.env.local`, `docs/ACCOUNTS_SETUP.md`, README/progress/requirements: concrete connection, migration, email templates, first-admin bootstrap and evidence.
- `tests/e2e/accounts.spec.ts`: unavailable configuration, translated forms and private access denial; real-provider workflows separately gated by explicit test-project configuration.

### Task 1: Database identity and permissions

**Interfaces:** Produce `marketplace_profiles(id, display_name, preferred_locale, created_at, updated_at)`, `marketplace_user_roles(user_id, role, created_at)` and zero-argument `marketplace_private.is_admin()`; typed `Database` consumed by Tasks 2–3.

- [x] Install Supabase runtime SDKs and embedded PostgreSQL test dependency; include `supabase/tests/**/*.test.ts` in Vitest.
- [x] Write database tests for fresh migration, verified-only profile creation/backfill, invalid metadata, anonymous denial, A/B isolation, own allowed edits, protected-column denial, admin read, role escalation denial and immediate role revocation.
- [x] Run tests before migration exists; observe failure.
- [x] Implement additive migration and generated-shape TypeScript database types.
- [x] Run `npx vitest run supabase/tests/accounts.test.ts`; expect all policy tests pass.

### Task 2: Provider integration and verified action boundaries

**Interfaces:** `getAuthConfig(): AuthConfig | null`, `createServerSupabaseClient()`, `requireAccount(locale)`, `requireAdmin(locale)`, `safeReturnPath(input, locale)`, account actions `(previous: AccountState, form: FormData): Promise<AccountState>`; consumed by Task 3.

- [x] Write failing config/input/redirect tests, including secret key rejection, absent trusted origin, encoded/protocol-relative redirects and password constraints.
- [x] Implement validated configuration, request-local SSR client, scoped Next proxy and explicit no-store/referrer headers.
- [x] Write failing provider-action tests: signup confirmation flow, generic recovery response, invalid credentials, rejected role/profile writes, no recovery without a recovery token, expired/invalid provider token and provider error handling.
- [x] Implement actual server actions and verification helpers; stage confirmation/recovery tokens in expiring HttpOnly cookies, consume only on POST, never infer recovery from a signed-in session.
- [x] Run targeted auth tests; expect pass. Keep provider errors out of customer output/logs.

### Task 3: Localized account/profile/admin surfaces

**Interfaces:** Consume Task 2 actions/access helpers and Task 1 types. Produce all routes in the file map, `accountDictionaries: Record<MarketplaceLocale, AccountMessages>`, account navigation and legacy account bridge.

- [x] Write failing browser tests for account navigation, three locales, honest unconfigured behavior, no private content on direct account/admin access and invalid confirmation link handling.
- [x] Implement small `useActionState` form island using existing Field/Input/Button/Alert; server-render headings, links and data.
- [x] Implement account routes/profile editing and admin entry/users list, checking verified current identity and current DB role on each protected request/action; page size 20, stable created-at/id ordering, validated page 1–10000.
- [x] Keep samples and old cart unchanged; update `/hisob` explanatory copy and link rather than silently merging browser data.
- [x] Verify rendered keyboard/mobile behavior, translated errors, contrast and public regressions with production Playwright.

### Task 4: Integration handoff and evidence

**Interfaces:** Consume all prior tasks. Produce reproducible setup and verification record without claiming external checks that could not run.

- [x] Prepare ignored local environment with confirmed public project URL, blank publishable key and trusted local origin. Ask for connection/key configuration while continuing independent work.
- [x] Document versioned migration application, signup/recovery email templates using token hashes, exact allowed redirects, SMTP/test limitations, safe first-admin UUID bootstrap and role revocation/recovery.
- [x] Add opt-in provider tests that require an explicitly dedicated test project and secure test-user configuration; ordinary test runs must not write to a remote project.
- [x] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, then relevant/full existing Playwright suites sequentially. Expect all locally runnable checks pass.
- [x] Request one fresh whole-change review; address material findings and rerun the affected checks.
- [x] Update requirements, progress, approved design/plan and limitations; verify preserved files and `git diff --check`.

## Execution outcome — 2026-11-12

All local implementation tasks and checks completed: 50 unit/component/database
tests, clean types/lint, successful production build, 54 production browser cases
and three inspected visual states. Independent review findings were reproduced
and fixed. See PROJECT_PROGRESS.md and the external execution ledger/evidence.

Remaining integration acceptance, not claimed complete:

- [ ] Owner confirms email templates/redirects and actual delivery.
- [ ] Real signup, explicit confirmation, login/logout and recovery/reset exercised.
- [ ] First administrator bootstrapped using the verified owner UUID; authenticated
  admin/user journeys and live role revocation verified.
- [ ] Optional real-provider A/B authorization script executed with dedicated
  confirmed test accounts; no fabricated or real-customer credentials substituted.

## Execution decisions

The user explicitly approved coding and selected the scope; no further process-choice approval is needed. Execute inline in the current feature checkout, preserving its dirty baseline. Do not create a worktree without consent or commit unrelated earlier work. Keep the execution ledger/evidence outside tracked application files.
