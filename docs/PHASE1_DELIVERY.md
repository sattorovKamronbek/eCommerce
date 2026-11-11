# Phase 1 delivery inventory

Historical storefront guidance/delivery. The approved marketplace frontend now has separate route-group layouts and locale routes; the old home is at `/storefront-preview` and other original public routes remain. See [current progress](../PROJECT_PROGRESS.md), [requirements](../PRODUCT_REQUIREMENTS.md) and [marketplace scope](MARKETPLACE_PHASE1_PROPOSAL.md). Historical phase numbers and source paths below do not describe marketplace completion.

## Customer surfaces
- `/`: editorial homepage with responsive navigation, hero, selected products, collections, story, arrivals, service information and footer.
- `/katalog`: URL-driven keyword/category/price/availability/sort controls, new arrivals and empty results.
- `/mahsulot/[slug]`: static product details, single-image gallery foundation, color/quantity selection, unavailable states and related products.
- `/savat`, cart sheet, `/sevimlilar`: local persistence and fixture validation; no order creation.
- `/hisob`, `/checkout`: explicit unavailable-service boundaries; no fake sign-in/payment or collection of customer data.
- `/malumot/[slug]`: truthful development-stage store information, shipping/returns/contact/privacy.
- Loading, error and unknown-product/not-found routes.

## Files created or modified

| Group | Main files |
| --- | --- |
| Application routes | `src/app/layout.tsx`, `page.tsx`, `globals.css`, route folders above, `loading.tsx`, `error.tsx`, `not-found.tsx`, `icon.svg` |
| Design and interactions | `src/components/header.tsx`, `footer.tsx`, `product-card.tsx`, `product-purchase.tsx`, `cart-content.tsx`, `wishlist-button.tsx`, `theme-toggle.tsx`, `providers.tsx`, `ui/button.tsx`, `ui/sheet.tsx` |
| Data and state | `src/data/products.ts`, `src/stores/shop.ts`, `src/lib/cart.ts`, `catalog.ts`, `money.ts`, `config.ts`, `utils.ts` |
| Localization | `src/messages/index.ts`, `uz.ts`, `interface.ts` |
| Tooling | `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `.gitignore` |
| Tests | `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`, `tests/e2e/storefront.spec.ts`, `src/lib/commerce.test.ts`, `src/components/product-purchase.test.tsx` |
| Assets | `public/images/hero.jpg`, four `*-editorial.jpg` product images, development stock photos, `docs/design/concept.png`, font OFL notices |
| Documentation | `AGENTS.md`, `README.md`, `PROJECT_PROGRESS.md`, `docs/ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `MILESTONES.md`, `ASSETS.md`, this inventory |

## Verification method
Use `npm run check` and then `npm run test:e2e` so browser tests always run against a completed production build. Chromium covers desktop 1280×720, tablet 834×1112, and mobile 390×664 with mobile emulation. Tests check page identity/content, all homepage image decoding, overflow, light/dark accessibility, theme persistence, search success/empty results, price/availability filtering, quantity changes/cart persistence/removal, wishlist persistence, unavailable stock, mobile menu, account navigation in desktop/tablet/mobile layouts, explicit checkout boundary and unknown products. Catalog/detail/cart sheet receive axe checks; Escape returns focus to the cart trigger.

Browser plugin was unavailable; Playwright was used. Screenshots and traces are written outside the repository under `/tmp`. Chromium emulation does not replace real Safari/Firefox/mobile-device testing. Automated axe results do not constitute a complete manual accessibility audit.

Final observed results are recorded in PROJECT_PROGRESS.md.
