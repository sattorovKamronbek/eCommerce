# VERSAX implementation roadmap

The single-vendor decision of 2026-11-22 governs launch. VERSAX owns both
catalogs and sells directly to customers. The phases below are the proposed
delivery order for the [confirmed requirements](../PRODUCT_REQUIREMENTS.md).
Each phase is independently verifiable and must preserve customer access and
historical records during migration.

| Phase | Modules and deliverables | Acceptance evidence |
| --- | --- | --- |
| 1. Single-vendor transition | Close seller intake and application-based grants. Restrict legacy catalog authoring to verified existing owner/admin accounts. Retain application history as read-only. Pause new legacy reservations during reconciliation of listings, images, checkout terms and open orders. | Anonymous and customer sessions cannot apply, approve or author via direct API calls. Approved legacy sellers without a privileged role cannot change catalog data. Existing published items and orders survive the migration. Signed-in store operators verify both product editors against confirmed store data before cutover. |
| 2. Internal access and dashboards | Owner Dashboard, Admin Dashboard, Staff Permissions, Customer Management, Security and Audit Logs. Add delegated catalog permissions and scoped admin/staff navigation. Preserve owner provisioning, recent MFA for platform role changes, and existing profile, suspension and sign-in controls. | Customers and staff with unrelated permissions cannot reach private data or mutations by URL, RPC or Storage API. Permission revocation is effective for subsequent writes. Audit records identify the actor, target and decision. |
| 3. Catalog and inventory | Product Management, CS2 Skin Inventory, Clothing Inventory and Variants. Reuse variant and gallery editors. Add quick create, bounded bulk edits with preview, publish controls, inventory movements and low-stock warnings. | A product retains its identity across edits. Bulk changes respect scope and reject stale versions. A CS2 asset can be reserved once. A clothing size/color is stocked separately and concurrent last-unit orders cannot oversell. |
| 4. Ordering and fulfillment | Order Management, Shipping and Delivery Management, CS2 Trade Management, Customer Support. Verify customer checkout and order history. Give staff shipping, returns and support queues for clothing and a trade queue with item-specific status and evidence for CS2. | Server recalculates totals. Reservations and cancellations are idempotent. Physical returns and digital trade exceptions have separate, exercised state transitions. Customer records are visible only to the customer and appropriately authorized staff. |
| 5. Payments and store operations | Payment Management, Sales Analytics, Promotions and Discounts, Store Settings. Use verified merchant payment outcomes, reconciliation and refunds. Expose sales, revenue, refunds and discount performance from real records. Audit settings and promotion changes. | Provider sandbox verifies signed events, retries and refunds. Gross sales, discounts, refunds and recognized revenue reconcile to source records. Promotions are applied server-side and are safe under concurrent redemption. |
| 6. Production readiness | Complete realistic purchases for both categories in the agreed launch market. Rehearse migration and rollback, verify restore and operator access, and complete security, accessibility, performance and support checks. | All prerequisite business decisions are recorded. End-to-end purchase, payment verification, fulfillment and recovery work with configured services. No demo content or incomplete commerce controls appear in the launch journeys. |

The first authorization migration is a compatibility bridge. The current
product write path requires both the existing owner/admin role and an active,
matching catalog grant; it continues to edit listings under the acting
account's existing inventory identity. Before applying it to the dedicated
project, verify that an existing owner/admin account can manage the business's
products in both catalogs. Identify the business-owned inventory, checkout
contacts, and any listing or open order tied to a legacy seller account.
Existing order participants and audit records retain their original identities.
Do not infer stock ownership or staff authority from an email, account ID,
seller grant, or listing alone.

Review the temporary pause in new reservations as part of production cutover.
Apply and verify the migration before publishing the matching application build.
Existing order updates and expiration can proceed during the pause. Enable new
checkout after the store-only catalog and approved payment and fulfillment
paths are verified. Test both public and authenticated access in the dedicated
project before re-enabling reservations.

Before commerce acceptance, the owner needs to confirm the operating entity,
initial shipping destinations/rates and returns procedure, merchant payment and
refund process, and the CS2 delivery and verification procedure. Phases 2 and 3
can progress while those operational decisions are resolved. The earlier
Click Business preference requires merchant eligibility and provider support
to be verified for this store.

## Historical storefront milestones

The former ORO storefront phases and original marketplace frontend migration
are preserved for context. The migration used locale routes and the
`/storefront-preview` preservation step before the owner retired the old home.
See [implementation evidence](../PROJECT_PROGRESS.md) and the
[historical marketplace scope](MARKETPLACE_PHASE1_PROPOSAL.md).

Each phase starts with inspection and a bounded implementation plan, finishes with code review, checks, fixes and an updated PROJECT_PROGRESS.md. Preserve working storefront behavior throughout.

| Phase | Deliverable | Acceptance evidence |
| --- | --- | --- |
| 0 — Foundation | Next.js, strict TypeScript, Tailwind, lint, Vitest/RTL, Playwright, architecture and working agreements | Clean typecheck/lint, successful production build, documented local commands and no required secrets |
| 1 — Storefront | Uzbek/UZS editorial homepage, theme system, navigation, fixture catalog/detail foundations, local wishlist/cart previews | Desktop/tablet/mobile journeys, accessibility checks in both themes, no console errors, search/empty/unavailable states, cart validation/persistence tests; development status visible |
| 2 — Database catalog | Supabase migrations, categories/products/images/variants/inventory, RLS, database-backed search/filter/pagination | Fresh database migrates successfully; anonymous clients can read only published catalog; unauthorized writes fail; constraints reject invalid prices/stock/SKUs; query integration tests cover filters and empty/error states |
| 3 — Customer features | Supabase Auth, profiles, account routes, customer-owned wishlist/cart and order history foundations | Sign-in/out and session refresh tests; two users cannot access each other's records; invalid sessions rejected; cart merge/revalidation/persistence tested; history correctly empty before orders exist |
| 4 — COD checkout | Validated guest/customer address/phone, configurable shipping, server pricing, persisted order/item snapshots and transaction-safe inventory | Tampered client prices ignored; insufficient stock/invalid address rejected; concurrent last-unit requests cannot oversell; retries create one order; cancellation restores stock exactly once; confirmation and unguessable tracking tested; COD remains unpaid |
| 5 — Admin | Authorized products/categories/images/variants/inventory, orders/fulfillment, customers/settings and real analytics | Every write and data read has server authorization; non-admin direct requests fail; uploads reject unsupported/oversized content; inventory movements auditable; revenue/status metrics match seeded database assertions; cancellation/refund state transitions tested |
| 6 — Payments and readiness | Selected gateway adapter, verified callbacks, idempotency, reconciliation/refunds, deployment setup | Provider sandbox success/failure/cancel tests; invalid signatures/replay events rejected; duplicate callbacks cannot duplicate payment; refunds reconciled; migration/backup/restore rehearsed; security/accessibility/performance reviews documented and release blockers resolved |

External dependencies: Phase 2 needs a Supabase project; Phase 4 needs confirmed shipping/business settings; Phase 6 needs selected gateway and securely configured credentials. No fake substitutes satisfy these gates.
