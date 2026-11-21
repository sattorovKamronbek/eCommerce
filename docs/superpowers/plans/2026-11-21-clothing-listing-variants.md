# Clothing Listing Variants Implementation Plan

> Work in independently verifiable phases. Verify each phase with a test that exercises its normal entry point.

**Goal** — Let a seller create one clothing card with color galleries, size variants, per-variant inventory and product details.

**Architecture** — Store shared clothing product fields and color photos separately from sellable listings. Each offered color and size points to an existing marketplace listing and uses its checkout and inventory transaction. Catalog results show one currently visible listing per product.

**Tech stack** — Next.js App Router, strict TypeScript, Supabase Postgres and Storage, Vitest and Playwright.

**Spec** — [Clothing listing variants](../specs/2026-11-21-clothing-listing-variants.md)

## Constraints

Use additive migrations in the dedicated VERSAX project. Verify scoped seller authorization, RLS and reservation stock consistency locally. Keep existing CS2 and legacy clothing routes, and localize the form and buyer details in `src/messages`.

## Phases

- [x] **Persistence** — Add product and color tables, variant relationships, seller RPCs, a catalog view and private photo storage. Verify duplicate submissions, unauthorized writes, draft photo access, concurrent stock edits and the reservation quantity of a selected variant with PGlite.
- [x] **Seller workflow** — Add the clothing variant editor on the existing create and edit routes. Validate product fields, price overrides, distinct color and size combinations, and image bytes on the server. Verify creation, reload and edit of a product with partially overlapping size selections.
- [x] **Buyer workflow** — Show one catalog and search card per product. Display the current variant's gallery and price, color and size controls, shared measurements, and the selected listing's checkout link. Verify that an unavailable size cannot lead to another variant's checkout.
- [x] **Handoff** — Run typecheck, lint, unit and migration tests, production build and relevant Playwright workflows. Record evidence and deployment status in `PROJECT_PROGRESS.md`.
