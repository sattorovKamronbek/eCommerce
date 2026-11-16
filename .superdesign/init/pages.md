# Complete source dependency trees

Traced recursively from local relative and `@/` imports, including type imports, re-exports and CSS side effects; external/node_modules dependencies are omitted. Repeated branches are retained so each tree is complete. Assets referenced by URL are listed separately below. Every key page also depends on its enclosing root layout; its complete tree is shown per page to make the candidate context set explicit. Trees are candidates: apply Superdesign payload budgeting before passing files, and prefer theme.md Part 1 over all globals.css when possible.

## `/` — Entry

Entry: `src/app/(storefront)/page.tsx`

Server redirect to `/uz/marketplace` using marketplaceConfig.defaultLocale.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(storefront)/page.tsx
  - src/lib/config.ts
- src/app/(storefront)/layout.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/header.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
    - src/components/theme-toggle.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
    - src/components/ui/sheet.tsx
      - src/lib/utils.ts
    - src/components/cart-content.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
      - src/data/products.ts
      - src/lib/money.ts
        - src/lib/config.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/components/ui/button.tsx
        - src/lib/utils.ts
  - src/components/footer.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
  - src/lib/config.ts
  - src/app/globals.css
```

## `/{uz|ru|en}/marketplace` — MarketplaceHome

Entry: `src/app/(marketplace)/[locale]/marketplace/page.tsx`

Sidebarless editorial home: left headline/actions and staggered destination pair on the right, then three shared sample cards under localized editTitle/editIntro. Cards use h3 in the edit and one accessible link per item.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(marketplace)/[locale]/marketplace/page.tsx
  - src/components/ui/button.tsx
    - src/lib/utils.ts
  - src/components/marketplace/sample-card.tsx
    - src/data/marketplace-samples.ts
    - src/lib/marketplace.ts
      - src/data/marketplace-samples.ts
      - src/messages/marketplace.ts
        - src/lib/config.ts
        - src/data/marketplace-samples.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
  - src/data/marketplace-samples.ts
  - src/messages/marketplace.ts
    - src/lib/config.ts
    - src/data/marketplace-samples.ts
- src/app/(marketplace)/[locale]/layout.tsx
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/marketplace/frame.tsx
    - src/lib/config.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
    - src/components/ui/native-select.tsx
      - src/lib/utils.ts
  - src/components/marketplace/footer.tsx
    - src/lib/config.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
  - src/lib/config.ts
  - src/messages/marketplace.ts
    - src/lib/config.ts
    - src/data/marketplace-samples.ts
  - src/app/globals.css
  - src/components/marketplace/styles.css
```

## `/{uz|ru|en}/marketplace/{cs2|fashion}` — CatalogPage

Entry: `src/app/(marketplace)/[locale]/marketplace/[ecosystem]/page.tsx`

Server-rendered catalog with localized typeNavigation and category links preserving q/sort. GET q/type/sort, clear/empty state, shared sample-card.tsx and filter context serialized into details by sampleFilterQuery.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(marketplace)/[locale]/marketplace/[ecosystem]/page.tsx
  - src/components/marketplace/catalog.tsx
    - src/data/marketplace-samples.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
    - src/lib/marketplace.ts
      - src/data/marketplace-samples.ts
      - src/messages/marketplace.ts
        - src/lib/config.ts
        - src/data/marketplace-samples.ts
    - src/components/marketplace/sample-card.tsx
      - src/data/marketplace-samples.ts
      - src/lib/marketplace.ts
        - src/data/marketplace-samples.ts
        - src/messages/marketplace.ts
          - src/lib/config.ts
          - src/data/marketplace-samples.ts
      - src/messages/marketplace.ts
        - src/lib/config.ts
        - src/data/marketplace-samples.ts
    - src/components/ui/button.tsx
      - src/lib/utils.ts
    - src/components/ui/input.tsx
      - src/lib/utils.ts
    - src/components/ui/field.tsx
      - src/lib/utils.ts
      - src/components/ui/label.tsx
        - src/lib/utils.ts
      - src/components/ui/separator.tsx
        - src/lib/utils.ts
    - src/components/ui/native-select.tsx
      - src/lib/utils.ts
    - src/components/ui/alert.tsx
      - src/lib/utils.ts
    - src/components/ui/empty.tsx
      - src/lib/utils.ts
  - src/messages/marketplace.ts
    - src/lib/config.ts
    - src/data/marketplace-samples.ts
- src/app/(marketplace)/[locale]/layout.tsx
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/marketplace/frame.tsx
    - src/lib/config.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
    - src/components/ui/native-select.tsx
      - src/lib/utils.ts
  - src/components/marketplace/footer.tsx
    - src/lib/config.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
  - src/lib/config.ts
  - src/messages/marketplace.ts
    - src/lib/config.ts
    - src/data/marketplace-samples.ts
  - src/app/globals.css
  - src/components/marketplace/styles.css
```

## `/{uz|ru|en}/marketplace/{cs2|fashion}/[sampleId]` — SamplePage

Entry: `src/app/(marketplace)/[locale]/marketplace/[ecosystem]/[sampleId]/page.tsx`

Illustrative sample detail with standalone sample-price block and not-for-sale qualification. Query q/type/sort is passed through to the return link; ecosystem guard and demo clothing size radios remain. No purchase.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(marketplace)/[locale]/marketplace/[ecosystem]/[sampleId]/page.tsx
  - src/components/marketplace/catalog.tsx
    - src/data/marketplace-samples.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
    - src/lib/marketplace.ts
      - src/data/marketplace-samples.ts
      - src/messages/marketplace.ts
        - src/lib/config.ts
        - src/data/marketplace-samples.ts
    - src/components/marketplace/sample-card.tsx
      - src/data/marketplace-samples.ts
      - src/lib/marketplace.ts
        - src/data/marketplace-samples.ts
        - src/messages/marketplace.ts
          - src/lib/config.ts
          - src/data/marketplace-samples.ts
      - src/messages/marketplace.ts
        - src/lib/config.ts
        - src/data/marketplace-samples.ts
    - src/components/ui/button.tsx
      - src/lib/utils.ts
    - src/components/ui/input.tsx
      - src/lib/utils.ts
    - src/components/ui/field.tsx
      - src/lib/utils.ts
      - src/components/ui/label.tsx
        - src/lib/utils.ts
      - src/components/ui/separator.tsx
        - src/lib/utils.ts
    - src/components/ui/native-select.tsx
      - src/lib/utils.ts
    - src/components/ui/alert.tsx
      - src/lib/utils.ts
    - src/components/ui/empty.tsx
      - src/lib/utils.ts
  - src/data/marketplace-samples.ts
  - src/messages/marketplace.ts
    - src/lib/config.ts
    - src/data/marketplace-samples.ts
- src/app/(marketplace)/[locale]/layout.tsx
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/marketplace/frame.tsx
    - src/lib/config.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
    - src/components/ui/native-select.tsx
      - src/lib/utils.ts
  - src/components/marketplace/footer.tsx
    - src/lib/config.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
  - src/lib/config.ts
  - src/messages/marketplace.ts
    - src/lib/config.ts
    - src/data/marketplace-samples.ts
  - src/app/globals.css
  - src/components/marketplace/styles.css
```

## `/{uz|ru|en}/marketplace/how-it-works` — HowItWorks

Entry: `src/app/(marketplace)/[locale]/marketplace/how-it-works/page.tsx`

Localized implementation/commerce boundaries and proposed ecosystem directions.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(marketplace)/[locale]/marketplace/how-it-works/page.tsx
  - src/messages/marketplace.ts
    - src/lib/config.ts
    - src/data/marketplace-samples.ts
  - src/components/marketplace/catalog.tsx
    - src/data/marketplace-samples.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
    - src/lib/marketplace.ts
      - src/data/marketplace-samples.ts
      - src/messages/marketplace.ts
        - src/lib/config.ts
        - src/data/marketplace-samples.ts
    - src/components/marketplace/sample-card.tsx
      - src/data/marketplace-samples.ts
      - src/lib/marketplace.ts
        - src/data/marketplace-samples.ts
        - src/messages/marketplace.ts
          - src/lib/config.ts
          - src/data/marketplace-samples.ts
      - src/messages/marketplace.ts
        - src/lib/config.ts
        - src/data/marketplace-samples.ts
    - src/components/ui/button.tsx
      - src/lib/utils.ts
    - src/components/ui/input.tsx
      - src/lib/utils.ts
    - src/components/ui/field.tsx
      - src/lib/utils.ts
      - src/components/ui/label.tsx
        - src/lib/utils.ts
      - src/components/ui/separator.tsx
        - src/lib/utils.ts
    - src/components/ui/native-select.tsx
      - src/lib/utils.ts
    - src/components/ui/alert.tsx
      - src/lib/utils.ts
    - src/components/ui/empty.tsx
      - src/lib/utils.ts
- src/app/(marketplace)/[locale]/layout.tsx
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/marketplace/frame.tsx
    - src/lib/config.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
    - src/components/ui/native-select.tsx
      - src/lib/utils.ts
  - src/components/marketplace/footer.tsx
    - src/lib/config.ts
    - src/messages/marketplace.ts
      - src/lib/config.ts
      - src/data/marketplace-samples.ts
  - src/lib/config.ts
  - src/messages/marketplace.ts
    - src/lib/config.ts
    - src/data/marketplace-samples.ts
  - src/app/globals.css
  - src/components/marketplace/styles.css
```

## `/storefront-preview` — Home

Entry: `src/app/(storefront)/storefront-preview/page.tsx`

Retained original editorial storefront home, collections, new arrivals and information links.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(storefront)/storefront-preview/page.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/components/product-card.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/data/products.ts
    - src/lib/money.ts
      - src/lib/config.ts
    - src/components/wishlist-button.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
  - src/data/products.ts
  - src/components/ui/button.tsx
    - src/lib/utils.ts
- src/app/(storefront)/layout.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/header.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
    - src/components/theme-toggle.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
    - src/components/ui/sheet.tsx
      - src/lib/utils.ts
    - src/components/cart-content.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
      - src/data/products.ts
      - src/lib/money.ts
        - src/lib/config.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/components/ui/button.tsx
        - src/lib/utils.ts
  - src/components/footer.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
  - src/lib/config.ts
  - src/app/globals.css
```

## `/katalog` — Catalog

Entry: `src/app/(storefront)/katalog/page.tsx`

Legacy Uzbek catalog; GET q, tur, narx, sort, mavjud, yangi; fixture products.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(storefront)/katalog/page.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/data/products.ts
  - src/lib/catalog.ts
    - src/data/products.ts
  - src/components/product-card.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/data/products.ts
    - src/lib/money.ts
      - src/lib/config.ts
    - src/components/wishlist-button.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
  - src/components/ui/button.tsx
    - src/lib/utils.ts
- src/app/(storefront)/layout.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/header.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
    - src/components/theme-toggle.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
    - src/components/ui/sheet.tsx
      - src/lib/utils.ts
    - src/components/cart-content.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
      - src/data/products.ts
      - src/lib/money.ts
        - src/lib/config.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/components/ui/button.tsx
        - src/lib/utils.ts
  - src/components/footer.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
  - src/lib/config.ts
  - src/app/globals.css
```

## `/mahsulot/[slug]` — ProductDetail

Entry: `src/app/(storefront)/mahsulot/[slug]/page.tsx`

Legacy illustrative product detail, fixture quantity/color choices, browser cart, related items.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(storefront)/mahsulot/[slug]/page.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/data/products.ts
  - src/lib/money.ts
    - src/lib/config.ts
  - src/components/product-purchase.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/data/products.ts
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
    - src/components/ui/button.tsx
      - src/lib/utils.ts
  - src/components/product-card.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/data/products.ts
    - src/lib/money.ts
      - src/lib/config.ts
    - src/components/wishlist-button.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
- src/app/(storefront)/layout.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/header.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
    - src/components/theme-toggle.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
    - src/components/ui/sheet.tsx
      - src/lib/utils.ts
    - src/components/cart-content.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
      - src/data/products.ts
      - src/lib/money.ts
        - src/lib/config.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/components/ui/button.tsx
        - src/lib/utils.ts
  - src/components/footer.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
  - src/lib/config.ts
  - src/app/globals.css
```

## `/savat` — CartPage

Entry: `src/app/(storefront)/savat/page.tsx`

Dedicated retained browser cart; totals are development estimates.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(storefront)/savat/page.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/components/cart-content.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
    - src/data/products.ts
    - src/lib/money.ts
      - src/lib/config.ts
    - src/lib/cart.ts
      - src/data/products.ts
    - src/components/ui/button.tsx
      - src/lib/utils.ts
- src/app/(storefront)/layout.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/header.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
    - src/components/theme-toggle.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
    - src/components/ui/sheet.tsx
      - src/lib/utils.ts
    - src/components/cart-content.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
      - src/data/products.ts
      - src/lib/money.ts
        - src/lib/config.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/components/ui/button.tsx
        - src/lib/utils.ts
  - src/components/footer.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
  - src/lib/config.ts
  - src/app/globals.css
```

## `/sevimlilar` — Wishlist

Entry: `src/app/(storefront)/sevimlilar/page.tsx`

Browser-persisted retained wishlist and empty state.

Dependencies (entry + implicit App Router root layout):

```text
- src/app/(storefront)/sevimlilar/page.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/stores/shop.ts
    - src/lib/cart.ts
      - src/data/products.ts
    - src/data/products.ts
  - src/data/products.ts
  - src/components/product-card.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/data/products.ts
    - src/lib/money.ts
      - src/lib/config.ts
    - src/components/wishlist-button.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
- src/app/(storefront)/layout.tsx
  - src/messages/index.ts
    - src/lib/config.ts
    - src/messages/uz.ts
    - src/messages/interface.ts
  - src/components/providers.tsx
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
  - src/components/header.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
    - src/components/theme-toggle.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
    - src/stores/shop.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/data/products.ts
    - src/components/ui/sheet.tsx
      - src/lib/utils.ts
    - src/components/cart-content.tsx
      - src/messages/index.ts
        - src/lib/config.ts
        - src/messages/uz.ts
        - src/messages/interface.ts
      - src/stores/shop.ts
        - src/lib/cart.ts
          - src/data/products.ts
        - src/data/products.ts
      - src/data/products.ts
      - src/lib/money.ts
        - src/lib/config.ts
      - src/lib/cart.ts
        - src/data/products.ts
      - src/components/ui/button.tsx
        - src/lib/utils.ts
  - src/components/footer.tsx
    - src/messages/index.ts
      - src/lib/config.ts
      - src/messages/uz.ts
      - src/messages/interface.ts
    - src/lib/config.ts
  - src/lib/config.ts
  - src/app/globals.css
```

## Local asset references (not code imports)

- Marketplace hero: `/images/marketplace/rifle.png`, `/images/marketplace/puffer.png`; selected home edit uses violet-rifle, steel-knife and sand-overshirt fixtures through shared SampleCard.
- Marketplace fixtures: rifle.png, knife.png, puffer.png, overshirt.png under `/images/marketplace/`; six fixture records reuse four images, with reuse disclosed in copy.
- Legacy home: hero.jpg, bag-editorial.jpg, table-editorial.jpg, textile-editorial.jpg, vase-editorial.jpg, interior.jpg under `/images/`; product fixture imagery comes from products.ts.
- Identity: `src/app/icon.svg`, `src/app/favicon.ico`; UI wordmarks render the configured text ORO. The SVG favicon is a separate asset, not the rendered page wordmark.
- Fonts: node_modules @fontsource packages imported by globals.css; not recursively dumped.

## Source styling and navigation

Marketplace locale layout imports `src/app/globals.css` for base/legacy foundations and `src/components/marketplace/styles.css` for the scoped redesign; both are explicit tree dependencies. The legacy layout imports globals.css only. `src/components/marketplace/sample-card.tsx` is shared by home/catalog; its single detail link uses `sampleFilterQuery`. Catalog type navigation preserves search/sort, detail preserves filter context on return, and locale switching preserves the current query.

## State and commerce boundaries

Only the legacy cart/wishlist use `src/stores/shop.ts` (Zustand browser persistence), backed by `src/data/products.ts` and defensive `src/lib/cart.ts` normalization. New marketplace fixture IDs stay outside that cart. Do not turn sample totals into authoritative prices, introduce fake seller data/ratings/metrics, or imply functional accounts, checkout, Steam integration, delivery or payment.
