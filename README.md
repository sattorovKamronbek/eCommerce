# VERSAX — CS2 skins and clothing

VERSAX will launch as a single-vendor store for CS2 skins and clothing in Uzbek, Russian and English. The existing implementation includes Supabase accounts, catalog listings, manual direct-payment order workflows and an MFA-protected administration workspace. Legacy inventory and orders require reconciliation before the store cutover. [Project progress](PROJECT_PROGRESS.md)

UZS is the primary currency. Merchant payment, refunds, CS2 transfer verification and clothing fulfillment still need operating decisions and end-to-end verification. [Requirements](PRODUCT_REQUIREMENTS.md) and [implementation roadmap](docs/MILESTONES.md)

## Run locally
Node 20.19+ (tested with 20.19), npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The root opens `/uz/marketplace`. The catalog and private routes require the dedicated VERSAX Supabase project and `.env.local` based on `.env.example`. See [accounts setup](docs/ACCOUNTS_SETUP.md) and the [legacy catalog and orders setup reference](docs/SUPABASE_SELLER_SETUP.md).

- `/{locale}/marketplace` — shared entry for Uzbek, Russian and English.
- `/{locale}/listings/{ecosystem}` — public catalog and listing details for `cs2` and `fashion`.
- `/{locale}/account` — email/password registration, login, recovery and profile settings.
- `/{locale}/account/orders` — order history and the existing reservation workflow where available.
- `/{locale}/seller/products` — retained catalog editor for an owner or admin with a matching existing catalog grant and verified MFA.
- `/{locale}/admin` — owner/admin dashboards, users, listings, orders and payment review. Earlier seller applications appear as read-only history.
- The original storefront homepage is retired. Retained storefront and marketplace sample pages visibly label development data. The legacy browser cart stays separate from real orders.

Configure the brand in `src/lib/config.ts`. Localized text is in `src/messages`. See the [roadmap cutover requirements](docs/MILESTONES.md) before applying the single-vendor migration or enabling reservations.

## Verify
```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts a production server on 127.0.0.1:3000 and sets its trusted callback origin to the same URL. Stop any development server on that port first. Screenshots and traces are written under /tmp. For production preview: `npm run build && npm start`.

See [architecture](docs/ARCHITECTURE.md), [historical marketplace migration scope](docs/MARKETPLACE_PHASE1_PROPOSAL.md), [storefront design specification](docs/design/marketplace/DESIGN.md), [progress and evidence](PROJECT_PROGRESS.md), [engineering rules](AGENTS.md) and [image sources](docs/ASSETS.md).

## Tooling
The existing Next.js/React/TypeScript/Tailwind stack is retained. Two App Router route groups provide independent legacy and localized marketplace root layouts; crossing between them causes a full document navigation. Server Components own catalogs and detail data; theme/language navigation is a small client island. shadcn components use the existing Radix and utility dependencies. Build Web Apps, built-in imagegen, React and shadcn guidance informed the frontend work. Browser plugin is unavailable; validation uses repository Playwright Chromium. No formal security scan, live Steam/API validation or load test has been claimed.

## Historical account verification

Latest account/workspace refinement verification on 2026-11-12: `npm run check`
passed strict TypeScript, warning-free lint, 65 unit/component/database tests and
the production build (73 generated pages). All 60 Playwright cases passed across
desktop, tablet and mobile Chromium in 5.2 minutes with zero retries. Typecheck
and lint passed again after aligning the browser test server's trusted origin.
The new compact account/workspace design, references and intentional adaptations
are in [account design](docs/design/accounts/DESIGN.md); exact evidence and
limitations are in [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md).

Real email delivery remains blocked by the known Gmail SMTP `535 5.7.8`
credential rejection, which the owner confirmed is still uncorrected. The intended
administrator was identified, but no live admin assignment was performed.
Authenticated customer/admin and email workflows need actual operator setup and
verification; SDK fixtures are not live integration proof. See [account setup](docs/ACCOUNTS_SETUP.md).
Original storefront history remains in [Phase 1 delivery](docs/PHASE1_DELIVERY.md).
No commit, push, remote database write or deployment was performed.
