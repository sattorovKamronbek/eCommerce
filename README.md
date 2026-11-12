# ORO — CS2 and clothing marketplace preview

Three-language marketplace for CS2 skin browsing and clothing, alongside the preserved original storefront. Catalog data remains sample-only. Real Supabase account/profile flows and a protected read-only admin users panel are implemented; integration readiness and exact verification are tracked in PROJECT_PROGRESS.md. No live trading, orders or payments are accepted. Large-scale backend readiness has not been established.

The owner approved both ecosystems at first release, an Uzbekistan/nearby-region audience, initial listings/P2P, hybrid clothing supply (own products + independent sellers) and UZS as the primary currency. Visa and later cryptocurrency payment capabilities are requested, alongside both direct-seller and platform payment-flow possibilities. Providers, operating entity, crypto assets/networks and operating rules remain undecided. See [requirements and decision log](PRODUCT_REQUIREMENTS.md).

## Run locally
Node 20.19+ (tested with 20.19), npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000; `/` enters `/uz/marketplace`. Public browsing needs no environment variables. Account/admin flows require the dedicated Supabase project, `.env.local` based on `.env.example`, the versioned migration and auth/email setup described in [account setup](docs/ACCOUNTS_SETUP.md). Marketplace routes:

- `/{locale}/marketplace` — shared entry; `locale` is `uz`, `ru` or `en`.
- `/{locale}/marketplace/cs2` and `/fashion` — separate sample catalogs.
- `/{locale}/marketplace/{ecosystem}/{sampleId}` — sample detail; clothing size demonstration.
- `/{locale}/marketplace/how-it-works` — current commerce boundaries and planned model.
- `/storefront-preview` — preserved original homepage. Existing `/katalog`, `/mahsulot/*`, `/savat`, `/sevimlilar`, `/hisob`, `/checkout` and `/malumot/*` retain their behavior.
- `/{locale}/account` — real profile/settings workspace; sign-in redirect for visitors. Registration, login, recovery, confirmation and `/resend-confirmation` routes live under this path.
- `/{locale}/admin` and `/{locale}/admin/users` — server-authorized read-only users workspace with literal name search, language filtering and pagination; UUID-based owner bootstrap is documented in account setup.
- `/hisob` remains a legacy account entry linking to the new localized account flow; browser cart/favorites are not merged into account data.

Configure the temporary brand and development defaults in `src/lib/config.ts`. Marketplace customer text is in `src/messages/marketplace.ts`, and sample records in `src/data/marketplace-samples.ts`. Original storefront dictionaries and fixtures remain separate. UZS is owner-selected, but displayed prices remain illustrative and no payments are accepted. Old browser cart data is not imported into marketplace records or real orders.

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
