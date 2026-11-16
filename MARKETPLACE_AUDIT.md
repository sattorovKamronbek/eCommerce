# Marketplace transformation audit — pre-implementation baseline

Captured before the approved frontend migration on 2026-11-11. Implementation facts below describe that baseline. Current frontend changes and fresh verification are in [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md). Owner answers are current in [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md).

Initial discovery status: discovery findings and preliminary proposals; first owner answers are recorded in PRODUCT_REQUIREMENTS.md. Both ecosystems at first release, Uzbekistan/nearby countries, three languages and staged CS2 listings/P2P are confirmed. Detailed architecture, payment/delivery responsibility remain open for live commerce. The owner later selected a combined additive preview + preserved-home entry replacement; see the implementation proposal and progress record. This audit preserves the existing single-vendor delivery and does not approve a live transaction implementation.

## 1. Assessment

The repository is a usable Next.js storefront foundation, not a marketplace backend. Reuse the framework, accessible primitives, localization structure, design tokens and testing investment. Retain the current storefront as a regression baseline. Seller identity, authorization, operational data, listings, fulfillment and finance require new domain work after discovery; adding seller labels to the fixture catalog would not provide multi-vendor functionality.

No application files, dependencies, homepage, database, business integrations or Git history were changed for this audit. No database implementation was found in this checkout. That observation does not establish whether the owner has an external database elsewhere.

## 2. Inspection evidence

Reviewed root configuration, Git status/history/tracked files, source and test structure, routes, components, fixtures, state, localization, design tokens, engineering agreements, architecture, milestones, delivery/progress documents, image sources and installed dependency/skill metadata. Ignored generated dependencies/build output for source review. No secret values were requested or read.

```text
src/
  app/                  App Router storefront, catalog/detail, cart/wishlist,
                        information and explicit account/checkout boundaries
  components/           Header/footer, purchase/cart controls, theme, UI primitives
  data/products.ts      Six development-only physical-product fixtures
  lib/                  Catalog filtering, cart normalization, money, config, utilities
  messages/             Uzbek dictionaries and configuration-based resolver
  stores/shop.ts        Zustand browser persistence
public/                 Local illustrative imagery and starter assets
 tests/                 Shared test setup and Chromium e2e journeys
 docs/                  Historical architecture/design/milestones/delivery, licenses
```

### Existing stack

| Area | Observed implementation |
| --- | --- |
| Runtime | Node 20.19.0 in this environment; package engine >=20.19 |
| Application | Next.js 16.4.6, React/React DOM 19.3.0, App Router; strict TypeScript 5.9.3 installed |
| Styling | Tailwind 4.3.3, PostCSS integration, semantic CSS variables and custom global CSS |
| UI | shadcn new-york source components using Radix; Lucide; class-variance-authority, clsx, tailwind-merge |
| State/theme | Zustand 5.1.0; next-themes 0.4.6; CSS motion/tw-animate-css |
| Fonts | Locally bundled DM Sans and Cormorant Garamond with OFL notices |
| Tests | Vitest 4.1.12 with Vite 7.3.8, RTL, Playwright 1.65.0, axe; ESLint |
| Backend/data | No Supabase package/config/migrations, PostgreSQL schema, API route handlers or Server Actions found |
| Integrations | No Steam, payment, shipping, email, analytics or production storage integrations found |

No React Hook Form, Zod, TanStack Query or GSAP is installed. Install only when an approved workflow justifies it. The existing Next/React stack is suitable to retain; this audit identifies no reason to replace the framework or create another application.

### Git and recovery state

HEAD is `541a1f9` (Initial commit); `README.md` is the only tracked application-project file. README has local modifications and the implemented application/docs are untracked. A remote named origin exists; remote state was not queried or changed. This is a preservation risk: HEAD alone is not a recoverable checkpoint of the working storefront. Before runtime refactoring, prepare a reviewed baseline checkpoint including the untracked work, exclude secrets/generated output, and agree how it will be backed up. No commit, push, reset, branch deletion or cleanup was performed.

## 3. Implemented versus absent

| Capability | Current state | Marketplace implication |
| --- | --- | --- |
| Homepage/navigation | Responsive ORO editorial storefront | Composition and accessibility reusable; marketplace entry/navigation requires approved information architecture |
| Catalog/search | Six fixtures; URL keyword/category/price/availability/sort filters | Useful interaction baseline; no database search, pagination, seller listings or price feed |
| Product details | One image, product-level color choices, quantity, related products | Foundation only; no size/variant SKU inventory or CS2 identity/wear/float/pattern/stickers |
| Cart/wishlist | Browser-local, versioned, fixture ID/color/quantity validation | Reuse UX and validation intent; persistence is neither account storage nor order authority |
| Checkout/account | Truthful informational boundaries | No authentication, customer account operations, order creation or payments |
| Themes | Light/dark tokens and persisted binary toggle | System preference is explicitly disabled; requirement is not yet met |
| Localization | Uzbek dictionary resolver, Uzbek route names, UZS configuration | Structure reusable; launch countries/languages/currencies must be reconfirmed |
| Sellers/roles | Absent | No organization membership, seller verification, RBAC, RLS or tenant isolation |
| Operations | Absent | No Seller/Admin Center, moderation, support/disputes, real analytics or audit log |
| Financial systems | Absent | No commission rules, accounting ledger, provider reconciliation, settlement, refunds or payouts |
| Delivery | Absent | No physical logistics or digital trade fulfillment |

Existing delivery Phase 0–1 completion refers to the former storefront roadmap, not completion of the new marketplace phases.

## 4. Reuse and change inventory

| Asset | Reuse approach | Change required after approval |
| --- | --- | --- |
| Next/TypeScript/Tailwind setup | Retain in place | Extend domain boundaries and server interfaces incrementally |
| `components/ui/button.tsx`, `sheet.tsx` | Retain accessible primitives | Expand only for approved controls; preserve keyboard/focus behavior |
| Header/footer/empty/error/loading states | Reuse patterns, not a forced identical layout | Shared navigation principles with ecosystem-specific shells and seller/admin workspaces |
| `app/globals.css` and font assets | Retain tokens, typography and reduced-motion baseline | Scope surface styling; distinct CS2/fashion identities plus system theme option |
| `messages/` | Retain resolver and string separation | Translate approved surfaces; locale routing and ecosystem terminology |
| `ProductCard` and purchase controls | Reuse presentation pieces where appropriate | Domain-specific models and information density; never imply unique CS2 items have generic quantity stock |
| `lib/catalog.ts` | Retain URL/filter behavior and useful tests | Replace fixture traversal with bounded indexed queries and domain-specific filters |
| `lib/cart.ts`, `stores/shop.ts` | Retain regression cases and browser UX | Introduce canonical listing/variant references, domain-aware validation, account ownership and approved basket policy |
| Money formatting | Retain Intl formatting pattern | Currency-aware amounts and precision; current formatter always appends so‘m |
| Test tooling | Retain configurations and passing baseline | Add isolation, role permissions, concurrent inventory, payment/reversal and domain-specific journeys |
| Images/brand | Preserve existing assets and provenance | ORO is temporary; source rights-cleared fashion/CS2 assets after direction approval; fixtures stay development-only |

## 5. Architectural gaps affecting transformation

These are expected limitations of the current frontend phase, not claims of exploitable production vulnerabilities.

1. **No seller boundary.** `Product` and cart rows contain no seller or organization reference. New operational records need seller ownership and server-enforced access. Proposed organization membership and action permissions must distinguish global platform authority from seller-scoped staff authority. A frontend role label is insufficient.
2. **Catalog identity is conflated with a sales offer.** A skin definition, a specific external item, a seller listing and a verified observation are different concepts. Fashion product descriptions and sellable size/color SKUs are also different. Do not extend one nullable product record into an everything-table. No final entity graph is approved yet.
3. **Current inventory semantics are unsuitable.** Stock is a product-level fixture number shared across colors. Fashion needs variant stock/reservations. A unique digital item needs listing/availability and duplicate-sale protection, evidence freshness, restrictions and reversal handling. Browser normalization cannot prevent concurrent sales.
4. **Data/business logic is fixture-coupled.** Catalog routes, components, cart utilities and the store import `data/products.ts`. Introduce domain contracts and repositories gradually, retaining fixtures as an explicit development adapter. Do not let browsers author canonical prices or verification states.
5. **Financial representation is limited.** Prices are JavaScript numbers for whole UZS, and `formatMoney` ignores the configured currency code when labelling output. Future amounts need currency and defined scale, exact persisted numeric representation, specified rounding and immutable commercial snapshots. Commissions, taxes, refunds, reversals and seller payables require accounting records distinct from provider statuses. No fee rates or payout timings are selected.
6. **Order/fulfillment contracts do not exist.** Cart checkout grouping, buyer payment grouping, seller suborders and fees must be owner-approved. Fashion shipments/returns and CS2 delivery/reversal protection need separate workflows. A universal delivered flag would lose important meaning.
7. **Theme/layout scope is global.** One root shell and a large global stylesheet couple all pages. Class-based color tokens can be retained, but seller/admin and CS2 surfaces need scoped composition. `enableSystem={false}` and a binary toggle do not meet light/dark/system support. No new palette or branded homepage is approved here.
8. **Identity and privileged operations are absent.** Before seller data exists, design authenticated server sessions, tenant authorization/RLS, storage policies, staff permission changes, high-risk reauthentication and auditable financial operations. Test cross-seller reads/writes, not just hidden buttons.
9. **Search and external market data are undeveloped.** In-memory filtering is appropriate only for the current fixtures. Future query limits, pagination/indexes, market-price sources, metadata/image rights, rate limits and freshness must be designed for confirmed scale. Asking prices must not masquerade as verified transaction-based market prices.
10. **Observability/production controls are absent.** Deployment environment, structured logs/redaction, monitoring, reconciliation jobs, replay-safe integration processing, backups/recovery, rate limits and upload controls need future acceptance gates. Do not add distributed services before operational requirements justify them.
11. **Existing tests cover a different product.** Current tests prove storefront behavior, not tenant security, CS2 ownership, payment correctness or seller finances. Retain that coverage while adding new domain invariants.
12. **Untracked baseline and historical guidance can cause loss or scope confusion.** Preserve all work and clearly separate the old single-vendor roadmap from this discovery effort.

## 6. Candidate architecture — recommendation, not an approved design

Prefer evaluating a modular monolith inside the current Next.js application, with PostgreSQL/Supabase as a candidate backend consistent with the requested preferred stack. Final decisions require owner answers and integration feasibility. No services, schemas, routes, providers or role permissions are implemented by this proposal.

Candidate domains: identity/access; sellers/organizations; fashion catalog/variants/stock; CS2 catalog/item observations/listings; orders; physical fulfillment; digital fulfillment; payments; accounting/settlement/payouts; moderation/disputes/support; notifications; analytics/audit. Share true primitives such as money, identifiers, pagination and UI behavior; keep distinct inventory/fulfillment state machines.

Security acceptance principles already required by the owner: authorization on the server, default-deny privileged operations, explicit seller scope, tenant-consistent references, RLS where appropriate, service credentials kept server-only, permission-change auditing and cross-tenant tests. A seller-supplied store ID is not evidence of authority. Public seller profiles must be separated from private operations. A Steam-linked identity is not proof of item ownership or delivery.

## 7. Preservation and migration strategy

1. **Checkpoint first:** review the current untracked baseline and preserve it through an agreed version-control/backup checkpoint before runtime transformation. Keep prior routes, fixture adapter, assets and test evidence recoverable.
2. **Discovery gate:** obtain the first owner answers, then record decisions in PRODUCT_REQUIREMENTS.md. Do not treat proposed roadmap entries as approval. Existing Uzbek/UZS/ORO settings remain current implementation facts, not new launch decisions.
3. **Architecture gate:** produce reviewed ADRs, action/role matrix, seller ownership rules, domain contracts, approved route map, data lifecycles, threat model and design direction. Resolve CS2 transaction feasibility before real trading. Preserve old architecture docs as historical evidence until an approved successor exists.
4. **Additive implementation:** add approved marketplace modules and scoped shells within this repository. Adapt existing components behind stable interfaces. Keep existing pages functional until replacement behavior and rollback are reviewed. No mass rewrite or automatic homepage replacement.
5. **Data expansion:** no schema exists here to migrate yet. For any connected database discovered later, inventory schemas/data first. Use additive, reversible migrations; validate constraints/RLS with two sellers and non-admin actors; backfill/verify before cutover. No destructive migration without explicit approval.
6. **Browser-state transition:** version and namespace future basket/wishlist representations. Fixture IDs must never silently become real product/CS2 listing IDs. Preserve old keys until a deliberate compatibility policy is approved; never import development totals into real orders.
7. **Domain-by-domain cutover:** introduce fashion catalog and CS2 listing adapters independently. Keep fixture mode labelled; validate data provenance and permissions before treating records as authoritative. Reconcile observed trade restrictions rather than assuming a timer guarantees eligibility.
8. **Commercial gates:** only after approved transaction/payment/delivery/payout policies, implement server pricing, reservation/locking, idempotency, audit and provider verification. Test failures, concurrent last-unit sales, duplicate callbacks, cancellations, reversals and refunds before live money.
9. **Rollback and release:** document per-stage restore procedures, migrations, source checkpoint and flags where justified. Release only against agreed acceptance criteria; preserve prior working state. No deployment performed in discovery.

## 8. Preliminary roadmap and gates

The owner may reorder this roadmap. Listing an item below does not approve first-release scope.

| Marketplace phase | Scope to refine with owner | Exit evidence before progressing |
| --- | --- | --- |
| 0 — Discovery/audit | Existing-system assessment, source checkpoint plan, requirements questions | Audit delivered; first business answers recorded; unresolved decisions explicit |
| 1 — Architecture/design system | Domain boundaries, tenant/role matrix, lifecycles, two identities, light/dark/system | Owner-approved requirements and ADRs; permissions and design acceptance criteria |
| 2 — Marketplace frontend | Approved CS2/fashion pages and common navigation | Verified responsive/accessible flows; distinct ecosystems; development records clearly identified; no fictitious metrics |
| 3 — Identity/sellers | Auth, account linking if approved, organizations, seller applications/profiles/staff | Server authorization and tenant isolation tests; verified role changes; approved onboarding rules |
| 4 — Catalog/listings | Domain schemas, images, variants/stock, CS2 metadata/availability | Migrations/constraints/RLS pass; seller ownership and duplicate listing tests; approved data sources |
| 5 — Seller Center | Exact approved operational modules | Sellers/staff can access only permitted store operations; real-record or truthful empty analytics |
| 6 — Orders/checkout | Approved purchasing, seller grouping and separate physical/digital fulfillment | Server-calculated totals; transaction-safe stock/listings; retries/cancellation/failure tests; no unsupported trading |
| 7 — Platform Admin | Approved moderation, permissions, disputes and operations | Privileged calls reject unauthorized actors; scoped staff permissions and high-risk audit evidence |
| 8 — Finance | Approved provider, commissions, accounting, settlements/refunds/payouts | Verified callbacks, idempotency, reconciliation, exact arithmetic, balanced accounting where adopted; provider/jurisdiction approval gates |
| 9 — Advanced CS2 integration | Only approved, documented and permitted capabilities | Integration spike proves access, verification, restrictions/reversal handling and rate-limit behavior; no secrets collection or unauthorized automation |
| 10 — Readiness | Security, accessibility, performance, observability, deployment/recovery | Agreed load targets; failure/recovery exercises; cross-browser/security review; production release checklist satisfied |

Phase 9 does not permit earlier phases to implement unsupported CS2 trading. Any earlier live CS2 checkout depends on the necessary integration and compliance feasibility gates first. Otherwise keep that ecosystem discovery/listing-only until the owner approves a supported model.

## 9. External constraints and discovery gates

Primary-source Steam research is recorded in [docs/STEAM_RESEARCH.md](docs/STEAM_RESEARCH.md). OpenID, item verification and trade execution must not be conflated. CS2 Trade Protection requires a reversal-aware delivery/settlement design; it does not select a payout schedule for this marketplace. No provider, custodial model, bot model, wallet, escrow or fee has been chosen. Market-data/image rights and access to precise item attributes remain unverified for this product.

First owner answers now confirm CS2 and fashion together, an Uzbekistan/nearby-country audience, English/Uzbek/Russian, and initial listings/contact + P2P with eventual platform-managed commerce. Exact countries, entity, currencies, payment recipient and delivery/reversal responsibility remain open. Follow-up groups resolve those details, fashion operations, seller onboarding, logistics, commission/payout policies, branding and quantified scale. See PRODUCT_REQUIREMENTS.md for the decision register and [the first implementation proposal](docs/MARKETPLACE_PHASE1_PROPOSAL.md) for concrete migration options; neither option is selected yet.

## 10. Verification and tooling

Fresh checks during this audit: `npm run typecheck` passed; `npm test` passed all 12 unit/component cases. Fresh `npm audit --json` reported eight moderate advisories in the development-only typescript-eslint/minimatch lint dependency chain; all affected nodes are marked development-only in the lockfile. No high/critical advisories were reported. No automatic dependency fixes/downgrades were applied.

Historical delivery evidence, not rerun for these documentation-only changes: warning-free lint, successful production build with 21 generated pages, and 18 Playwright checks across desktop/tablet/mobile with tested light/dark accessibility. These tests do not establish marketplace readiness. A source-hash comparison is used to confirm application/test/dependency files remain unchanged during documentation work. Documentation links and whitespace are checked before handoff.

Available locally: Build Web Apps frontend creation/testing, React best practices, shadcn, Supabase/Postgres guidance and Codex Security skills; Superdesign and image-generation skills are advertised in the session. Security tool capabilities are available. No Browser plugin or Supabase connector capability was found in the available tool list. Superpowers, Impeccable and standalone Composition Patterns/Web Design Guidelines were not found in the advertised catalog and checked local skill roots. Do not infer installation from a preferred-tool name.

This phase uses source inspection and existing engineering guidance. No new UI concept, formal Codex Security scan, new database design/implementation or production security certification is claimed. Relevant design/database/security workflows should be applied when their approved phase begins. No additional packages were installed.

## 11. Changes made by discovery

Created MARKETPLACE_AUDIT.md, PRODUCT_REQUIREMENTS.md and docs/STEAM_RESEARCH.md. Updated AGENTS.md to identify the new discovery scope and PROJECT_PROGRESS.md to distinguish this transformation from historical storefront phases. Existing product/architecture requirements were not overwritten. Application and dependencies are preserved.

Discovery continuation: recorded the owner's first answers, prepared docs/MARKETPLACE_PHASE1_PROPOSAL.md for review, and reran baseline checks. Latest verification evidence and limitations are recorded separately in PROJECT_PROGRESS.md; the original verification paragraph above describes the initial audit. No runtime refactoring, database change, source commit or deployment was performed.

## 12. Subsequent authorized frontend work

The owner selected both migration options, requested both CS2 payment-flow possibilities and confirmed hybrid fashion supply. The bounded marketplace frontend is implemented with separate localized routes and preserved legacy behavior; this changes the runtime after the audit baseline above. The audit remains evidence for pre-implementation gaps, not a claim that the new preview has a backend. Updated migration, screenshots, verification and limits are recorded in PROJECT_PROGRESS.md.
