# Editorial marketplace redesign — 2026-11-11

The owner explicitly selected a substantially new design after the skill audit.
The previous DESIGN.md and its concepts are historical references. Current source
specification: ../../superpowers/specs/2026-11-11-marketplace-editorial-redesign.md.

## Tools and references

- Superdesign CLI v0.14.0: authenticated preflight, reference search, and fetched
  `bold-editorial-studio-style`. Used its typography, asymmetry, open media and
  fine-border suggestions. Omitted custom cursors, marquees and grayscale effects
  because those do not serve the marketplace's accessible browsing workflows.
  No remote canvas draft was created and no Superdesign generation credits spent.
- Build Web Apps frontend builder/testing skills: concept-first implementation,
  semantic shadcn controls, responsive and rendered verification.
- Vercel React/composition skills: Server Components, focused shared SampleCard,
  explicit heading-level prop, native URL state, existing small theme island.
- Vercel Web Interface Guidelines fetched from the official source at review time.
- Built-in Imagegen generated both concepts below. No image API CLI or API key.
- Browser plugin unavailable; production Chromium Playwright is the fallback.
  Impeccable remains unavailable; no installation/dependency changes were needed.

## Saved concepts and prompt set

`redesign-home-concept.png`: complete desktop ORO homepage, cool white #f7f8fa,
navy #11151a, lime #d0f36b, DM Sans and serif wordmark. Asymmetric large left
headline “Your next look. / In game. In life.”, subtitle and Explore skins / Explore
clothing CTAs; two offset product images at right with captions beneath; “The
sample edit.” with three existing sample records and a slim footer. Required the
development notice and no fake metrics, ratings, sellers or purchase actions.

`redesign-cs2-concept.png`: complete dark CS2 catalog with large split title/intro,
URL-based type navigation, horizontal Search / Type / Sort / Apply toolbar, three
open media-led sample cards, sample prices and trading-unavailable boundary. No
sidebar, fake Steam metadata, stock, verification or live-commerce actions.

Concepts use generated objects and illustrative numbers. Production reuses the
four existing standalone source assets in public/images/marketplace/ and the
unchanged fixture prices. Native controls, actual localized text, truthful sample
qualification and keyboard/touch requirements take precedence over generated UI
artifacts. No mockup screenshot is used as a page background or control.

## Fidelity and accessibility ledger

Both concepts and actual production captures are inspected with view_image.
Desktop home and CS2 are captured at 1536×1024; localized mobile and tablet
surfaces are checked separately. Production screenshots live outside the checkout
under /home/kamron/.codex/artifacts/ecommerce-redesign-20261111/.

- Preserved the asymmetric heading/dual media composition, fine separators,
  display hierarchy, offset fashion frame, open cards and navy/lime CS2 identity.
- Tightened header/hero spacing, adjusted hero media proportions and aligned
  desktop filter labels horizontally after the first screenshot comparison.
- Added sample price/illustration disclosure to home cards, preserving the
  existing fixture values rather than copying mockup numbers.
- Native controls retain three theme choices; 120px phone theme width keeps the
  Russian selected label readable. Forms stack on smaller viewports.
- Keyboard review reproduced skip-link text/background contrast of 1:1; scoped
  text color restores visibility. Explicit light CS2 uses a dark active underline.
- Category navigation has its own translated landmark name, distinct from the
  Type form label. Linked cards have one keyboard stop with an associated heading.
- Shared legacy definition-list grid is reset within marketplace details so
  Category/Availability remain readable specification rows on phones.
- Reading query state on the server made detail pages dynamic; invalid item paths
  then reached a streaming 200 response. A route-segment restriction alone did
  not resolve that behavior in the installed runtime. Sample details now retain
  their original static rendering and validation. Only the return-link query
  handling lives in the existing client navigation module under a small Suspense
  boundary, with a usable catalog-link fallback. See the [Next.js static-query
  pattern](https://nextjs.org/docs/app/api-reference/functions/use-search-params#static-rendering).

Current verification counts and remaining platform limits are recorded in
PROJECT_PROGRESS.md. No live commerce, backend, security or real-device readiness
is implied by visual/browser checks.
