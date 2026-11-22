# VERSAX architecture

## Current boundaries and proposed launch design

VERSAX is a single merchant with two catalog and fulfillment domains. Keep
the existing Next.js App Router, server-rendered reads, session-scoped Supabase
clients, PostgreSQL RLS and audited RPCs. `src/messages` owns interface copy.
`src/lib/config.ts` owns branding. Environment credentials stay outside Git.

| Domain | Owns | Can reuse today |
| --- | --- | --- |
| Identity and access | Customer profiles, verified owner identity, staff access, permission changes and audit events | Supabase Auth, existing owner/admin UUID assignments, session assurance, recent owner verification and account restrictions |
| Catalog | Product facts, media, variants, publish state and public projections | Listings, image access policies, CS2 wear groups, clothing product/color/size editors and public routes |
| Inventory | Sale authority, reservations, adjustments and fulfillment release | Existing transactional listings and order reservation/expiration. Extend with unit-level verified CS2 assets and count-based clothing variants and movements. |
| Orders and payments | Immutable pricing and item snapshots, order lifecycle, payment state, review and refund evidence | Existing order event history and manual reports. Merchant payment and reconciliation need the confirmed payment procedure. |
| Fulfillment and support | Shipment and return state, CS2 trade state/evidence, support and dispute handling | Existing order detail and confirmation history. Use distinct clothing and CS2 state transitions keyed to order/line identity. |
| Store operations | Store settings, promotions, metrics and operator dashboards | Existing account, listing and order views. Derive financial metrics from payment and refund records. |

### Catalog ownership and staff authorization

The current repository binds catalog records to `seller_id` and a seller grant
revision. It also records that account as the seller in existing orders. The
[transition migration](../supabase/migrations/202611220014_single_vendor_transition.sql)
keeps those relationships and adds the existing verified owner/admin gate to
catalog edits. Legacy seller onboarding becomes read-only history. Shared
catalog access and store-owned stock still require a separate cutover. The
migration pauses new legacy reservations and keeps existing order updates,
reservation retries and expiration available.

Proposed launch design gives the business a stable catalog owner independent
of the staff member who entered a record. Existing listings retain IDs and
media references. Existing orders retain their original parties. Staff actions
record the authenticated actor separately. Check scoped capabilities in server
entry points and in the owning RLS policy or RPC before each operation, including
media mutations and concurrent stock changes. Preserve the current owner-only
role-management boundary and customer self-access. Use an explicit capability
catalog so a product edit permission conveys only the intended operations.

### Future independent sellers

Merchant ownership belongs at the catalog/inventory boundary. Order lines
should snapshot merchant responsibility when transactions are created, and
fulfillment may route by merchant and product type if independent selling is
approved. Payment allocation and settlement would be a separate contract
behind payments. The single-store launch uses one business and needs no
seller tenant hierarchy or payout ledger. Add seller-facing authorization
and workflows only alongside a confirmed future requirement.

See the [launch roadmap](MILESTONES.md) and [requirements](../PRODUCT_REQUIREMENTS.md).

## Historical ORO storefront architecture

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
