# ORO architecture

Historical storefront guidance/delivery. The approved marketplace frontend now has separate route-group layouts and locale routes; the old home is at `/storefront-preview` and other original public routes remain. See [current progress](../PROJECT_PROGRESS.md), [requirements](../PRODUCT_REQUIREMENTS.md) and [marketplace scope](MARKETPLACE_PHASE1_PROPOSAL.md). Historical phase numbers and source paths below do not describe marketplace completion.

## Scope and runtime
Phase 0–1 is a local Next.js App Router storefront, not a functioning commerce backend. React Server Components render static content and catalog pages; client islands handle theme, accessible Radix sheets, product selection and Zustand browser persistence. No service credentials are needed. No fake authentication or checkout submission exists. All routes are noindex during development.

## Boundaries
- `src/app`: route composition, metadata, loading/error boundaries.
- `src/components`: focused presentation and interactive components; `ui` holds shadcn source.
- `src/data/products.ts`: explicitly development-only product fixtures.
- `src/lib`: brand configuration, catalog queries and cart validation/calculation.
- `src/messages/uz.ts`: Uzbek dictionary; locale/currency configured independently. The central `src/messages/index.ts` resolver selects the configured dictionary; add locale dictionaries there without changing components; do not scatter translated copy through shared components. Route-level explanatory copy is centralized in `src/messages/interface.ts`; catalog content belongs with product records.
- `src/stores`: versioned local cart/wishlist. Persist IDs, variants and quantities only; derive prices from catalog. Browser totals are previews and never order authority.
- `tests`: component/unit coverage and desktop/mobile Chromium workflows.

## Design decisions
Warm off-white, olive ink, terracotta controls; semantic variables cover both themes. Locally hosted DM Sans and Cormorant Garamond prevent build-time font network dependencies. Generated hero and licensed Unsplash imagery are local, optimized through Next Image. Square surfaces, open product grids, asymmetrical collection tiles, restrained CSS motion and reduced-motion support.

## Deferred dependencies
Supabase, React Hook Form and payment libraries are not installed until their phase needs them. TanStack Query and GSAP currently offer no justified benefit. Server form navigation is sufficient for this small catalog. Catalog pagination is deferred until database-backed result sets exist. Product gallery is a single image foundation; multiple supplier images will come from product_images.

## Phase 2 data model plan
Migrations will create categories, products, product_images, product_variants and inventory, with unique slugs/SKUs, nonnegative integer UZS prices and stock constraints. Product variants must own sellable inventory; archived products remain referenced by orders. Add profiles/roles and customer-owned wishlist/carts in Phase 3. RLS: public read for published catalog only; administrator writes checked server-side and in RLS. Never send service-role keys to clients.

## Commerce invariants for Phases 4–6
A PostgreSQL transaction/RPC must lock inventory rows, re-read active variant prices, calculate shipping, create order and immutable order-item snapshots, record inventory movements and decrement/reserve stock atomically. Idempotency keys are unique and scoped. Cancellation restores inventory exactly once in a transaction. Cash-on-delivery starts unpaid; fulfillment and payment statuses remain separate. Guest order tracking requires a high-entropy capability token, not guessable order IDs. Payment adapters verify signatures on raw webhook bytes and process event IDs idempotently before changing payment status. Never treat browser redirects as proof of payment.

## Delivery milestones
0: repository/tooling, conventions, docs and checks. 1: responsive storefront, themes, sample catalog and honest boundaries. 2: migrations, RLS, database catalog/search/variants/inventory. 3: Auth, profiles, wishlist, validated persistent cart. 4: transaction-safe COD checkout and persisted orders. 5: authorized admin CRUD, inventory, real analytics. 6: chosen payment gateway, verified webhooks, refunds and production review.

## Toolchain compatibility
Vitest 4.1 runs with its supported Vite 7 backend: Vite 8 native tooling crashed with SIGILL on this laptop before tests could start. Tailwind uses its PostCSS plugin. The lockfile is the reproducible dependency authority. Runtime audit reports zero advisories; eight moderate development-only advisories remain through typescript-eslint/minimatch. npm proposes a cross-major Next lint-config downgrade, which is intentionally not applied automatically.

## Design review notes
Compared the saved concept with browser screenshots. The same cream/olive/terracotta palette, serif scale, split hero, open four-column product grid, image collections, editorial story and restrained footer are implemented. Intentional variations: an additional new-arrivals section requested by the brief; three collection tiles; split editorial story; truthful service and newsletter text replacing concept-only commercial claims. Dedicated generated unbranded vase/bag/cushion/table assets replace mismatched stock photos. Mobile stacks the hero and uses two product columns; tablet preserves the editorial grid.

References checked: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4), [Unsplash license](https://unsplash.com/license).
