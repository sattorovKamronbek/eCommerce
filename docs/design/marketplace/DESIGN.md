# Marketplace frontend design specification

2026-11-11. Owner approved a combined additive preview and entry replacement, retaining the previous homepage. Generated concepts are implementation references, not a claim of owner-selected final branding.

References: `home-concept.png` and `cs2-concept.png` (1487×1058). Built-in imagegen generated these concepts and four separate media assets. Prompts requested an ORO two-destination home with the exact English dictionary copy, and a dark CS2 catalog with a three-card row, a native search/type/sort toolbar, development notice and explicit trading boundary. Standalone prompts isolated the purple game-rifle and olive puffer from the home concept, and generated a steel knife and sand overshirt in matching studios. These illustrations do not represent actual skin ownership, market prices or supplier inventory.

Design inventory before UI implementation:

- Home: slim header, full-width lime development notice, centered two-line headline, single subtitle, two side-by-side destination panels, slim footer. English copy follows the home concept; Uzbek/Russian are dictionary translations. No hero eyebrow or invented metrics.
- Catalog: same navigation, breadcrumb, 56px title, short introduction, one horizontal filter toolbar, sample count, three cards, a trading boundary and footer. Fashion uses the same component family in a light editorial surface.
- Tokens: home cool near-white `#f7f8fa`, ink `#11151a`; CS2 navy `#11151a`, surface `#1b2129`; accent lime `#d0f36b`, dark text on lime. Rounded media/cards 12px; no heavy shadows or image color overlays. Shared spacing 8/16/24/32/48/64.
- Typography: DM Sans for marketplace headings, body and controls; Cormorant Garamond for the retained ORO wordmark. Display 60–80px desktop / 40px mobile, catalog 52–60px, body 16px, controls 14px. Cyrillic uses a system sans fallback where the bundled font lacks glyphs.
- Icons: Lucide outlined arrows and Sun/Moon/Monitor, 1.5px stroke, 18–22px. Controls use native accessible labels; Button retains its existing variants and scoped semantic tokens.
- Media: standalone rifle/puffer wide assets for destination panels; knife/overshirt supplement catalog illustrations. No tint. Text sits in clear negative space, with a small neutral edge gradient only if required for contrast. Images use fixed aspect ratios and Next Image sizes.
- Detail states: extend the catalog's same media/text typography into a split detail layout; fashion size radios demonstrate selection only. Empty/error/loading/info states use the same surfaces. No buying, account or seller mutation is simulated.
- Responsive: panels and product cards stack; navigation and controls wrap into their own rows; filters stack. No clipping or horizontal scrolling. Reduced-motion preference respected.

Allowed above-the-fold copy: ORO; Discover / CS2 skins / Clothing; UZ / RU / EN; accessible theme labels; development notice; Your next look. / In game. In life.; CS2 skins and everyday clothing, in one place.; destination headings/descriptions/buttons from the English dictionary. Catalog adds only its concept breadcrumb, heading, intro, filter labels/values and sample count. Translation, theme labels and sample-price qualification are required intentional variations.

The visual comparison ledger and browser evidence will be recorded in PROJECT_PROGRESS.md after implementation. Native concept-sized English/light home and English/dark CS2 captures are required, plus mobile checks. Browser plugin is absent; use the existing Playwright setup.

## Final prompt set and saved assets

Built-in imagegen was used, with no CLI/API-key fallback. Concept prompts specified practical code-native text/controls, the English dictionary copy, ORO's existing wordmark, no fabricated ratings/metrics/verification, and complete screens rather than hero crops.

| Output | Final image brief |
| --- | --- |
| `home-concept.png` | Complete 1440-class desktop home: cool near-white, black DM Sans typography, simple ORO/navigation/language/theme header, lime development notice, exact two-line “Your next look. / In game. In life.” headline and subtitle, two equally sized CS2/clothing destination panels, slim footer. Purple game rifle on dark studio backdrop; olive puffer on headless mannequin against warm gray. No transactions, statistics or hero badges. |
| `cs2-concept.png` | Full dark CS2 catalog continuing the home system: breadcrumb, 56px heading, sample introduction, native Search/Type/Sort toolbar and Apply, three illustrated sample cards (Violet rifle / Steel knife / Night rifle), indicative prices, View sample links and explicit trading-unavailable boundary. No buying, authentication, ownership claims or Steam metadata. |
| `public/images/marketplace/rifle.png` | Isolate the home concept's left-panel artwork into standalone wide game art: purple/pink silenced rifle, dark studio background and subtle ground reflection, quiet lower-left negative space. Remove all interface text/buttons/frames. Illustrative concept only, no actual tradable item implied. |
| `public/images/marketplace/puffer.png` | Isolate the right-panel editorial photo into standalone wide media: dark-olive puffer on headless mannequin with metallic neck, warm neutral-gray backdrop and concrete pedestal, jacket right-aligned with left negative space. Remove all interface content and branding. |
| `public/images/marketplace/knife.png` | Standalone landscape game-concept art: silvery patterned steel bayonet with black grip, floating diagonally from left tip to right handle; dark navy studio and purple reflection matching the rifle. No text, logos, UI, ownership or pricing claims. |
| `public/images/marketplace/overshirt.png` | Standalone landscape editorial product photo: unbranded sand cotton overshirt, patch pockets, brown buttons, headless mannequin and metallic neck; pale warm-gray studio and concrete pedestal, matching the puffer. No person, text, branding or UI. |

## Fidelity review

Playwright screenshots use a 1487×1058 viewport for English/light home and English/dark CS2. Mobile is 390×664; a Russian clothing catalog was also inspected at 834×1112. Both local concept PNGs and browser captures were inspected with `view_image` in the same review pass. The complete screen may scroll where truthful qualification text or native controls require more room.

| Comparison | Evidence and disposition |
| --- | --- |
| Visible home copy | Browser-extracted `main.innerText` matches the concept headline, subtitle, both panel names/descriptions and CTA labels; no invented hero eyebrow or metrics. |
| Composition | Centered two-line headline, two equal destination panels, 16px gutter and slim footer retained. The panels stack on phones. |
| Color | Computed home background is `rgb(247, 248, 250)`; CS2 uses navy `rgb(17, 21, 26)` and lime actions. No warm reinterpretation of the cool home background. |
| Typography | DM Sans 700, 84px native desktop headline and responsive scaling; inherited ORO serif wordmark. Cyrillic labels remain legible. Control/caption sizes are explicit. |
| Media | Four independently generated production assets rather than pasted UI screenshots. Rifle/puffer scene, crop roles and studio treatments retained; no image tint or colored wash. Standalone generated objects have detail variations from the mockup. |
| Catalog | Same breadcrumb/title/intro, horizontal search/type/sort toolbar and three-card composition. Tightened vertical rhythm and rounded Apply after initial comparison. |
| Mobile | Initial clothing text overlapped the jacket; repaired with separate image and solid caption regions on narrow screens. Full labels, imagery and CTAs remain visible. |
| Native controls | Theme selector deliberately exposes light/dark/system instead of the concept's icon-only toggle. Widened to fit Russian labels. Native form controls preserve keyboard behavior. |

Intentional differences: translated copy; actual native theme controls; the explicit sample-currency qualification and shared “Not for sale” label; unified footer links; responsive caption separation; small standalone image-detail variations. These implement the confirmed development-data/accessibility/theme requirements. The concept's composition, hierarchy and palette are faithfully implemented with these documented variations; no claim of pixel-identical generated artwork or final owner-approved branding is made. Final screenshot locations and functional results are recorded in PROJECT_PROGRESS.md.

Saved-theme reload QA: a console assertion reproduced React hydration error #418. The navigation now uses matching server/hydration snapshots before rendering the persisted theme icon/value; no warning suppression was added. This follows the [next-themes hydration constraint](https://github.com/pacocoursey/next-themes#avoid-hydration-mismatch). The owner later selected UZS, so the sample-price qualification now says that payments are unavailable rather than saying launch currencies are undecided.
