# Marketplace editorial redesign

2026-11-11. The owner requested implementation with plugins/skills and selected
“Create a substantially new design.” This approves the frontend redesign; existing
commercial decision gates in PRODUCT_REQUIREMENTS.md continue to apply.

## Direction and approaches

The earlier audit recommended targeted polishing. The owner instead selected a
substantial redesign. Use an asymmetric editorial home and open catalog layout,
retaining the existing Next.js application and functional routes. A new framework,
backend or checkout is outside this task. Implementation details below are builder
decisions within the requested redesign, not newly confirmed business requirements.

## Visual specification

- Reference: `docs/design/marketplace/redesign-home-concept.png` and
  `redesign-cs2-concept.png`, generated with built-in Imagegen. Superdesign's
  authenticated reference search and editorial style guide inform composition.
- Cool white #f7f8fa, ink/navy #11151a, lime #d0f36b, gray surfaces and fine borders.
  DM Sans interface/display, existing serif ORO wordmark. ORO remains temporary.
- Home: left-aligned display heading and two destination CTAs; two tall product
  images to the right with captions below. Three existing sample records follow
  under “The sample edit.” No invented ratings, seller claims or business metrics.
- Catalog: large split title/introduction, type navigation, horizontal native
  search/type/sort toolbar, open three-column media-led listings, explicit sample
  prices and trading-unavailable notice. Fashion extends the same system in light.
- Detail: split generous image and editorial description/price/specifications;
  existing accessible size radios remain demonstrative.
- Desktop composition reflows to stacked content on phones. Controls retain
  comfortable touch targets; translated labels wrap without horizontal overflow.
  Preserve keyboard focus, skip link, reduced motion and light/dark/system modes.
- Concept numbers and object details are illustrative: implementation retains the
  fixture prices and original standalone images, which may differ from mockups.

## Behavior and architecture

Server Components own all sample catalogs/home/details. Only the existing
navigation/theme island is interactive. Add URL-based type shortcuts preserving
search/sort and carry filter context through sample details and language changes.
Use existing shadcn primitives, explicit card heading levels, localized copy in
src/messages, and brand configuration in src/lib/config.ts. No new dependencies.

Preserve `/storefront-preview`, other original routes, cart/wishlist identities,
all three locales and development-only item boundaries. No authentication,
payments, orders, Steam integration, stock claims, seller mutations or backend.

## Verification

Test URL serialization and query encoding before implementing filter-context
behavior. Exercise category navigation, detail return, home discovery, keyboard
skip/focus, translated 320px layouts and existing journeys in Playwright. Run
strict typecheck, lint, unit tests, production build, full existing plus new e2e
suite, axe checks and visual comparisons against both concepts. Use regular
Playwright because Browser plugin is unavailable. Keep QA artifacts outside repo;
record current evidence and limitations in PROJECT_PROGRESS.md.
