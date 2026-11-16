# Owner and seller marketplace implementation plan

> **For agentic workers:** Use the executing-plans workflow and verify each phase before continuing.

**Goal:** Establish real owner authorization and an isolated seller/catalog foundation, then implement only commerce flows whose operating decisions and provider capabilities are established.

**Architecture:** Extend the existing App Router and dedicated Supabase application with additive migrations, database-enforced isolation and server-only actions. Keep sample inventory visibly identified until a real catalog replaces it; never mark an unverified payment as paid.

**Tech stack:** Next.js, strict TypeScript, PostgreSQL/RLS, Supabase Auth, Vitest/PGlite and Playwright.

**Spec:** `docs/superpowers/specs/2026-11-16-owner-seller-commerce-design.md` (approved for implementation in the owner's request on 2026-11-16; unresolved provider and policy decisions remain gates).

## Global constraints

- Only `xevzbtivteugbqbmmtyz`; never change the other live project.
- Preserve uncommitted/user work, existing accounts, admin and the legacy preview.
- Distinguish email identifier from independent ownership verification; no email-based privilege grant.
- Keep private data isolated with RLS and server authorization; use exact integer money units.
- Do not imply that demo content, orders, payments or transfers are real.
- Run typecheck, lint, unit/database tests, production build and relevant Playwright workflows; document evidence.

## Review focus

- Unverified account or forged metadata must never become owner or seller through signup.
- Cross-seller and anonymous direct API access must not reveal or mutate private records.
- Revoked or blocked identity must not retain access via an old session.
- Concurrent changes must not manufacture stock or settle a payment twice.
- Existing admin and sample frontend functionality must continue during phased rollout.

## Phase 1 — seller application foundation

**Files:** New migration `supabase/migrations/202611160001_seller_applications.sql`, real database tests `supabase/tests/seller-applications.test.ts`, localized copy and seller application route/actions.

- [x] Write and run failing database tests covering self-only application submission, individual/company and category validation, anonymous denial, admin-only review and privilege escalation denial.
- [x] Implement additive application schema, narrow grants and RLS; make admin review transactional and audit changes. Never enable seller listing authority solely from applicant input.
- [x] Write failing validation/form tests; implement server validation, localized form and actionable status handling, including corrections and audit of changed scopes.
- [ ] Verify targeted tests, typecheck, lint and browser behavior, then execute the migration only after dedicated-project readiness is established.

## Phase 2 — owner and seller/catalog

- [ ] Define safe privileged owner bootstrap and recovery with independently verified UUID, authenticated session and MFA. Preserve existing admin access; never use a public email allowlist.
- [x] Add the owner role locally, preserving existing administrator reads without granting any user the role or enabling role-management writes.
- [ ] Test and implement independently approved seller scopes and own-resource-only catalog operations; verify direct API isolation, blocked users, concurrent inventory and upload restrictions.
- [ ] Replace sample catalog only after real listing lifecycle and empty/error states work; retain the legacy preview and keep purchase unavailable until commerce is ready.

## Phase 3 — commerce

- [ ] Implement buyer/seller order and fulfillment states, dual confirmation and administrator dispute review only after evidence, reversal, fashion shipping/return and basket rules are specified.
- [ ] Integrate verified provider payments and seller settlement only after a supported provider and operating model are selected; test verified webhooks, idempotency and reconciliation. Manual seller-payment reports are not verified payments.
- [ ] Complete full automated and live-provider verification and update `PROJECT_PROGRESS.md` with all limitations.
