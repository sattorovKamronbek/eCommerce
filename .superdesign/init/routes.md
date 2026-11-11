# Routes

Next.js App Router file-based routing; `(marketplace)` and `(storefront)` are pathless groups. No React Router/router config exists. `next.config.ts` does not define rewrites or redirects; `/` redirects in its page component. Marketplace locale and ecosystem guards call `notFound()` for unsupported values; samples are development fixtures.

| URL | Component / source | Root layout | Behavior |
| --- | --- | --- | --- |
| `/` | Entry: `src/app/(storefront)/page.tsx` | `src/app/(storefront)/layout.tsx` | Server redirect to `/uz/marketplace` using marketplaceConfig.defaultLocale. |
| `/{uz|ru|en}/marketplace` | MarketplaceHome: `src/app/(marketplace)/[locale]/marketplace/page.tsx` | `src/app/(marketplace)/[locale]/layout.tsx` | Sidebarless editorial home: left headline/actions, staggered destination images to the right, then a three-sample edit with reusable single-link cards. |
| `/{uz|ru|en}/marketplace/{cs2|fashion}` | CatalogPage: `src/app/(marketplace)/[locale]/marketplace/[ecosystem]/page.tsx` | `src/app/(marketplace)/[locale]/layout.tsx` | Server-rendered sample catalog; localized type-navigation links; GET q/type/sort, reset and truthful empty state; cards preserve filters into details. |
| `/{uz|ru|en}/marketplace/{cs2|fashion}/[sampleId]` | SamplePage: `src/app/(marketplace)/[locale]/marketplace/[ecosystem]/[sampleId]/page.tsx` | `src/app/(marketplace)/[locale]/layout.tsx` | Illustrative detail; reads q/type/sort context for back link; matching ecosystem required; separate sample-price display and demo fashion sizes; no purchase. |
| `/{uz|ru|en}/marketplace/how-it-works` | HowItWorks: `src/app/(marketplace)/[locale]/marketplace/how-it-works/page.tsx` | `src/app/(marketplace)/[locale]/layout.tsx` | Localized implementation/commerce boundaries and proposed ecosystem directions. |
| `/storefront-preview` | Home: `src/app/(storefront)/storefront-preview/page.tsx` | `src/app/(storefront)/layout.tsx` | Retained original editorial storefront home, collections, new arrivals and information links. |
| `/katalog` | Catalog: `src/app/(storefront)/katalog/page.tsx` | `src/app/(storefront)/layout.tsx` | Legacy Uzbek catalog; GET q, tur, narx, sort, mavjud, yangi; fixture products. |
| `/mahsulot/[slug]` | ProductDetail: `src/app/(storefront)/mahsulot/[slug]/page.tsx` | `src/app/(storefront)/layout.tsx` | Legacy illustrative product detail, fixture quantity/color choices, browser cart, related items. |
| `/savat` | CartPage: `src/app/(storefront)/savat/page.tsx` | `src/app/(storefront)/layout.tsx` | Dedicated retained browser cart; totals are development estimates. |
| `/sevimlilar` | Wishlist: `src/app/(storefront)/sevimlilar/page.tsx` | `src/app/(storefront)/layout.tsx` | Browser-persisted retained wishlist and empty state. |
| `/checkout` | Checkout: `src/app/(storefront)/checkout/page.tsx` | `src/app/(storefront)/layout.tsx` | Truthful informational checkout-unavailable boundary, no order/payment creation. |
| `/hisob` | Account: `src/app/(storefront)/hisob/page.tsx` | `src/app/(storefront)/layout.tsx` | Truthful account-unavailable information; no fake authentication. |
| `/malumot/[slug]` | Info: `src/app/(storefront)/malumot/[slug]/page.tsx` | `src/app/(storefront)/layout.tsx` | Static information slugs: biz-haqimizda, yetkazib-berish, qaytarish, boglanish, maxfiylik. |

## Boundary files

- Marketplace: `src/app/(marketplace)/[locale]/marketplace/loading.tsx`, `error.tsx`, `not-found.tsx`; localized error/not-found handling and a loading status.
- Storefront: `src/app/(storefront)/loading.tsx`, `error.tsx`, `not-found.tsx`; preserved legacy states.
- Static assets: `src/app/icon.svg`, `src/app/favicon.ico`; imagery in `public/images/`.

## Runtime configuration

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { poweredByHeader: false };
export default nextConfig;
```

```ts
export const storeConfig = {
  name: "ORO",
  locale: "uz-UZ",
  currency: "UZS",
  catalogMode: "development",
} as const;

export const marketplaceConfig = {
  defaultLocale: "uz",
  locales: ["uz", "ru", "en"],
  mode: "development",
  sampleCurrency: "UZS",
} as const;
```

## Shared marketplace navigation and query helper

Customer copy remains in `src/messages/marketplace.ts`: `editTitle` / `editIntro` label the home selection; `typeNavigation` labels the accessible type navigation in uz/ru/en. Catalog type links preserve search/sort. Sample cards forward filter state to detail; detail reads it from searchParams and returns to the filtered catalog. `sampleFilterQuery` trims and caps q at 100 characters, URL-encodes with URLSearchParams, and omits default featured sorting. No client filter store or sidebar is introduced.

### `src/lib/marketplace.ts`

```ts
import { marketplaceSamples, type Ecosystem, type MarketplaceSample } from "@/data/marketplace-samples";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";

export type SampleFilters = { q?: string; type?: string; sort?: string };

export function sampleFilterQuery(filters: SampleFilters): string {
  const params = new URLSearchParams();
  const query = filters.q?.trim().slice(0, 100);
  if (query) params.set("q", query);
  if (filters.type) params.set("type", filters.type);
  if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function filterMarketplaceSamples(ecosystem: Ecosystem, locale: MarketplaceLocale, filters: SampleFilters): MarketplaceSample[] {
  const query = (filters.q ?? "").trim().slice(0, 100).toLocaleLowerCase(locale);
  const dictionary = marketplaceDictionaries[locale];
  const result = marketplaceSamples.filter((item) => item.ecosystem === ecosystem
    && (!filters.type || item.type === filters.type)
    && (!query || `${dictionary.items[item.id].name} ${dictionary.types[item.type]}`.toLocaleLowerCase(locale).includes(query)));
  if (filters.sort === "price-asc") result.sort((a, b) => a.samplePriceUzs - b.samplePriceUzs);
  if (filters.sort === "price-desc") result.sort((a, b) => b.samplePriceUzs - a.samplePriceUzs);
  return result;
}
export function formatSamplePrice(amount: number, locale: MarketplaceLocale): string {
  return `${new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US").format(amount)} UZS`;
}
```
