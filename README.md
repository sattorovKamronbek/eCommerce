# VERSAX — CS2 and clothing marketplace

Three-language marketplace for CS2 and clothing. The homepage opens the seller catalogs. Supabase provides email/password accounts, seller listings, manual direct-payment orders and an MFA-protected admin workspace. Deployment and live commerce status are tracked in [project progress](PROJECT_PROGRESS.md).

The first commerce release uses UZS. Buyers pay sellers directly and admins review reported payments and disputes. Click Business remains the intended platform-payment target. See [requirements and decision log](PRODUCT_REQUIREMENTS.md).

## Run locally
Node 20.19+ (tested with 20.19), npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The root opens `/uz/marketplace`. The seller catalog and private routes require the dedicated Supabase project and `.env.local` based on `.env.example`. See [accounts setup](docs/ACCOUNTS_SETUP.md) and [seller and orders setup](docs/SUPABASE_SELLER_SETUP.md).

- `/{locale}/marketplace` — shared entry for Uzbek, Russian and English.
- `/{locale}/listings/{ecosystem}` — seller catalog and listing details for `cs2` and `fashion`.
- `/{locale}/account` — email/password registration, login, recovery and profile settings.
- `/{locale}/account/orders` — buyer and seller orders. Reservations start on eligible listings.
- `/{locale}/seller/products` — listings and direct payment terms for approved sellers.
- `/{locale}/admin` — users, seller applications, listing moderation, orders and payment review.
- The original storefront homepage is retired. Retained storefront and marketplace sample pages visibly label development data. The legacy browser cart stays separate from real orders.

Configure the brand in `src/lib/config.ts`. Localized text is in `src/messages`. Enable reservations only after applying and verifying the [seller and orders setup](docs/SUPABASE_SELLER_SETUP.md).

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

See [marketplace migration scope](docs/MARKETPLACE_PHASE1_PROPOSAL.md), [marketplace design specification](docs/design/marketplace/DESIGN.md), [historical storefront architecture](docs/ARCHITECTURE.md), [historical milestones](docs/MILESTONES.md), [progress and evidence](PROJECT_PROGRESS.md), [engineering rules](AGENTS.md) and [image sources](docs/ASSETS.md).

## Tooling
The existing Next.js/React/TypeScript/Tailwind stack is retained. Two App Router route groups provide independent legacy and localized marketplace root layouts; crossing between them causes a full document navigation. Server Components own catalogs and detail data; theme/language navigation is a small client island. shadcn components use the existing Radix and utility dependencies. Build Web Apps, built-in imagegen, React and shadcn guidance informed the frontend work. Browser plugin is unavailable; validation uses repository Playwright Chromium. No formal security scan, live Steam/API validation or load test has been claimed.

## Verification

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
