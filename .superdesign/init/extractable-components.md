# Extractable component menu

Existing reusable units only. Categories indicate layout versus basic DraftComponent candidates. Extract only target-relevant units; icons, text, CSS and image sources are hardcoded in a selected draft instance. Expose only real state/navigation props; locale chooses existing dictionaries rather than invented production functionality. No seller/admin/auth/dashboard component exists.

## MarketplaceFrame

- Source: `src/components/marketplace/frame.tsx`
- Category: layout
- Description: Sidebarless marketplace shell with underlined navigation, lime active locale, native theme control, visible development notice and focusable main skip target.
- Extractable props: locale; derive active navigation from current route; preference theme state; query-preserving navigation URLs.
- Hardcoded: ORO/configured wordmark, localized navigation labels, Lucide theme icons, all CSS. Footer/children remain composition slots.

## MarketplaceFooter

- Source: `src/components/marketplace/footer.tsx`
- Category: layout
- Description: Marketplace footer linking retained store and buying-information page.
- Extractable props: locale determines localized home/how links.
- Hardcoded: Configured ORO wordmark, localized tagline/link labels and all CSS.

## StorefrontHeader

- Source: `src/components/header.tsx`
- Category: layout
- Description: Preserved legacy sticky header with mobile nav/cart sheets.
- Extractable props: menu open state; browser cart quantity badgeCount; navigation destinations only when needed per draft.
- Hardcoded: Localized Uzbek labels, Lucide icon choices, wordmark, layout/CSS. Do not fabricate user/account state.

## StorefrontFooter

- Source: `src/components/footer.tsx`
- Category: layout
- Description: Preserved editorial footer and explicit development notice.
- Extractable props: navigation URLs only if target page changes them; otherwise none.
- Hardcoded: Localized copy, wordmark, information links and CSS.

## ThemeToggle

- Source: `src/components/theme-toggle.tsx`
- Category: basic
- Description: Compact legacy theme button.
- Extractable props: resolved light/dark state.
- Hardcoded: Sun/Moon icon choices, accessible copy and CSS.

## TradingBoundary

- Source: `src/components/marketplace/catalog.tsx`
- Category: basic
- Description: Localized informational notice that marketplace trading/payment/delivery are unavailable.
- Extractable props: locale only; no commercial status toggle in approved scope.
- Hardcoded: Info icon, localized boundary title/body, note semantics and CSS.

## SampleCard

- Source: `src/components/marketplace/sample-card.tsx`
- Category: basic
- Description: Single-link editorial sample card reused by the home edit and both ecosystem catalogs; image and qualified item copy share one accessible hit target.
- Extractable props: localized detail href with existing q/type/sort context; no duplicate action/link targets. Sample, locale and headingLevel remain source implementation bindings, not invented seller state.
- Hardcoded: Selected fixture image, item text, sample price qualification, illustration label, ArrowRight icon, CSS. Do not abstract content into invented seller/rating props.

## MarketplaceTypeNavigation

- Source: `src/components/marketplace/catalog.tsx`
- Category: basic
- Description: Inline category navigation above filters with localized typeNavigation label and active underline.
- Extractable props: active type; category hrefs preserving the existing q/sort context.
- Hardcoded: Existing ecosystem category labels, underline treatment and all CSS. This is inline source markup, not a separate React component.

## ProductCard

- Source: `src/components/product-card.tsx`
- Category: basic
- Description: Legacy product card used across four surfaces.
- Extractable props: detail href; saved state belongs to WishlistButton.
- Hardcoded: Selected development product content/image, new label, CSS; heading level is semantic implementation metadata.

## WishlistButton

- Source: `src/components/wishlist-button.tsx`
- Category: basic
- Description: Legacy persisted saved-item toggle.
- Extractable props: isActive derived from the existing selected fixture ID.
- Hardcoded: Heart icon, accessible copy, CSS; fixture ID remains an implementation binding.

## CartContent

- Source: `src/components/cart-content.tsx`
- Category: basic
- Description: Retained cart composition in header sheet and dedicated route.
- Extractable props: compact visibility/layout flag; existing fixture quantity and cart-count state.
- Hardcoded: Selected fixture imagery/copy, controls/icons, estimate qualification and CSS; no checkout-success states.

## Button

- Source: `src/components/ui/button.tsx`
- Category: basic
- Description: Shared action primitive with variants/sizes and link composition.
- Extractable props: href for links; disabled state where applicable.
- Hardcoded: Chosen variant/size per design, icon, label, CSS.

## NativeSelect

- Source: `src/components/ui/native-select.tsx`
- Category: basic
- Description: Native selection for theme/catalog fields.
- Extractable props: current selected state.
- Hardcoded: Field labels/options, chevron icon, sizing and CSS.

## Input

- Source: `src/components/ui/input.tsx`
- Category: basic
- Description: Shared search/native input.
- Extractable props: current query value, invalid/disabled state.
- Hardcoded: Label/placeholder, input type and CSS.

## Field

- Source: `src/components/ui/field.tsx`
- Category: basic
- Description: Shared label/content/description/error field composition.
- Extractable props: invalid/disabled state and associated control ID.
- Hardcoded: Field labels, selected layout and CSS.

## Alert

- Source: `src/components/ui/alert.tsx`
- Category: basic
- Description: Shared notice composition.
- Extractable props: visibility only if a real existing state requires it.
- Hardcoded: Alert icon, text, selected visual variant and CSS.

## Empty

- Source: `src/components/ui/empty.tsx`
- Category: basic
- Description: Shared catalog empty-result composition.
- Extractable props: reset/navigation href.
- Hardcoded: Empty title/body, chosen media/icon and CSS.

## Sheet

- Source: `src/components/ui/sheet.tsx`
- Category: basic
- Description: Legacy accessible mobile menu/cart overlay.
- Extractable props: open, showCloseButton, navigation URLs in composed content.
- Hardcoded: Chosen side, close X icon, content labels and CSS.

## Label

- Source: `src/components/ui/label.tsx`
- Category: basic
- Description: Accessible label primitive.
- Extractable props: htmlFor control binding.
- Hardcoded: Text and CSS.

## Separator

- Source: `src/components/ui/separator.tsx`
- Category: basic
- Description: Visual/semantic boundary primitive.
- Extractable props: none beyond real visibility needs.
- Hardcoded: Orientation, decorative setting, CSS.

