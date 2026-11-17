# Verified seller catalog implementation plan

> **For agentic workers:** Use the executing-plans workflow and verify each independent phase.

**Goal:** Add real, isolated seller listing management with independently reviewed seller activation, without fabricating purchases or provider capabilities.

**Architecture:** Add versioned PostgreSQL migrations and RLS to the dedicated Supabase project, with server actions and small localized Next.js forms. An administrator's explicit, MFA-protected verification activates only the reviewed application revision; reopening immediately revokes effective access and public visibility. Payment and fulfillment remain independently gated.

**Tech Stack:** Next.js App Router, strict TypeScript, Supabase Auth/PostgreSQL, PGlite/Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-16-owner-seller-commerce-design.md`; Click Business subsequently selected without an established merchant contract.

## Global constraints

- Use only dedicated project `xevzbtivteugbqbmmtyz`; do not affect the other live project.
- Never grant seller or owner authority by email, self-asserted metadata or unreviewed application.
- Enforce category scope, seller isolation and approval revocation in PostgreSQL as well as server actions.
- Currency is UZS stored as exact integer tiyin; no stock or price is trusted from the browser at checkout.
- No fake authentication, payments, sales, reviews, inventory, Steam ownership or metrics.
- Keep development items visibly labeled and existing frontend functional until real replacement is complete.

## Review focus

- A stale admin review or revoked application cannot publish or leave products publicly visible.
- A seller cannot manage another seller's listing or use a category outside their approved scope.
- Anonymous and ordinary customers cannot write listings or read private drafts.
- Admin activation requires verified MFA and an explicit offline-identity attestation; an AAL1 user cannot publish.
- Price and quantity parsing rejects ambiguous, negative, overflowing and fractional-minor-unit inputs.

## Phase 1: Seller authorization and private listing records

**Files:** `supabase/migrations/202611160003_seller_catalog.sql`, `supabase/tests/seller-catalog.test.ts`, `src/lib/supabase/database.ts`.

- [ ] Write failing PGlite tests for activation, verified application revisions, MFA, own-seller isolation, scope restrictions, revocation, anonymity and public publication rules.
- [ ] Implement append-only migration with server-authorized verification, per-seller grants, listing constraints, RLS, audited changes and revocation by the current application revision.
- [ ] Run targeted database tests and existing seller-application/owner tests.

## Phase 2: Seller workspace

**Files:** `src/lib/sellers/listing.ts`, `src/messages/seller-catalog.ts`, `src/app/(marketplace)/[locale]/seller/products/**`, admin review controls and relevant tests.

- [ ] Add red/green tests for exact UZS amount parsing, listing validation, allowed return paths and private browser routes.
- [ ] Implement server-verified seller workspace, creation, editing, publishing and archiving, with localized input and honest account/MFA feedback.
- [ ] Add MFA enrollment/challenge or leave privileged actions inaccessible until provider-backed MFA setup exists; verify enrollment and revocation through real dedicated test accounts before launch.

## Phase 3: Catalog and commerce integration

- [ ] Add real public catalog and appropriate empty/error states only after listing authorization and identity flow are verified; preserve the legacy preview.
- [ ] Design real checkout around selected Click Business documentation and authenticated, idempotent provider events; do not enable it before merchant eligibility, seller payouts, fulfillment, dispute and returns rules are verified.
- [ ] Run typecheck, lint, complete unit/database tests, production build and relevant Playwright workflows, then record exact results and external limitations in `PROJECT_PROGRESS.md`.
