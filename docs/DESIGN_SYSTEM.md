# ORO design system

Historical storefront guidance/delivery. The approved marketplace frontend now has separate route-group layouts and locale routes; the old home is at `/storefront-preview` and other original public routes remain. See [current progress](../PROJECT_PROGRESS.md), [requirements](../PRODUCT_REQUIREMENTS.md) and [marketplace scope](MARKETPLACE_PHASE1_PROPOSAL.md). Historical phase numbers and source paths below do not describe marketplace completion.

Temporary identity: ORO, configured in src/lib/config.ts. The design concept is saved in docs/design/concept.png; differences from the implementation are documented in ARCHITECTURE.md.

## Semantic palette

| Role | Light | Dark |
| --- | --- | --- |
| Background | #F8F7F4 | #151817 |
| Text | #262B24 | #F4F3EF |
| Surface | #EEECE6 | #202422 |
| Secondary text | #62675F | #ADB3AD |
| Primary action | #9A5335 | #D4A184 |
| Action text | #FFFFFF | #151817 |
| Border | #DFDFD7 | #3C423D |

Variables in src/app/globals.css are the authority. Components use semantic Tailwind colors or CSS variables. Focus rings use the accent. Product photography retains its natural colors across themes.

## Typography and layout
Cormorant Garamond 400/500 provides editorial display typography; DM Sans 400/500/600 provides readable UI and body text. Fonts are bundled locally with OFL notices in docs/licenses. Display headings scale between 44–82px; section headings between 34–51px. Short UI labels use restrained tracking. Product names use body typography at the appropriate semantic heading level.

Content is capped at 1600px. Desktop gutters are 4.2%; mobile gutters 5–6%. Sections use 48–76px vertical padding. Four product columns on desktop and tablet, two on mobile. Hero and story become stacked layouts at 760px. Tablet navigation reduces nonessential links and keeps direct account access visible above 760px. At 760px and below, mobile navigation uses an accessible sheet with account access.

## Component and interaction rules
Open product tiles, square image frames and controls, thin rules, no general card shadows. Circular wishlist buttons have a consistent compact affordance. Main actions use terracotta; secondary navigation uses text links with small arrows. Product images use a restrained scale hover; sheets use Radix focus management and Escape behavior. Reduced-motion disables animation and transitions. Theme, wishlist and cart are persisted locally; no production commerce promise is implied.

Use native labels and inputs, semantic headings, a skip link, meaningful image text, explicit modal titles/descriptions, and visible keyboard focus. Preserve all loading, unavailable, empty, error and checkout-boundary states when extending the system.
