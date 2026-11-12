# Theme

## Part 1 — compact source token summary

Refreshed after the implemented editorial redesign, 2026-11-11. These are actual source values. Tailwind 4 is CSS-first via `@theme inline`; **no tailwind.config.ts/js exists**. `src/app/globals.css` now contains base tokens, fonts and legacy storefront styles only. New marketplace rules are exclusively `.mp`-scoped in `src/components/marketplace/styles.css`, imported by `src/app/(marketplace)/[locale]/layout.tsx`. Legacy root does not import that stylesheet. next-themes applies `.dark`; CS2 with stored preference `system` intentionally uses the dark palette independent of OS preference. Explicit light remains light.

| Token | Storefront :root | Storefront .dark | Marketplace .mp | Marketplace dark / CS2 system |
| --- | --- | --- | --- | --- |
| `--background` | `#f8f7f4` | `#151817` | `#f7f8fa` | `#11151a` |
| `--foreground` | `#262b24` | `#f4f3ef` | `#11151a` | `#f7f8fa` |
| `--card` | `#fff` | `#202422` | `#fff` | `#1b2129` |
| `--card-foreground` | `#262b24` | `#f4f3ef` | `#11151a` | `#f7f8fa` |
| `--popover` | `#fff` | `#202422` | `inherits` | `inherits` |
| `--popover-foreground` | `#262b24` | `#f4f3ef` | `inherits` | `inherits` |
| `--primary` | `#9a5335` | `#d4a184` | `#d0f36b` | `inherits` |
| `--primary-foreground` | `#fff` | `#151817` | `#11151a` | `inherits` |
| `--secondary` | `#eeeae3` | `#2a302c` | `inherits` | `inherits` |
| `--secondary-foreground` | `#262b24` | `#f4f3ef` | `inherits` | `inherits` |
| `--muted` | `#eeeae3` | `#2a302c` | `#e9edf1` | `#272f3a` |
| `--muted-foreground` | `#62675f` | `#adb3ad` | `#535d69` | `#c2c9d2` |
| `--accent` | `#eeeae3` | `#2a302c` | `#e5e9ee` | `#303946` |
| `--accent-foreground` | `#262b24` | `#f4f3ef` | `#11151a` | `#f7f8fa` |
| `--destructive` | `#b12e29` | `#fa8d85` | `inherits` | `inherits` |
| `--border` | `#dfdfd7` | `#3c423d` | `#d6dbe1` | `#3b4552` |
| `--input` | `#d5d5cc` | `#555e56` | `#a9b2bf` | `#606b79` |
| `--ring` | `#9a5335` | `#d4a184` | `#637c28` | `#d0f36b` |
| `--radius` | `0rem` | `inherits` | `0.375rem` | `inherits` |
| `--surface` | `#eeece6` | `#202422` | `inherits` | `inherits` |
| `--font-body` | `"DM Sans", sans-serif` | `inherits` | `inherits` | `inherits` |
| `--font-display` | `"Cormorant Garamond", Georgia, serif` | `inherits` | `inherits` | `inherits` |
| `--highlight` | `inherits` | `inherits` | `#d0f36b` | `inherits` |

- Fonts: local DM Sans 400/500/600/700 for body/marketplace headings; Cormorant Garamond 400/500 for legacy editorial display and ORO wordmarks. Marketplace wordmark 500 60px/1, -4px tracking; footer 38px/-2px; 48px at <=800px and 42px/-3px at <=520px.
- Marketplace type: body 16px/1.55; headings 700, -0.05em, 1.06; home h1 clamp(48px,5.5vw,86px)/1.02 with muted second line; catalog h1 clamp(48px,6vw,88px); detail h1 clamp(36px,4vw,60px); sample headings clamp(22px,2.1vw,31px), -0.04em/1.13; prices clamp(20px,1.8vw,27px), tabular-nums. Detail price clamp(32px,3vw,44px).
- Legacy type unchanged: body 14px/1.6; serif h1 clamp(44px,5.3vw,82px), h2 clamp(34px,3.3vw,51px), weight 500, -0.04em.
- Spacing: Tailwind default 0.25rem spacing base, with custom pixel/percentage rules. Marketplace max width 1680px and 3.6% inline padding; header 72px minimum, 36px gap; home hero 0.9fr/1.3fr with 4% gap and 18px/32px block padding; destinations 16px gap with second card offset 36px; sample grid 26px gap; filter fields 20px gap. Legacy common max 1600px/4.2% inline and 76px section spacing.
- Geometry: global --radius and @theme radius-sm/md/lg/xl remain literal 0. Marketplace --radius is 0.375rem but literal Tailwind aliases remain 0; explicit CSS sets sample image 6px, destination/detail image 7px, controls/boundaries/hero actions 5px, language/size/theme control 4px. Sample cards have open editorial copy and image, without enclosed rounded card borders.
- Palette accents: --highlight #d0f36b; locale active state lime/#11151a. Light notice #e6f6b9/#263111; dark notice #242e1c/#e0f6a7 with #44532b borders. CS2 selected type/price use highlight except explicit light uses foreground. Hero primary action uses foreground/background with #647e22 arrow (dark arrow #43551a).
- Shadows: no custom named shadow tokens or marketplace card shadows. Existing primitives use Tailwind shadow-xs and sheet shadow-lg; legacy image caption uses 0 1px 5px #000.
- Breakpoints: marketplace min 1680px footer centering; max 1150,1000,800,600,520px. Legacy min 1600; max 1150,900,760px. Tailwind defaults sm 40rem,md 48rem,lg 64rem,xl 80rem,2xl 96rem are unchanged.
- Responsive: at <=1000px hero text moves above destination pair, keeping pair staggered (24px offset); at <=800px header nav wraps, cards 3→2, filters 4→2 and detail stacks; at <=600px cards 2→1 while destinations remain two columns with 0.82 image aspect; mobile gutter 18px. Theme select wrapper 124px desktop/120px <=520px.
- Interaction/accessibility: single link per sample and destination card; underline navigation/type active states; 44px language/header-link targets, 46–52px controls; visible skip link; main tabIndex=-1; focus outline 2px/5px offset. Card image hover zoom 1.035 over 350/450ms; reduced motion disables transitions and transforms.

## Part 2 — complete raw source

### `src/app/globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@fontsource/dm-sans/400.css";
@import "@fontsource/dm-sans/500.css";
@import "@fontsource/dm-sans/600.css";
@import "@fontsource/cormorant-garamond/400.css";
@import "@fontsource/cormorant-garamond/500.css";
@import "@fontsource/dm-sans/700.css";
:root {
  --background: #f8f7f4;
  --foreground: #262b24;
  --card: #fff;
  --card-foreground: #262b24;
  --popover: #fff;
  --popover-foreground: #262b24;
  --primary: #9a5335;
  --primary-foreground: #fff;
  --secondary: #eeeae3;
  --secondary-foreground: #262b24;
  --muted: #eeeae3;
  --muted-foreground: #62675f;
  --accent: #eeeae3;
  --accent-foreground: #262b24;
  --destructive: #b12e29;
  --border: #dfdfd7;
  --input: #d5d5cc;
  --ring: #9a5335;
  --radius: 0rem;
  --surface: #eeece6;
  --font-body: "DM Sans", sans-serif;
  --font-display: "Cormorant Garamond", Georgia, serif;
}
.dark {
  --background: #151817;
  --foreground: #f4f3ef;
  --card: #202422;
  --card-foreground: #f4f3ef;
  --popover: #202422;
  --popover-foreground: #f4f3ef;
  --primary: #d4a184;
  --primary-foreground: #151817;
  --secondary: #2a302c;
  --secondary-foreground: #f4f3ef;
  --muted: #2a302c;
  --muted-foreground: #adb3ad;
  --accent: #2a302c;
  --accent-foreground: #f4f3ef;
  --destructive: #fa8d85;
  --border: #3c423d;
  --input: #555e56;
  --ring: #d4a184;
  --surface: #202422;
  color-scheme: dark;
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --radius-xl: 0;
  --font-sans: var(--font-body);
}
* {
  box-sizing: border-box;
  border-color: var(--border);
}
html {
  scroll-behavior: smooth;
  scroll-padding-top: 100px;
}
body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.6;
}
button,
input,
select {
  font: inherit;
}
button,
a,
input,
select,
summary {
  -webkit-tap-highlight-color: transparent;
}
a {
  text-decoration: none;
}
button {
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 5px;
}
h1,
h2,
h3,
p {
  margin: 0;
}
h1,
h2 {
  font-family: var(--font-display);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
}
h1 {
  font-size: clamp(44px, 5.3vw, 82px);
}
h2 {
  font-size: clamp(34px, 3.3vw, 51px);
}
h3 {
  font-weight: 500;
}
svg {
  stroke-width: 1.5;
}
img {
  object-fit: cover;
}
.announcement {
  background: #343a30;
  color: #faf9f5;
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.035em;
  padding: 9px 20px;
}
.announcement span {
  margin-left: 30px;
  opacity: 0.78;
}
.header {
  border-bottom: 1px solid var(--border);
  background: var(--background);
  position: sticky;
  top: 0;
  z-index: 30;
}
.header-inner {
  max-width: 1600px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 95px;
  padding: 0 4.2%;
  gap: 30px;
}
.wordmark {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 48px;
  letter-spacing: -3px;
  line-height: 0.8;
  display: inline-flex;
  flex-direction: column;
}
.wordmark span {
  font: 9px var(--font-body);
  letter-spacing: 1px;
  margin-top: 10px;
}
.desktop-nav {
  display: flex;
  gap: 30px;
  font-size: 12px;
}
.desktop-nav a {
  position: relative;
}
.desktop-nav a:after,
.text-link:after {
  content: "";
  position: absolute;
  bottom: -5px;
  height: 1px;
  background: currentColor;
  width: 0;
  left: 0;
  transition: width 0.2s;
}
.desktop-nav a:hover:after,
.text-link:hover:after {
  width: 100%;
}
.header-actions {
  display: flex;
  gap: 10px;
}
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 40px;
  background: none;
  border: 0;
  color: inherit;
  flex-shrink: 0;
}
.icon-button svg {
  width: 21px;
  height: 21px;
}
.bag-button {
  position: relative;
}
.cart-count {
  position: absolute;
  right: -1px;
  top: 0;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 9px;
  min-width: 16px;
  height: 16px;
  border-radius: 50%;
}
.mobile-menu {
  display: none;
}
.theme-button .sun {
  display: none;
}
.dark .theme-button .sun {
  display: block;
}
.dark .theme-button .moon {
  display: none;
}
.hero {
  max-width: 1600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 44% 56%;
  min-height: 570px;
}
.hero-copy {
  padding: 80px 8% 28px 9.5%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}
.hero h1 {
  white-space: pre-line;
  max-width: 540px;
}
.hero-copy > p {
  color: var(--muted-foreground);
  max-width: 320px;
  font-size: 14px;
  margin: 24px 0 30px;
  line-height: 1.85;
}
.hero-copy > a {
  font-size: 12px;
  min-height: 48px;
  padding: 0 23px;
}
.hero-caption {
  display: flex;
  font-size: 10px;
  gap: 26px;
  color: var(--muted-foreground);
  margin-top: 65px;
}
.hero-caption > span:first-child {
  letter-spacing: 2px;
}
.hero-image {
  position: relative;
  min-height: 570px;
  background: var(--surface);
}
.image-caption {
  position: absolute;
  bottom: 22px;
  right: 25px;
  color: #fff;
  text-shadow: 0 1px 5px #000;
  font-size: 10px;
  letter-spacing: 0.05em;
}
.manifesto {
  max-width: 1600px;
  margin: auto;
  padding: 22px 4.2%;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted-foreground);
}
.section {
  max-width: 1600px;
  margin: auto;
  padding: 76px 4.2%;
}
.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 9px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--muted-foreground);
}
.text-link {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  font-size: 12px;
  position: relative;
  white-space: nowrap;
}
.text-link svg {
  width: 19px;
  height: 19px;
}
.section-heading > .text-link {
  margin-bottom: 7px;
}
.muted {
  color: var(--muted-foreground);
  font-size: 12px;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 25px;
}
.product-image {
  position: relative;
  aspect-ratio: 4/5;
  background: var(--surface);
  overflow: hidden;
}
.product-image > a {
  display: block;
  position: absolute;
  inset: 0;
}
.product-image img {
  transition: transform 0.45s;
}
.product-card:hover img {
  transform: scale(1.035);
}
.wish-button {
  position: absolute;
  right: 11px;
  top: 9px;
  background: var(--background);
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.wish-button svg {
  width: 16px;
  height: 16px;
}
.product-label {
  position: absolute;
  left: 14px;
  top: 14px;
  font-size: 9px;
  letter-spacing: 0.06em;
  background: var(--background);
  padding: 3px 8px;
}
.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-top: 16px;
  font-size: 12px;
}
.product-meta .product-name {
  font-family: var(--font-body);
  letter-spacing: normal;
  line-height: 1.6;
  font-size: 12px;
}
.product-meta > span {
  white-space: nowrap;
  font-size: 11px;
}
.product-material {
  font-size: 10px;
  color: var(--muted-foreground);
  margin-top: 5px;
}
.categories-section {
  padding-top: 30px;
}
.category-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 20px;
}
.category-tile {
  min-height: 340px;
  position: relative;
  overflow: hidden;
  background: #343a30;
}
.category-tile img {
  transition: transform 0.5s;
}
.category-tile:hover img {
  transform: scale(1.03);
}
.category-tile:after {
  content: "";
  position: absolute;
  inset: 35% 0 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}
.category-tile > div {
  position: absolute;
  bottom: 26px;
  left: 26px;
  right: 25px;
  color: white;
  z-index: 1;
}
.category-tile span {
  font-size: 9px;
  letter-spacing: 1px;
}
.category-tile h3 {
  font-family: var(--font-display);
  font-size: 32px;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-top: 8px;
  max-width: 180px;
}
.category-tile svg {
  position: absolute;
  right: 0;
  bottom: 3px;
  width: 22px;
}
.editorial {
  max-width: 1600px;
  margin: 15px auto 0;
  display: grid;
  grid-template-columns: 55% 45%;
  background: var(--surface);
}
.editorial-image {
  position: relative;
  min-height: 460px;
}
.editorial-copy {
  padding: 70px 12%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}
.editorial-copy h2 {
  white-space: pre-line;
}
.editorial-copy > p:not(.eyebrow) {
  color: var(--muted-foreground);
  font-size: 13px;
  line-height: 1.85;
  margin: 25px 0;
}
.services {
  max-width: 1600px;
  margin: auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 32px 4.2%;
  border-top: 1px solid var(--border);
  gap: 25px;
}
.services > a {
  display: flex;
  gap: 16px;
  padding: 8px 14px 8px 0;
  border-right: 1px solid var(--border);
}
.services > a:last-child {
  border: 0;
}
.services svg {
  width: 27px;
  height: 27px;
  flex-shrink: 0;
}
.services h3 {
  font-size: 12px;
  margin-bottom: 4px;
}
.services p {
  font-size: 10px;
  color: var(--muted-foreground);
  max-width: 180px;
}
.footer {
  max-width: 1600px;
  margin: auto;
  padding: 0 4.2%;
  border-top: 1px solid var(--border);
}
.newsletter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 50px;
  padding: 45px 0;
  border-bottom: 1px solid var(--border);
}
.newsletter h2 {
  font-size: 34px;
}
.newsletter > p {
  max-width: 310px;
  font-size: 11px;
  color: var(--muted-foreground);
}
.footer-main {
  padding: 50px 0;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 35px;
}
.footer-main > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 9px;
}
.footer-main .wordmark {
  margin-bottom: 15px;
}
.footer-main p {
  font-size: 11px;
  max-width: 200px;
  color: var(--muted-foreground);
}
.footer-main h3 {
  font-size: 11px;
  margin-bottom: 8px;
}
.footer-main a:not(.wordmark),
.footer-main span {
  font-size: 11px;
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  gap: 8px;
}
.footer-main a:hover {
  color: var(--primary);
}
.footer-bottom {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--border);
  padding: 20px 0;
  font-size: 9px;
  color: var(--muted-foreground);
  gap: 20px;
}
.skip-link {
  position: fixed;
  left: 20px;
  top: -100px;
  z-index: 100;
  background: var(--foreground);
  color: var(--background);
  padding: 12px;
}
.skip-link:focus {
  top: 15px;
}
.page-section {
  min-height: 55vh;
  padding-top: 35px;
  padding-bottom: 85px;
}
.breadcrumbs {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: var(--muted-foreground);
  margin-bottom: 45px;
  flex-wrap: wrap;
}
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 30px 0 45px;
  gap: 24px;
}
.page-heading h1 {
  font-size: 64px;
}
.page-heading > p {
  font-size: 13px;
  color: var(--muted-foreground);
}
.catalog-filters {
  border-block: 1px solid var(--border);
  padding: 22px 0;
  display: flex;
  gap: 18px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.catalog-filters label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 10px;
  flex: 1;
  min-width: 130px;
}
.catalog-filters input:not([type="checkbox"]),
.catalog-filters select {
  background: var(--background);
  border: 1px solid var(--input);
  border-radius: 0;
  padding: 10px;
  width: 100%;
  height: 42px;
  font-size: 12px;
  color: var(--foreground);
}
.catalog-filters .search-field {
  flex: 1.5;
}
.catalog-filters .check-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 0 0 auto;
  min-width: auto;
  height: 42px;
}
.catalog-filters > .text-link {
  height: 42px;
}
.catalog-filters > button {
  height: 42px;
}
.results-count {
  font-size: 11px;
  color: var(--muted-foreground);
  margin: 25px 0;
}
.empty-state {
  text-align: center;
  padding: 75px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.empty-state h2 {
  font-size: 34px;
}
.empty-state > p {
  color: var(--muted-foreground);
  font-size: 13px;
}
.empty-state > svg {
  width: 40px;
  height: 40px;
  color: var(--muted-foreground);
}
.product-detail {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 7%;
}
.detail-image {
  position: relative;
  min-height: 650px;
  background: var(--surface);
}
.detail-copy {
  padding: 25px 0;
}
.detail-copy h1 {
  font-size: 53px;
}
.detail-price {
  font-size: 24px;
  margin: 20px 0;
}
.detail-copy > p:not(.eyebrow):not(.detail-price) {
  font-size: 13px;
  color: var(--muted-foreground);
  line-height: 1.9;
}
.detail-copy .stock-note {
  margin: 18px 0;
}
.purchase {
  margin: 25px 0 35px;
}
.purchase fieldset {
  border: 0;
  padding: 0;
  margin: 0 0 20px;
}
.purchase legend {
  font-size: 11px;
  margin-bottom: 12px;
}
.color-options {
  display: flex;
  gap: 10px;
}
.color-options label {
  cursor: pointer;
}
.color-options input {
  position: absolute;
  opacity: 0;
}
.color-options span {
  display: block;
  border: 1px solid var(--border);
  padding: 9px 17px;
  font-size: 11px;
}
.color-options input:checked + span {
  border-color: var(--foreground);
  background: var(--surface);
}
.color-options input:focus-visible + span {
  outline: 2px solid var(--ring);
  outline-offset: 3px;
}
.purchase-quantity {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}
.purchase-quantity input {
  width: 70px;
  background: var(--background);
  border: 1px solid var(--input);
  padding: 8px;
}
.purchase > button {
  width: 100%;
  height: 50px;
}
.purchase-feedback {
  font-size: 10px;
  min-height: 32px;
  margin-top: 12px;
  color: var(--muted-foreground);
}
details {
  border-top: 1px solid var(--border);
  padding: 18px 0;
  font-size: 12px;
}
summary {
  cursor: pointer;
  font-weight: 500;
}
details p {
  margin: 15px 0;
  color: var(--muted-foreground);
}
dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-size: 11px;
  gap: 10px;
}
dd {
  margin: 0;
}
.related {
  margin-top: 90px;
}
.info-page {
  max-width: 900px;
  padding-top: 85px;
  padding-bottom: 100px;
}
.info-page h1 {
  margin-bottom: 30px;
}
.info-page > p:not(.eyebrow) {
  font-size: 15px;
  line-height: 1.9;
  color: var(--muted-foreground);
  margin-bottom: 25px;
}
.cart-content {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 50px;
}
.cart-row {
  display: flex;
  gap: 20px;
  border-bottom: 1px solid var(--border);
  padding: 24px 0;
}
.cart-row > img {
  width: 90px;
  height: 110px;
}
.cart-row > div {
  flex: 1;
}
.cart-row a {
  font-size: 13px;
}
.cart-row p {
  font-size: 11px;
  color: var(--muted-foreground);
  margin: 6px 0;
}
.quantity {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  margin-top: 10px;
}
.quantity button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 30px;
  background: none;
  border: 0;
  color: inherit;
}
.quantity svg {
  width: 13px;
  height: 13px;
}
.quantity span {
  min-width: 25px;
  text-align: center;
  font-size: 11px;
}
.cart-summary {
  background: var(--surface);
  padding: 25px;
  align-self: start;
}
.cart-summary > div {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  font-size: 12px;
}
.cart-summary > p {
  font-size: 11px;
  line-height: 1.8;
  color: var(--muted-foreground);
  margin: 20px 0;
}
.cart-summary > a {
  display: flex;
  margin-top: 15px;
}
.cart-sheet {
  padding: 30px !important;
  min-width: min(480px, 100vw);
  overflow-y: auto;
}
.cart-sheet .cart-content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}
.cart-sheet .cart-row {
  gap: 12px;
}
.cart-sheet .cart-row > img {
  width: 70px;
  height: 90px;
}
.cart-sheet .empty-state {
  padding-top: 60px;
}
.mobile-links {
  display: flex;
  flex-direction: column;
  padding-top: 35px;
  gap: 25px;
}
.mobile-links a {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-display);
  font-size: 30px;
}
.mobile-links svg {
  width: 20px;
}
.loading-line {
  height: 3px;
  background: var(--primary);
  width: 40%;
  margin-bottom: 30px;
  animation: loading 1s alternate infinite;
}
@keyframes loading {
  to {
    opacity: 0.25;
  }
}
@media (min-width: 1600px) {
  .hero-copy {
    padding-left: 67px;
  }
}
@media (max-width: 1150px) {
  .desktop-nav {
    gap: 18px;
    font-size: 11px;
  }
  .header-inner {
    gap: 15px;
  }
  .header-actions {
    gap: 3px;
  }
  .hero-copy {
    padding-top: 55px;
  }
  .hero,
  .hero-image {
    min-height: 510px;
  }
  .hero h1 {
    font-size: 65px;
  }
  .hero-caption {
    gap: 14px;
    font-size: 9px;
  }
  .product-meta {
    flex-direction: column;
    gap: 3px;
  }
  .product-grid {
    gap: 18px;
  }
  .category-tile {
    min-height: 300px;
  }
  .category-tile h3 {
    font-size: 28px;
  }
  .detail-copy h1 {
    font-size: 43px;
  }
  .detail-image {
    min-height: 550px;
  }
}
@media (max-width: 900px) {
  .desktop-nav a:last-child {
    display: none;
  }
  .hero h1 {
    font-size: 57px;
  }
  .hero-caption {
    flex-direction: column;
    gap: 5px;
    margin-top: 35px;
  }
  .hero,
  .hero-image {
    min-height: 480px;
  }
  .section {
    padding: 55px 5%;
  }
  .section-heading .muted {
    display: none;
  }
  .services {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  .services > a:nth-child(2) {
    border: 0;
  }
  .editorial-copy {
    padding: 40px 10%;
  }
  .editorial-image {
    min-height: 400px;
  }
  .product-detail {
    gap: 5%;
  }
  .detail-copy h1 {
    font-size: 38px;
  }
  .detail-image {
    min-height: 520px;
  }
  .cart-content {
    gap: 25px;
  }
}
@media (max-width: 760px) {
  .header-actions .account-icon {
    display: none;
  }
  html {
    scroll-padding-top: 75px;
  }
  .announcement {
    font-size: 9px;
    padding: 8px 12px;
  }
  .announcement span {
    display: none;
  }
  .header-inner {
    min-height: 76px;
    padding: 0 5%;
    gap: 12px;
  }
  .mobile-menu {
    display: inline-flex;
  }
  .desktop-nav {
    display: none;
  }
  .wordmark {
    font-size: 39px;
    letter-spacing: -2px;
  }
  .wordmark span {
    font-size: 7px;
    margin-top: 8px;
    letter-spacing: 0.5px;
  }
  .header-actions {
    margin-left: auto;
    gap: 1px;
  }
  .header-actions .icon-button {
    width: 32px;
  }
  .header-actions svg {
    width: 18px;
    height: 18px;
  }
  .hero {
    display: flex;
    flex-direction: column;
  }
  .hero-copy {
    padding: 44px 6% 32px;
    position: relative;
  }
  .hero h1 {
    font-size: 59px;
    max-width: 90%;
  }
  .hero-copy > p {
    margin: 20px 0 25px;
    max-width: 320px;
    font-size: 12px;
  }
  .hero-copy > a {
    font-size: 11px;
    min-height: 46px;
  }
  .hero-caption {
    display: none;
  }
  .hero-image {
    min-height: 370px;
  }
  .manifesto {
    padding: 18px 5%;
    font-size: 9px;
    gap: 20px;
  }
  .manifesto span:last-child {
    display: none;
  }
  .section {
    padding: 48px 5%;
  }
  .section-heading {
    gap: 15px;
    align-items: flex-end;
    margin-bottom: 25px;
  }
  .section-heading h2 {
    font-size: 36px;
    max-width: 250px;
  }
  .section-heading > .text-link {
    font-size: 10px;
    gap: 8px;
    margin-bottom: 3px;
  }
  .section-heading .text-link svg {
    width: 16px;
  }
  .eyebrow {
    font-size: 8px;
    letter-spacing: 1.6px;
    margin-bottom: 10px;
  }
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px 15px;
  }
  .product-meta {
    margin-top: 12px;
  }
  .product-meta .product-name {
    font-size: 11px;
  }
  .product-meta > span {
    font-size: 11px;
  }
  .product-material {
    font-size: 9px;
  }
  .product-label {
    font-size: 8px;
    left: 9px;
    top: 9px;
  }
  .wish-button {
    right: 6px;
    top: 6px;
    width: 30px;
    height: 30px;
  }
  .categories-section {
    padding-top: 10px;
  }
  .category-grid {
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .category-large {
    grid-column: span 2;
    min-height: 330px;
  }
  .category-tile:not(.category-large) {
    min-height: 270px;
  }
  .category-tile > div {
    bottom: 20px;
    left: 18px;
    right: 15px;
  }
  .category-tile h3 {
    font-size: 28px;
    max-width: 130px;
  }
  .category-large h3 {
    max-width: 250px;
    font-size: 38px;
  }
  .category-tile span {
    font-size: 8px;
  }
  .category-tile svg {
    width: 18px;
    bottom: -2px;
  }
  .editorial {
    display: flex;
    flex-direction: column;
  }
  .editorial-image {
    min-height: 330px;
  }
  .editorial-copy {
    padding: 38px 7% 45px;
  }
  .editorial-copy h2 {
    font-size: 46px;
  }
  .editorial-copy > p:not(.eyebrow) {
    max-width: 340px;
  }
  .services {
    padding: 25px 5%;
    gap: 25px 15px;
  }
  .services > a {
    padding: 0;
    border: 0;
    gap: 12px;
  }
  .services svg {
    width: 24px;
    height: 24px;
  }
  .services h3 {
    font-size: 11px;
  }
  .services p {
    font-size: 9px;
  }
  .newsletter {
    display: block;
    padding: 35px 0;
  }
  .newsletter h2 {
    font-size: 33px;
    max-width: 280px;
  }
  .newsletter > p {
    margin-top: 20px;
    font-size: 11px;
  }
  .footer {
    padding: 0 5%;
  }
  .footer-main {
    grid-template-columns: 1fr 1fr;
    gap: 35px 25px;
    padding: 35px 0;
  }
  .footer-bottom {
    flex-direction: column;
    gap: 9px;
    font-size: 8px;
  }
  .page-section {
    padding-top: 25px;
  }
  .breadcrumbs {
    margin-bottom: 30px;
    font-size: 9px;
  }
  .page-heading {
    display: block;
    margin: 25px 0 30px;
  }
  .page-heading h1 {
    font-size: 50px;
  }
  .page-heading > p {
    margin-top: 15px;
  }
  .catalog-filters {
    gap: 14px;
  }
  .catalog-filters label {
    flex: 1 1 40%;
    min-width: 120px;
  }
  .catalog-filters .search-field {
    flex: 1 1 100%;
  }
  .catalog-filters .check-field {
    flex: 1 1 100%;
  }
  .product-detail {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }
  .detail-image {
    min-height: 0;
    aspect-ratio: 4/5;
  }
  .detail-copy {
    padding: 5px 0;
  }
  .detail-copy h1 {
    font-size: 48px;
  }
  .related {
    margin-top: 55px;
  }
  .info-page {
    padding-top: 55px;
    padding-bottom: 65px;
  }
  .info-page h1 {
    font-size: 50px;
  }
  .cart-content {
    display: flex;
    flex-direction: column;
  }
  .cart-row {
    gap: 14px;
  }
  .cart-row > img {
    width: 75px;
    height: 100px;
  }
  .cart-summary {
    align-self: stretch;
  }
  .cart-sheet {
    padding: 25px !important;
  }
  .empty-state {
    padding: 55px 5px;
  }
  .empty-state h2 {
    font-size: 31px;
  }
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *:before,
  *:after {
    animation: none !important;
    transition: none !important;
  }
}

.menu-sheet {
  padding: 30px;
}
```

### `src/components/marketplace/styles.css`

```css
/* Marketplace-only editorial system; legacy storefront styles remain separate. */
.mp {
  --background: #f7f8fa;
  --foreground: #11151a;
  --card: #fff;
  --card-foreground: #11151a;
  --muted: #e9edf1;
  --muted-foreground: #535d69;
  --border: #d6dbe1;
  --input: #a9b2bf;
  --primary: #d0f36b;
  --primary-foreground: #11151a;
  --accent: #e5e9ee;
  --accent-foreground: #11151a;
  --highlight: #d0f36b;
  --ring: #637c28;
  --radius: 0.375rem;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: var(--background);
  color: var(--foreground);
  color-scheme: light;
  font: 15px/1.6 var(--font-body);
}
.dark .mp, .mp[data-world="cs2"][data-preference="system"] {
  --background: #11151a;
  --foreground: #f7f8fa;
  --card: #1b2129;
  --card-foreground: #f7f8fa;
  --muted: #272f3a;
  --muted-foreground: #c2c9d2;
  --border: #3b4552;
  --input: #606b79;
  --accent: #303946;
  --accent-foreground: #f7f8fa;
  --ring: #d0f36b;
  color-scheme: dark;
}
.mp a { color: inherit; }
.mp .skip-link { color: var(--background); }
.mp a, .mp button, .mp input, .mp select { touch-action: manipulation; }
.mp a:focus-visible { outline: 2px solid var(--ring); outline-offset: 5px; border-radius: 3px; }
.mp h1, .mp h2, .mp h3 {
  font-family: var(--font-body);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.15;
  text-wrap: balance;
  overflow-wrap: break-word;
}
.mp main { flex: 1; min-width: 0; }
.mp main:focus { outline: none; }
.mp-header {
  max-width: 1440px;
  min-height: 72px;
  margin-inline: auto;
  padding: 12px 3.6%;
  display: flex;
  align-items: center;
  gap: 36px;
}
.mp-wordmark { font: 500 46px/1 var(--font-display); letter-spacing: -3px; text-decoration: none; flex-shrink: 0; }
.mp-navigation { display: flex; gap: 24px; align-items: center; margin-inline: auto; }
.mp-navigation a { display: flex; align-items: center; min-height: 44px; padding: 8px 0; font-size: 14px; font-weight: 600; white-space: nowrap; border-bottom: 3px solid transparent; }
.mp-navigation a:hover, .mp-navigation a[aria-current="page"] { border-bottom-color: var(--foreground); }
.mp[data-world="cs2"] .mp-navigation a[aria-current="page"] { border-bottom-color: var(--highlight); }
.mp[data-world="cs2"][data-preference="light"] .mp-navigation a[aria-current="page"] { border-bottom-color: var(--foreground); }
.mp-tools { display: flex; align-items: center; gap: 20px; }
.mp-account-link { display: grid; place-items: center; min-width: 44px; min-height: 44px; border: 1px solid var(--border); border-radius: var(--radius); }
.mp-account-link svg { width: 20px; height: 20px; }
.mp-languages { display: flex; gap: 2px; align-items: center; }
.mp-languages a { display: grid; place-items: center; min-height: 44px; min-width: 36px; padding: 6px; font-size: 13px; font-weight: 500; }
.mp-languages a[aria-current] { color: #11151a; background: var(--highlight); border-radius: 4px; font-weight: 700; }
.mp-languages a:hover { text-decoration: underline; text-underline-offset: 4px; }
.mp-theme { display: flex; align-items: center; gap: 8px; border-left: 1px solid var(--border); padding-left: 16px; }
.mp-theme > svg { width: 18px; height: 18px; flex-shrink: 0; }
.mp-theme [data-slot="native-select-wrapper"] { width: 124px; }
.mp-theme select { width: 100%; height: 44px; max-width: none; color: var(--foreground); background-color: var(--background); border-color: var(--input); border-radius: 4px; }
.mp-notice { padding: 8px 20px; background: #e6f6b9; color: #263111; font-size: 13px; font-weight: 500; text-align: center; }
.dark .mp .mp-notice, .mp[data-world="cs2"][data-preference="system"] .mp-notice { background: #242e1c; color: #e0f6a7; border-block: 1px solid #44532b; }
.mp-home, .mp-catalog { max-width: 1440px; padding-inline: 3.6%; margin-inline: auto; }
.mp-home-hero { display: grid; grid-template-columns: 0.9fr 1.3fr; align-items: center; gap: 4%; padding-block: 18px 32px; }
.mp-intro { padding-block: 36px; min-width: 0; }
.mp-intro h1 { font-size: clamp(36px, 4vw, 56px); line-height: 1.1; }
.mp-intro h1 span { display: block; }
.mp-intro h1 span + span { color: var(--muted-foreground); margin-top: 7px; }
.mp-intro > p { font-size: 16px; margin-top: 22px; max-width: 39ch; line-height: 1.5; }
.mp-hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 34px; }
.mp-hero-actions [data-slot="button"] { min-height: 48px; height: auto; padding: 12px 20px; border-radius: 5px; font-size: 14px; font-weight: 600; white-space: normal; }
.mp-hero-actions [data-slot="button"]:first-child { background: var(--foreground); color: var(--background); }
.mp-hero-actions [data-slot="button"]:first-child svg { color: #647e22; }
.dark .mp .mp-hero-actions [data-slot="button"]:first-child svg { color: #43551a; }
.mp-hero-actions [data-slot="button"]:hover { opacity: 0.85; }
.mp-hero-actions [data-slot="button"][data-variant="outline"] { border-color: var(--input); }
.mp-destinations { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; min-width: 0; }
.mp-destination { display: block; min-width: 0; }
.mp-destination:nth-child(2) { margin-top: 36px; }
.mp-destination-media { position: relative; overflow: hidden; border-radius: 7px; aspect-ratio: 1.05; background: #161923; }
.mp-destination-media img { object-fit: cover; object-position: 65% center; transition: transform 450ms ease; }
.mp-destination-fashion .mp-destination-media { background: #d1cdc7; }
.mp-destination-fashion .mp-destination-media img { object-position: 68% center; }
.mp-destination:hover img { transform: scale(1.035); }
.mp-destination-copy { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-top: 18px; }
.mp-destination-copy h2 { font-size: clamp(20px, 1.7vw, 24px); }
.mp-destination-copy > svg { width: 25px; height: 25px; flex-shrink: 0; }
.mp-edit { border-top: 1px solid var(--border); padding-block: 32px 16px; }
.mp-edit .mp-sample-media { aspect-ratio: 2.15; }
.mp-section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.mp-section-heading h2 { font-size: clamp(24px, 2.4vw, 30px); }
.mp-section-heading > p { font-size: 16px; color: var(--muted-foreground); font-weight: 500; }
.mp-footer { display: flex; align-items: center; justify-content: space-between; gap: 32px; max-width: 1560px; margin: 24px 3.6% 0; padding-block: 26px; border-top: 1px solid var(--border); font-size: 14px; }
.mp-footer > div { display: flex; align-items: center; gap: 36px; }
.mp-footer .mp-wordmark { font-size: 38px; letter-spacing: -2px; }
.mp-footer p { color: var(--muted-foreground); }
.mp-footer nav { display: flex; align-items: center; gap: 36px; flex-wrap: wrap; }
.mp-footer nav a { display: flex; align-items: center; min-height: 44px; }
.mp-footer nav a:hover, .mp-text-link:hover { text-decoration: underline; text-underline-offset: 5px; }
.mp-catalog { padding-block: 18px 12px; }
.mp-breadcrumb { display: flex; align-items: center; flex-wrap: wrap; gap: 13px; color: var(--muted-foreground); margin-bottom: 18px; font-size: 14px; }
.mp-breadcrumb a { min-height: 32px; display: inline-flex; align-items: center; }
.mp-breadcrumb span:last-child { color: var(--foreground); font-weight: 500; }
.mp-catalog-heading { display: flex; align-items: center; justify-content: space-between; gap: 48px; margin-block: 0 20px; }
.mp-catalog h1 { font-size: clamp(32px, 4vw, 44px); }
.mp-catalog-intro { color: var(--muted-foreground); font-size: 15px; max-width: 48ch; line-height: 1.65; }
.mp-types { display: flex; flex-wrap: wrap; gap: 8px 32px; border-bottom: 1px solid var(--border); margin-bottom: 22px; }
.mp-types a { display: flex; align-items: center; min-height: 48px; padding-block: 8px; border-bottom: 3px solid transparent; font-size: 16px; font-weight: 600; }
.mp-types a:hover, .mp-types a[aria-current="page"] { border-bottom-color: var(--foreground); }
.mp[data-world="cs2"] .mp-types a[aria-current="page"] { color: var(--highlight); border-bottom-color: var(--highlight); }
.mp[data-world="cs2"][data-preference="light"] .mp-types a[aria-current="page"] { color: var(--foreground); border-bottom-color: var(--foreground); }
.mp-filter-form { padding-bottom: 22px; border-bottom: 1px solid var(--border); }
.mp-filter-fields { display: grid; grid-template-columns: 1.6fr 1fr 1fr auto; gap: 20px; align-items: end; }
.mp-filter-fields [data-slot="field"] { gap: 8px; min-width: 0; }
.mp-filter-fields [data-slot="field-label"] { font-size: 13px; font-weight: 600; flex: 0 0 auto; width: auto; }
.mp-filter-fields [data-slot="native-select-wrapper"] { width: 100%; min-width: 0; }
.mp-filter-fields [data-slot="input"], .mp-filter-fields [data-slot="native-select"] { height: 46px; border-radius: 5px; font-size: 15px; background-color: var(--card); color: var(--foreground); }
.mp-filter-fields [data-slot="button"] { min-width: 112px; height: 46px; border-radius: 5px; font-weight: 700; }
.mp-results { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-block: 12px 18px; min-height: 40px; font-size: 14px; }
.mp-results > p { color: var(--muted-foreground); }
.mp-results a { display: inline-flex; align-items: center; min-height: 40px; font-weight: 600; text-decoration: underline; text-underline-offset: 4px; }
.mp-sample-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; }
.mp-sample-card { min-width: 0; }
.mp-sample-link { display: block; }
.mp-sample-media { position: relative; aspect-ratio: 1.58; background: var(--card); overflow: hidden; border-radius: 6px; }
.mp-sample-media img { object-fit: cover; transition: transform 350ms ease; }
.mp-sample-link:hover .mp-sample-media img { transform: scale(1.035); }
.mp-sample-copy { padding-block: 16px 0; }
.mp-muted { font-size: 13px; color: var(--muted-foreground); }
.mp-sample-copy h2, .mp-sample-copy h3 { margin-block: 6px 9px; font-size: clamp(18px, 1.6vw, 22px); line-height: 1.3; letter-spacing: -0.025em; }
.mp-sample-bottom { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--border); margin-top: 16px; padding-block: 15px; }
.mp-sample-price { font-size: clamp(18px, 1.5vw, 21px); font-weight: 700; letter-spacing: -0.045em; font-variant-numeric: tabular-nums; white-space: nowrap; }
.mp-card-action { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.mp-card-action svg { width: 18px; height: 18px; }
.mp[data-world="cs2"] .mp-sample-price { color: var(--highlight); }
.mp[data-world="cs2"][data-preference="light"] .mp-sample-price { color: var(--foreground); }
.mp-text-link { display: inline-flex; gap: 10px; align-items: center; min-height: 44px; font-size: 14px; font-weight: 600; }
.mp-text-link svg { width: 18px; height: 18px; }
.mp-price-note { color: var(--muted-foreground); font-size: 13px; margin-block: 20px 12px; }
.mp-boundary { margin-top: 34px; grid-template-columns: 22px auto 1fr; align-items: center; gap: 14px 20px; padding: 19px 22px; border-color: var(--input); border-radius: 5px; background: transparent; }
.mp-boundary > svg { width: 22px; height: 22px; transform: none; }
.mp-boundary [data-slot="alert-title"] { grid-column: 2; font-size: 16px; font-weight: 700; line-clamp: none; -webkit-line-clamp: unset; white-space: normal; }
.mp-boundary [data-slot="alert-description"] { grid-column: 3; font-size: 14px; }
.mp-back { margin-bottom: 24px; }
.mp-detail { display: grid; grid-template-columns: 1.1fr 1fr; align-items: start; gap: 6%; }
.mp-detail-media { position: relative; aspect-ratio: 1.03; background: var(--card); border-radius: 7px; overflow: hidden; }
.mp-detail-media img { object-fit: cover; }
.mp-detail-copy { padding-top: 8px; min-width: 0; }
.mp-detail-copy h1 { font-size: clamp(28px, 3vw, 38px); margin-block: 14px 22px; }
.mp-detail-description { font-size: 16px; line-height: 1.75; color: var(--muted-foreground); }
.mp-detail-price { margin-block: 30px 20px; }
.mp-detail-price > p:last-child { font-size: clamp(26px, 2.5vw, 32px); font-weight: 700; letter-spacing: -0.05em; }
.mp-detail-copy dl { display: block; margin-block: 24px; }
.mp-detail-copy dl > div { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; border-bottom: 1px solid var(--border); padding-block: 14px; }
.mp-detail-copy dt { color: var(--muted-foreground); font-size: 13px; }
.mp-detail-copy dd { margin: 0; text-align: right; font-size: 14px; font-weight: 500; }
.mp-sizes { border: 0; padding: 0; margin-block: 24px; }
.mp-sizes legend { font-weight: 600; font-size: 14px; margin-bottom: 10px; }
.mp-sizes > div { display: flex; flex-wrap: wrap; gap: 8px; }
.mp-sizes label { position: relative; cursor: pointer; }
.mp-sizes input { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; margin: 0; }
.mp-sizes span { display: grid; place-items: center; border: 1px solid var(--input); border-radius: 4px; min-width: 48px; height: 46px; }
.mp-sizes input:checked + span { background: var(--foreground); color: var(--background); border-color: var(--foreground); }
.mp-sizes input:focus-visible + span { outline: 2px solid var(--ring); outline-offset: 3px; }
.mp-sizes p { font-size: 13px; color: var(--muted-foreground); margin-top: 12px; }
.mp-detail-note { padding: 16px 0 16px 18px; border-left: 2px solid var(--input); margin-block: 24px; font-size: 14px; color: var(--muted-foreground); }
.mp-info { max-width: 1100px; padding-block: 60px; }
.mp-info h1 { font-size: clamp(30px, 3.5vw, 40px); margin-bottom: 22px; }
.mp-info section { padding-block: 32px; border-bottom: 1px solid var(--border); }
.mp-info section h2 { font-size: 22px; margin-bottom: 14px; }
.mp-info > p:not(.mp-catalog-intro) { margin-top: 24px; }
@media (min-width: 1680px) { .mp-footer { margin-inline: auto; width: calc(100% - 7.2%); } }
@media (max-width: 1150px) {
  .mp-header { gap: 24px; }
  .mp-navigation { gap: 18px; }
  .mp-navigation a { font-size: 15px; }
  .mp-tools { gap: 10px; }
  .mp-theme > svg { display: none; }
  .mp-theme { padding-left: 12px; }
  .mp-home-hero { gap: 3%; }
  .mp-hero-actions { gap: 10px; }
  .mp-hero-actions [data-slot="button"] { padding-inline: 16px; }
  .mp-sample-grid { gap: 18px; }
  .mp-sample-bottom { align-items: flex-start; flex-direction: column; gap: 10px; }
  .mp-catalog-heading { gap: 32px; }
  .mp-filter-fields { gap: 14px; grid-template-columns: 1.3fr 1fr 1.1fr auto; }
  .mp-filter-fields [data-slot="field"] { flex-direction: column; align-items: stretch; }
}
@media (max-width: 1000px) {
  .mp-home-hero { grid-template-columns: 1fr; padding-top: 28px; gap: 20px; }
  .mp-intro { padding-block: 16px; }
  .mp-intro h1 { font-size: clamp(36px, 5.6vw, 52px); max-width: 24ch; }
  .mp-intro > p { max-width: 44ch; }
  .mp-destination-media { aspect-ratio: 1.25; }
  .mp-destination:nth-child(2) { margin-top: 24px; }
  .mp-home-hero { padding-bottom: 32px; }
  .mp-footer { align-items: flex-start; }
  .mp-footer > div { align-items: flex-start; flex-direction: column; gap: 12px; }
  .mp-footer nav { gap: 8px 24px; }
}
@media (max-width: 800px) {
  .mp-header { flex-wrap: wrap; row-gap: 8px; padding: 14px 20px 0; }
  .mp-wordmark { font-size: 48px; }
  .mp-tools { margin-left: auto; }
  .mp-navigation { order: 3; width: 100%; justify-content: center; gap: 36px; }
  .mp-navigation a { font-size: 15px; }
  .mp-home, .mp-catalog { padding-inline: 22px; }
  .mp-catalog-heading { flex-direction: column; align-items: flex-start; gap: 18px; }
  .mp-catalog-intro { max-width: 56ch; font-size: 16px; }
  .mp-filter-fields { grid-template-columns: 1fr 1fr; }
  .mp-filter-fields > :first-child, .mp-filter-fields > [data-slot="button"] { grid-column: 1 / -1; }
  .mp-sample-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 18px; }
  .mp-boundary { grid-template-columns: 22px 1fr; gap: 8px 14px; padding: 18px; }
  .mp-boundary [data-slot="alert-description"] { grid-column: 2; }
  .mp-detail { grid-template-columns: 1fr; gap: 30px; }
  .mp-detail-media { aspect-ratio: 1.35; }
  .mp-detail-copy h1 { font-size: clamp(28px, 4vw, 36px); }
  .mp-section-heading { gap: 14px; align-items: flex-start; flex-direction: column; }
  .mp-footer { margin-inline: 22px; flex-wrap: wrap; }
}
@media (max-width: 600px) {
  .mp-home, .mp-catalog { padding-inline: 18px; }
  .mp-home-hero { padding-top: 18px; gap: 22px; }
  .mp-intro h1 { font-size: clamp(32px, 8vw, 40px); }
  .mp-intro > p { font-size: 16px; margin-top: 18px; max-width: 36ch; }
  .mp-hero-actions { margin-top: 24px; }
  .mp-hero-actions [data-slot="button"] { min-height: 48px; font-size: 14px; padding: 12px 16px; }
  .mp-destinations { gap: 12px; }
  .mp-destination-media { aspect-ratio: 0.82; }
  .mp-destination-copy { padding-top: 12px; gap: 6px; align-items: flex-start; }
  .mp-destination-copy h2 { font-size: 21px; line-height: 1.15; }
  .mp-destination-copy > svg { width: 20px; height: 20px; }
  .mp-edit { padding-top: 26px; }
  .mp-section-heading { margin-bottom: 24px; }
  .mp-section-heading h2 { font-size: 26px; }
  .mp-section-heading > p { font-size: 15px; }
  .mp-sample-grid { grid-template-columns: 1fr; gap: 28px; }
  .mp-sample-copy h2, .mp-sample-copy h3 { font-size: 21px; }
  .mp-sample-bottom { flex-direction: row; align-items: baseline; }
  .mp-sample-price { font-size: 20px; }
  .mp-catalog { padding-top: 20px; }
  .mp-catalog h1 { font-size: clamp(30px, 7.5vw, 36px); }
  .mp-catalog-heading { margin-bottom: 20px; }
  .mp-types { gap: 0 20px; }
  .mp-types a { font-size: 14px; min-height: 46px; }
  .mp-filter-fields { gap: 16px 12px; }
  .mp-filter-fields [data-slot="input"], .mp-filter-fields [data-slot="native-select"] { font-size: 14px; }
  .mp-detail-copy h1 { font-size: 30px; }
  .mp-detail-price > p:last-child { font-size: 28px; }
  .mp-footer { margin-inline: 18px; padding-block: 22px; gap: 16px; }
  .mp-footer nav { gap: 4px 24px; }
}
@media (max-width: 520px) {
  .mp-header { gap: 8px 12px; padding-inline: 16px; }
  .mp-wordmark { font-size: 42px; letter-spacing: -3px; }
  .mp-tools { gap: 8px; }
  .mp-tools { flex-wrap: wrap; justify-content: flex-end; flex: 1; }
  .mp-languages a { min-width: 30px; padding-inline: 4px; font-size: 12px; }
  .mp-theme { padding-left: 8px; }
  .mp-theme [data-slot="native-select-wrapper"] { width: 120px; }
  .mp-theme select { padding-left: 8px; font-size: 12px; }
  .mp-navigation { justify-content: space-between; gap: 12px; }
  .mp-navigation a { font-size: 13px; }
  .mp-notice { font-size: 12px; padding: 9px 18px; }
  .mp-card-action { font-size: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .mp-destination-media img, .mp-sample-media img { transition: none; }
  .mp-destination:hover img, .mp-sample-link:hover img { transform: none; }
}
```

### `src/components/providers.tsx`

```tsx
"use client";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { useShop } from "@/stores/shop";
export function Providers({ children, defaultTheme = "light", enableSystem = false }: {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  enableSystem?: boolean;
}) {
  useEffect(() => {
    void useShop.persist.rehydrate();
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem={enableSystem}>
      {children}
    </ThemeProvider>
  );
}
```

### `src/components/theme-toggle.tsx`

```tsx
"use client";
import { copy } from "@/messages";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      className="icon-button theme-button"
      aria-label={copy.rangMavzusiniAlmashtirish}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="sun" />
      <Moon className="moon" />
    </button>
  );
}
```

### `src/lib/config.ts`

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

### `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### `postcss.config.mjs`

```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```


### `src/components/account/styles.css`

```css
/* Account and read-only workspace presentation, using the marketplace palette. */
.account-shell { width: min(100% - 48px, 520px); margin: 32px auto 64px; }
.account-shell > .mp-text-link { margin-bottom: 20px; font-weight: 500; }
.account-panel { padding: 32px; border: 1px solid var(--border); border-radius: 8px; background: var(--card); }
.account-heading { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
.mp .account-heading h1 { font-size: 28px; line-height: 1.25; letter-spacing: -0.035em; }
.account-heading > p { color: var(--muted-foreground); font-size: 15px; line-height: 1.65; max-width: 66ch; }
.account-entry { width: min(100% - 64px, 1120px); }
.account-entry-grid { display: grid; grid-template-columns: 0.95fr 1fr; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.account-entry .account-panel { border: 0; border-radius: 0; padding: 36px 40px; }
.account-brand { display: flex; flex-direction: column; gap: 26px; padding: 36px; background: #11151a; color: #f7f8fa; }
.account-brand-title { font-size: 26px; font-weight: 600; line-height: 1.3; letter-spacing: -0.03em; margin-bottom: 10px; }
.account-brand > div > p + p { color: #c2c9d2; font-size: 15px; }
.account-brand-images { display: grid; grid-template-rows: 1fr 0.8fr; gap: 14px; flex: 1; }
.account-brand-images > div { position: relative; min-height: 148px; border-radius: 6px; overflow: hidden; background: #1b2129; }
.account-brand-images > div + div { background: #d1cdc7; }
.account-brand-images img { object-fit: cover; object-position: center; }
.account-brand-caption { color: #c2c9d2; font-size: 12px; }
.account-form { width: 100%; }
.account-form [data-slot="field-group"] { gap: 20px; }
.account-form [data-slot="field"] { gap: 8px; }
.account-form [data-slot="field-label"] { font-size: 14px; font-weight: 500; }
.account-form [data-slot="input"], .account-form select { height: 46px; font-size: 16px; border-radius: 6px; background: var(--card); color: var(--foreground); box-shadow: none; }
.account-form [data-slot="native-select-wrapper"] { width: 100%; }
.account-form [data-slot="field-description"] { color: var(--muted-foreground); font-size: 12px; line-height: 1.6; }
.account-form [data-slot="button"] { height: auto; min-height: 46px; padding: 11px 18px; border-radius: 6px; font-size: 14px; font-weight: 600; white-space: normal; line-height: 1.5; }
.account-form [data-variant="default"], .workspace-filters [data-variant="default"] { background: var(--foreground); color: var(--background); }
.account-form [data-variant="default"]:hover, .workspace-filters [data-variant="default"]:hover { opacity: 0.88; }
.account-form [data-slot="alert"] { border-color: var(--input); background: var(--background); color: var(--foreground); }
.account-form [data-slot="alert"]:focus { outline: 2px solid var(--ring); outline-offset: 3px; }
.account-form [role="alert"] { border-inline-start: 3px solid var(--destructive); }
.account-form [data-slot="alert-description"] { font-size: 14px; line-height: 1.65; color: var(--foreground); }
.account-password { position: relative; }
.account-password [data-slot="input"] { padding-right: 48px; }
.account-password-toggle { position: absolute; inset: 1px 1px 1px auto; display: grid; place-items: center; width: 44px; min-height: 44px; padding: 0; color: var(--muted-foreground); border-radius: 5px; }
.account-password-toggle:hover { color: var(--foreground); background: var(--accent); }
.account-password-toggle svg { width: 19px; height: 19px; }
.account-links { display: flex; flex-direction: column; align-items: center; gap: 4px; border-top: 1px solid var(--border); margin-top: 28px; padding-top: 18px; text-align: center; }
.account-links a { display: inline-flex; justify-content: center; align-items: center; min-height: 44px; font-size: 14px; text-decoration: underline; text-underline-offset: 4px; }
.account-links a:not(:first-child) { color: var(--muted-foreground); font-size: 13px; }
.account-panel > .mp-text-link, .account-panel > [data-slot="alert"] { margin-top: 20px; }
.account-email { overflow-wrap: anywhere; color: var(--muted-foreground); font-size: 14px; }
.account-spinner { animation: account-spin 1s linear infinite; }
@keyframes account-spin { to { transform: rotate(360deg); } }

.account-workspace { display: grid; grid-template-columns: 220px minmax(0, 1fr); width: min(100%, 1440px); margin-inline: auto; min-height: 680px; }
.workspace-sidebar { display: flex; flex-direction: column; gap: 28px; padding: 32px 18px 28px; border-right: 1px solid var(--border); }
.workspace-label { padding-inline: 12px; }
.workspace-label p { font-size: 18px; font-weight: 600; letter-spacing: -0.025em; }
.workspace-label span { display: block; margin-top: 5px; font-size: 13px; color: var(--muted-foreground); }
.workspace-sidebar nav { display: flex; flex-direction: column; gap: 6px; }
.workspace-sidebar a { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 10px 12px; border-radius: 6px; font-size: 14px; line-height: 1.5; }
.workspace-sidebar svg { width: 19px; height: 19px; flex-shrink: 0; }
.workspace-sidebar nav a:hover { background: var(--accent); }
.workspace-sidebar nav a[aria-current="page"] { background: var(--highlight); color: #11151a; font-weight: 600; }
.workspace-sidebar .workspace-back { margin-top: auto; padding-top: 16px; font-size: 13px; }
.workspace-content { min-width: 0; padding: 36px; }
.workspace-filters { display: flex; flex-wrap: wrap; align-items: end; gap: 18px; margin-bottom: 28px; }
.workspace-filters [data-slot="field"] { flex: 1 1 200px; gap: 8px; min-width: 0; }
.workspace-filters [data-slot="field"]:first-child { flex-grow: 1.6; }
.workspace-filters [data-slot="field-label"] { font-size: 13px; font-weight: 500; }
.workspace-filters [data-slot="input"], .workspace-filters select { height: 44px; font-size: 16px; color: var(--foreground); background: var(--card); border-radius: 6px; box-shadow: none; }
.workspace-filters [data-slot="native-select-wrapper"] { width: 100%; }
.workspace-filters [data-slot="button"] { min-height: 44px; font-weight: 600; padding-inline: 22px; border-radius: 6px; }
.workspace-filters .mp-text-link { font-size: 13px; font-weight: 500; text-decoration: underline; text-underline-offset: 4px; }
.account-table-scroll { overflow: auto; border: 1px solid var(--border); border-radius: 7px; background: var(--card); }
.account-table-scroll:focus-visible { outline: 2px solid var(--ring); outline-offset: 4px; }
.account-table { width: 100%; min-width: 680px; border-collapse: collapse; text-align: left; font-size: 13px; }
.account-table th, .account-table td { padding: 16px 18px; border-bottom: 1px solid var(--border); }
.account-table th { font-weight: 600; white-space: nowrap; color: var(--muted-foreground); }
.account-table tr:last-child td { border-bottom: 0; }
.account-table td:first-child { overflow-wrap: anywhere; min-width: 140px; max-width: 240px; }
.account-table tbody tr:hover { background: var(--background); }
.account-table-name { font-weight: 500; }
.account-table code { white-space: nowrap; font-size: 11px; color: var(--muted-foreground); }
.account-table time { white-space: nowrap; }
.workspace-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 24px; min-height: 272px; text-align: center; }
.workspace-empty > svg { width: 36px; height: 36px; stroke-width: 1.5; color: var(--muted-foreground); margin-bottom: 6px; }
.mp .workspace-empty h2 { font-size: 19px; letter-spacing: -0.025em; }
.workspace-empty p { color: var(--muted-foreground); font-size: 14px; }
.workspace-empty .mp-text-link { text-decoration: underline; text-underline-offset: 4px; }
.account-pagination { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 22px; font-size: 13px; }
.account-pagination a, .account-pagination > [aria-disabled] { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; }
.account-pagination a:hover { background: var(--accent); }
.account-pagination svg { width: 15px; height: 15px; flex-shrink: 0; }
.account-pagination > [aria-disabled] { color: var(--muted-foreground); }
.account-pagination > [aria-current] { white-space: nowrap; }
.workspace-note { display: flex; gap: 12px; align-items: flex-start; margin-top: 34px; font-size: 13px; }
.workspace-note > svg { width: 19px; height: 19px; margin-top: 2px; flex-shrink: 0; }
.workspace-note p { font-weight: 600; margin-bottom: 3px; }
.workspace-note span { color: var(--muted-foreground); }
.profile-summary { display: flex; align-items: center; gap: 18px; padding: 24px; border: 1px solid var(--border); border-radius: 7px; background: var(--card); }
.profile-avatar { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 50%; background: var(--muted); flex-shrink: 0; }
.profile-avatar svg { width: 23px; height: 23px; stroke-width: 1.5; }
.profile-summary > div:nth-child(2) { min-width: 0; }
.profile-name { font-size: 18px; font-weight: 600; overflow-wrap: anywhere; }
.mp .profile-summary dl { display: block; margin: 0 0 0 auto; min-width: 110px; }
.profile-summary dt { color: var(--muted-foreground); font-size: 12px; }
.profile-summary dd { margin: 2px 0 0; font-size: 13px; font-weight: 500; }
.profile-section { display: grid; grid-template-columns: minmax(180px, 0.8fr) minmax(0, 1fr); gap: 40px; padding-block: 32px; border-bottom: 1px solid var(--border); }
.profile-section-heading h2 { display: flex; gap: 10px; align-items: center; font-size: 17px; letter-spacing: -0.025em; line-height: 1.4; }
.profile-section-heading h2 svg { width: 18px; height: 18px; flex-shrink: 0; }
.profile-section-heading p { margin-top: 8px; font-size: 13px; color: var(--muted-foreground); max-width: 34ch; }
.profile-access { align-items: center; }
.profile-access > a { justify-self: start; text-decoration: underline; text-underline-offset: 4px; }
.profile-signout { margin-top: 24px; max-width: 220px; }

@media (max-width: 1050px) {
  .account-entry .account-panel { padding: 28px; }
  .account-brand { padding: 28px; }
  .account-brand-title { font-size: 24px; }
  .account-workspace { grid-template-columns: 190px minmax(0, 1fr); }
  .workspace-content { padding: 28px 24px; }
  .workspace-sidebar { padding-inline: 12px; }
  .profile-section { grid-template-columns: 1fr; gap: 22px; }
  .profile-section-heading p { max-width: 60ch; }
}
@media (max-width: 800px) {
  .account-entry { width: min(100% - 40px, 520px); }
  .account-entry-grid { grid-template-columns: 1fr; }
  .account-brand { display: none; }
  .account-workspace { grid-template-columns: 1fr; min-height: auto; }
  .workspace-sidebar { border-right: 0; border-bottom: 1px solid var(--border); padding: 18px 22px; gap: 14px; }
  .workspace-label { padding: 0; }
  .workspace-label p { font-size: 16px; }
  .workspace-label span, .workspace-sidebar .workspace-back { display: none; }
  .workspace-sidebar nav { flex-direction: row; flex-wrap: wrap; gap: 8px; }
  .workspace-sidebar nav a { font-size: 13px; }
  .workspace-content { padding: 28px 22px 36px; }
}
@media (max-width: 520px) {
  .account-shell { width: calc(100% - 32px); margin-block: 20px 40px; }
  .account-panel, .account-entry .account-panel { padding: 24px 20px; }
  .mp .account-heading h1 { font-size: 26px; }
  .account-heading { margin-bottom: 24px; }
  .account-heading > p { font-size: 14px; }
  .account-links { margin-top: 24px; }
  .workspace-content { padding-inline: 18px; }
  .workspace-sidebar { padding-inline: 18px; }
  .workspace-filters { gap: 16px 12px; }
  .workspace-filters [data-slot="field"] { flex-basis: 100%; }
  .workspace-filters [data-slot="button"] { flex: 1; }
  .account-pagination { gap: 8px; font-size: 12px; }
  .account-pagination a, .account-pagination > [aria-disabled] { padding-inline: 8px; gap: 5px; }
  .account-pagination svg { display: none; }
  .profile-summary { padding: 20px; flex-wrap: wrap; gap: 12px; }
  .profile-summary > div:nth-child(2) { flex: 1; }
  .mp .profile-summary dl { width: 100%; margin: 6px 0 0; padding-top: 14px; border-top: 1px solid var(--border); }
}
@media (prefers-reduced-motion: reduce) { .account-spinner { animation: none; } }
```
