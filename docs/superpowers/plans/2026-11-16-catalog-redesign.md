# Catalog redesign implementation plan

**Goal:** Apply the owner's accepted catalog direction to the existing sample
catalog while retaining its working controls, themes and clear preview boundary.

**Architecture:** Keep the server-rendered catalog and GET-based filters. Group
the existing form and results in a responsive sidebar/grid layout, with visual
variants scoped by the existing `data-world` attribute. Do not add invented data.

**Tech stack:** Next.js App Router, strict TypeScript, CSS, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-16-catalog-redesign.md`.

1. Update `src/components/marketplace/catalog.tsx` and
   `src/components/marketplace/styles.css` for responsive layout and the two
   ecosystem treatments, preserving form fields, labels, links and sample copy.
2. Run the existing marketplace Playwright journeys on desktop, tablet and
   mobile, including search, filters, theme persistence, translations and axe.
   Inspect actual rendered screenshots against the accepted concept, explicitly
   documenting differences required by the real sample data and functionality.
3. Run typecheck, lint, unit tests, production build and the full Playwright suite;
   record outcomes and remaining account/admin limitations in project progress.
4. Add a home-page explanation using existing localized copy and link to the
   buying-and-selling page. Verify both directions and the non-live boundary in
   Playwright, then rerun the checks for the changed production build.
