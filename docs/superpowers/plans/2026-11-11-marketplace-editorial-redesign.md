# Marketplace editorial redesign implementation plan

> Execute inline with Superpowers execution/TDD/verification guidance, followed by
> one independent code review. The owner requested implementation in this workspace.

**Goal:** Deliver the owner-selected substantial marketplace frontend redesign.

**Architecture:** Preserve App Router/Server Components, current routes and legacy
storefront. Reuse existing shadcn, assets and development data. Native GET forms
and links carry filter state; the existing theme/navigation island stays small.

**Tech stack:** Existing strict TypeScript, Next.js 16, React 19, CSS/Tailwind,
shadcn, Vitest, Playwright and axe. No dependency changes.

**Spec:** ../specs/2026-11-11-marketplace-editorial-redesign.md

## Global constraints

Customer copy in src/messages; brand config in src/lib/config.ts. All listings
remain visibly samples; no live commerce/backend. Preserve old routes/cart/theme.
Checkpoint outside repo; work on a dedicated branch with existing untracked source
retained in place. No automatic commits, push or deployment.

## Review focus

Encoded search must not create query parameters. Type shortcuts preserve q/sort.
Detail return and language switching preserve the same filter context. At 320px,
Russian/Uzbek controls must fit. Skip links and linked cards remain keyboard usable.

## Task 1: URL-based browsing context

- [x] Add failing unit cases for encoded filter links, empty defaults and reset.
- [x] Add failing browser journeys for category -> detail -> back context.
- [x] Implement typed `sampleFilterQuery(filters: SampleFilters): string` in
  src/lib/marketplace.ts; consume it in catalog cards/type links/detail back links.
- [x] Preserve static detail rendering and not-found/ecosystem guards; use a small
  Suspense-wrapped return link in the existing client navigation module for query
  context. Run unit tests and the targeted browser journey.

Routing ruling: a server-side searchParams read caused streaming HTTP 200 responses
for invalid sample paths. Keep original static pages and isolate the URL-dependent
return link. The no-JavaScript fallback returns to the full sample catalog.

## Task 2: Editorial home, catalog and detail

- [x] Save both generated concepts. Add localized sample-edit copy for en/uz/ru.
- [x] Compose home hero/destinations/sample edit with existing image assets.
- [x] Rework catalog/card/detail markup and scoped `.mp` CSS to the specification.
- [x] Retain shadcn controls/alerts/empty states and existing theme hydration logic.
- [x] Verify home discovery links, skip focus and 320px translated layouts.

## Task 3: Verification and handoff

- [x] Run npm run check then full production Playwright suite sequentially.
- [x] Capture desktop/mobile/theme/locale screenshots outside repo; inspect both
  concepts and final rendered screenshots with view_image and resolve mismatches.
- [x] Request an independent review, resolve actionable findings, and rerun
  appropriate checks after any fixes.
- [x] Compare preservation hashes, update PROJECT_PROGRESS.md with exact evidence
  and plugin limitations, and leave a working local preview without publishing.
