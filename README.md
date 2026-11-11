# ORO — CS2 and clothing marketplace preview

Three-language marketplace frontend for CS2 skin browsing and clothing, alongside the preserved original storefront. Uzbek, Russian and English; sample-only catalog, search/type/sort filters and detail pages. No live trading, orders or payments are accepted. Large-scale backend readiness has not been established.

The owner approved both ecosystems at first release, an Uzbekistan/nearby-region audience, initial listings/P2P, hybrid clothing supply (own products + independent sellers) and UZS as the primary currency. Visa and later cryptocurrency payment capabilities are requested, alongside both direct-seller and platform payment-flow possibilities. Providers, operating entity, crypto assets/networks and operating rules remain undecided. See [requirements and decision log](PRODUCT_REQUIREMENTS.md).

## Run locally
Node 20.19+ (tested with 20.19), npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000; `/` enters `/uz/marketplace`. No environment variables required. Marketplace routes:

- `/{locale}/marketplace` — shared entry; `locale` is `uz`, `ru` or `en`.
- `/{locale}/marketplace/cs2` and `/fashion` — separate sample catalogs.
- `/{locale}/marketplace/{ecosystem}/{sampleId}` — sample detail; clothing size demonstration.
- `/{locale}/marketplace/how-it-works` — current commerce boundaries and planned model.
- `/storefront-preview` — preserved original homepage. Existing `/katalog`, `/mahsulot/*`, `/savat`, `/sevimlilar`, `/hisob`, `/checkout` and `/malumot/*` retain their behavior.

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

Playwright starts a production server on 127.0.0.1:3000. Stop any development server on that port first. Screenshots and traces are written under /tmp. For production preview: `npm run build && npm start`.

See [marketplace migration scope](docs/MARKETPLACE_PHASE1_PROPOSAL.md), [marketplace design specification](docs/design/marketplace/DESIGN.md), [historical storefront architecture](docs/ARCHITECTURE.md), [historical milestones](docs/MILESTONES.md), [progress and evidence](PROJECT_PROGRESS.md), [engineering rules](AGENTS.md) and [image sources](docs/ASSETS.md).

## Tooling
The existing Next.js/React/TypeScript/Tailwind stack is retained. Two App Router route groups provide independent legacy and localized marketplace root layouts; crossing between them causes a full document navigation. Server Components own catalogs and detail data; theme/language navigation is a small client island. shadcn components use the existing Radix and utility dependencies. Build Web Apps, built-in imagegen, React and shadcn guidance informed the frontend work. Browser plugin is unavailable; validation uses repository Playwright Chromium. No formal security scan, live Steam/API validation or load test has been claimed.

## Verification

Fresh `npm run check` passed strict TypeScript, lint, 17 unit cases and the production build (46 generated pages). `CI=1 npm run test:e2e -- --max-failures=1` passed all 36 Chromium cases across desktop, tablet and mobile, including saved-theme console checks. Evidence, screenshots, independent review and limits are recorded in [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md). Original storefront delivery remains documented in [Phase 1 delivery](docs/PHASE1_DELIVERY.md); those phase numbers refer to historical storefront work, not marketplace completion. Eight moderate development lint-chain advisories remain recorded; no forced dependency downgrade was applied.
