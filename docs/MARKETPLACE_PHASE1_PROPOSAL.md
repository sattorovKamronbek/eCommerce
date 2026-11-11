# First marketplace implementation proposal

Date: 2026-11-11. **Frontend scope and combined migration authorized by owner replies.** The owner selected both options; implement new locale routes first, preserve the original home at `/storefront-preview`, then switch the main entry after verification. This document does not approve a database, payment provider, live trading implementation or launch readiness.

## Confirmed basis

- CS2 skins and clothing belong in the first release together.
- Initial audience: Uzbekistan and nearby countries; English, Uzbek and Russian.
- Initial CS2 direction: listings/contact and P2P. Platform-managed commerce is a later ambition.
- A large-scale destination is required; numerical targets have not been supplied.
- UZS is the owner-selected primary currency; Visa and later crypto payments are desired future capabilities, not implemented payment services.

See [PRODUCT_REQUIREMENTS.md](../PRODUCT_REQUIREMENTS.md) for the answer log and remaining commercial decisions.

## Proposed next implementation

Deliver one reviewable frontend phase for both ecosystems, preserving existing storefront behavior. This is a development preview that prepares the customer experience; live marketplace launch still requires backend, identity, seller isolation, inventory, delivery and approved commercial systems.

| Surface | Proposed behavior | Acceptance evidence |
| --- | --- | --- |
| Marketplace home | Two clear entries, CS2 skins and clothing, with responsive navigation; retain temporary ORO branding until the owner names the brand | Both paths work on desktop, tablet and mobile; no invented sales, ratings or transaction counts |
| Language navigation | Uzbek, Russian and English dictionaries for the new surfaces; proposed locale paths `/uz/marketplace`, `/ru/marketplace`, `/en/marketplace` | Switching language keeps the equivalent marketplace surface; no untranslated navigation within the new scope; appropriate language semantics |
| CS2 browsing | Proposed locale paths `/{locale}/marketplace/cs2`; search/filter and truthful detail/empty states based on explicitly identified development data | No implied verified ownership, live market prices, trade execution or unavailable item metadata; no Steam credential collection |
| Clothing browsing | Proposed locale paths `/{locale}/marketplace/fashion`; category and size/color presentation separated from unique digital-item semantics | Sample products/images remain identified; no claims of real variant stock or fulfillment |
| Shared states | Accessible loading, empty, error and unavailable-action states | Keyboard/focus, responsive layout, light/dark and agreed system-theme behavior verified |
| Existing storefront | Preserve current catalog, detail, cart, wishlist and informational routes; keep browser fixtures separate from future trading records | Existing unit and browser workflows pass; no development cart data becomes an order |

All customer-facing copy stays in `src/messages`; brand settings stay in `src/lib/config.ts`. Keep Server Components by default and limit client components to actual interactions. Exact layout/component boundaries will follow the selected migration option. The preview retains the existing Uzbek default, and the owner has now explicitly selected UZS. Sample prices remain illustrative. No international shipping policy, Visa provider or crypto asset/network is selected.

Seller onboarding, Seller/Admin Center operations, authentication, order creation, commissions, payouts and real trading are later implementation gates. Their absence must remain visible wherever an action depends on them. Do not create fake operational dashboards or simulated successful purchases.

## Migration options for owner selection

Both options start by reviewing and preserving the current untracked application, tests, configuration and assets in a recoverable local source checkpoint, excluding environment files, credentials and generated output. No push or deployment is part of this proposal. Keep current routes and browser-persistence keys compatible during the first frontend phase.

**A — Add a preview first.** Add the locale marketplace paths alongside the current application. Preserve the existing homepage during implementation and verification.

**B — Replace the entry in the same phase.** Preserve the current homepage at `/storefront-preview`, retain its catalog/detail/cart routes, and make `/` enter the new marketplace after the frontend checks pass. The old homepage and assets remain recoverable. This explicitly changes the existing root-page behavior and its browser expectations; add marketplace coverage while retaining legacy coverage through the preview route.

Neither option deletes existing work or changes a database. Recovery means restoring the preserved entry/layout from the source checkpoint; it must not require clearing customer browser state. Record the selected option before runtime restructuring.

Owner selection: both, applied sequentially as described in the status above. Before restructuring, preserved 80 explicitly selected source/test/config/asset/document files in `/home/kamron/.codex/backups/ecommerce-marketplace-20261111-before-frontend.tar.gz` (SHA-256 `8c6c8d12aeb68d3a2241a71dc10f73be6d7fa417f6769b9b01b373e7af37f815`). Excluded Git internals, environment files, credentials, dependencies and build output. No Git history was changed.

## Owner answers and remaining decisions

1. Migration selection received: both options, applied sequentially with the original homepage preserved and a verified entry cutover.
2. Initial CS2 P2P direction: both direct-seller and platform-payment possibilities requested. The operating distinction, provider feasibility, delivery/reversal responsibility and verification remain open; transaction actions are unavailable in the preview. This frontend phase does not approve a Steam integration or platform custody.
3. Clothing supply confirmed as a hybrid: own products and independent sellers. Seller onboarding, stock ownership enforcement, fulfillment and returns remain backend/business decisions.

Operating entity country, crypto asset/network if pursued, exact cross-border countries, support/returns, seller eligibility and quantitative capacity targets are later discovery groups that must be resolved before the dependent commercial/backend work. Do not turn regional ambition into a claim that all neighboring countries are supported.

## Verification and completion gate

For the selected frontend phase, run strict TypeScript, lint, unit tests, production build and relevant Playwright flows sequentially where build artifacts are shared. Verify all three languages, both ecosystem navigation paths, existing cart/wishlist regression journeys, desktop/tablet/mobile layouts, keyboard/focus, themes and accessibility. Record actual results and remaining gaps in `PROJECT_PROGRESS.md`.

Baseline checks passed before implementation: typecheck, lint, 12 unit/component cases, production build and 18 Playwright checks. The owner selected the migration scope and implementation is authorized. Record fresh post-implementation results separately; launch readiness requires separate evidence for real backend and commerce workflows.
