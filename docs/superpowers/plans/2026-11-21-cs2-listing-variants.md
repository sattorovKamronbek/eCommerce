# CS2 listing variants implementation plan

**Goal**  
Add CS2 category and model selection, wear-specific offers and separate photos
to the existing VERSAX seller and buyer flows.

**Architecture**  
Use one listing row per wear, an opaque public key for same-seller variant
navigation and existing reservation logic. Store photos in a private Supabase
bucket and enforce access through listing visibility and seller authorization.

**Stack**  
Next.js App Router, strict TypeScript, React, Supabase, PostgreSQL and Playwright.

**Spec**  
[CS2 listings with wear variants](../specs/2026-11-21-cs2-listing-variants.md)

## Verification phases

- [x] Test allowed category/model combinations, exact prices, rejected uploads,
  seller authorization and independent variant stock in the existing suites.
- [x] Add the typed taxonomy, additive migration and private image policy.
  Verify the public view excludes unlisted, archived and blocked variants.
- [x] Add the seller form, atomic batch submission, thumbnail previews and
  per-variant editing. Exercise submitting and editing with a local fixture.
- [x] Add buyer catalog filters, photos and variant links. Verify that the
  reservation link targets the selected listing, including after navigation.
- [x] Run typecheck, lint, unit tests, a production build and relevant
  Playwright workflows. Record evidence in PROJECT_PROGRESS.md.
