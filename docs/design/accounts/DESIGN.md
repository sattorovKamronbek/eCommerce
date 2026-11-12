# Account and users workspace design

Date: 2026-11-12. Generated with built-in Imagegen as implementation references
for the owner's requested refinement of the approved accounts slice. This is a
builder-selected direction, not a claim that the owner reviewed the screenshots.
Existing marketplace artwork and local fonts are reused; no dependency added.

## References and prompt set

- [Account reference](account-concept.png): full desktop ORO sign-in, shared
  navigation/development notice, dark product illustration panel and white form;
  restrained typography, email/password/visibility/recovery/register controls.
- [Admin reference](admin-concept.png): full desktop read-only Users workspace,
  narrow navigation rail, literal name/exact-language search, native filter form,
  empty profile table, pagination and read-only explanation. Explicitly prohibited
  fake customers, metrics, charts, role mutations and commerce controls.

Both prompts specified #f7f8fa page, #11151a text, white surfaces, #d6dbe1 borders,
#535d69 muted text, #d0f36b restrained accent, DM Sans 14–16px text, 28px screen
titles, native HTML controls and full, readable desktop screens. Existing en/uz/ru
copy and actual functionality take precedence over generated text artifacts.

## Implementation system

- Typography: 28px account/workspace titles, 26px narrow phone titles, 26px brand
  aside title, 14–15px prose, 13–14px labels/navigation/table, 16px form inputs to
  avoid mobile zoom. Public home max 56px; catalog max 44px; details max 38px.
- Surfaces: one split entry container with 10px outer corners, 36–40px desktop
  inset; account forms on white/current theme card; no gradients or shadows.
- Workspace: 220px rail, fine dividing border, 36px main inset, single native
  filter row, 20-row table plus lookahead, 7px table corners; active rail uses lime.
- Icons: existing Lucide outline family, 18–20px controls, 36px empty users icon;
  decorative icons hidden from assistive technology. At least 44px touch targets.
- Media: existing rifle/overshirt illustration assets, separate frames, object-fit
  cover, no overlays. Decorative aside hidden below 800px; form remains primary.
- Mobile: sidebar becomes wrapping horizontal navigation; filters stack; actual
  tables scroll within their labelled keyboard-focusable region, never the body.
- All text stays in src/messages; protected pages stay server authorized. Tests
  may use SDK fixtures; application runtime has no fixture/role bypass.

## Intentional reference adaptations

Keep current localized Discover/navigation, development notice and footer text,
rather than the image model's renamed links or invented hostname. Add the required
real confirmation-resend link below entry forms. Keep all three native theme
options. Keep current actual illustration assets instead of invented exact items.
Profile settings extend this same system. No live authenticated screenshot is
claimed without an actual confirmed, authorized session.

Final render/fidelity evidence and integration limits are recorded in
PROJECT_PROGRESS.md.

## Render comparison — 2026-11-12

Both generated references and rendered captures were inspected with view_image
at their native 1487×1058 desktop size, plus 390px mobile and 320px Russian
registration. First-pass captures are in the external evidence directory
`/home/kamron/.codex/artifacts/ecommerce-polish-20261112/`.

| Comparison | Observed implementation |
| --- | --- |
| Account composition | Navy illustration panel left, white form right; single bordered outer surface |
| Typography | 28px titles and 14–16px form text; mobile title 26px, public home 56px maximum |
| Palette | Existing cool-white/navy/lime tokens preserved; no gradients/tints or decorative effects |
| Media | Separate rifle/overshirt frames; original generated assets, cover crop and no overlay |
| Form geometry | Shared 46px controls, 6px corners, consistent insets and visible focus |
| Admin structure | Navigation rail, search/language row, actual table columns, empty guidance and pagination |
| Mobile | Primary form visible, illustration aside hidden, workspace rail wraps, table scroll contained |
| Copy | Existing translated navigation/footer and required resend link retained; no invented URL/metrics |

Admin captures are explicitly marked static component QA fixtures, with no live
account data. They verify layout/accessibility, not login, current admin assignment
or authenticated database integration. The deployed application has no QA bypass.
These adaptations implement the owner's compact-type request; no material layout
defect was observed in the inspected states.

The final production build was captured again after the complete 60-case browser
suite. Native desktop login/admin and 390px Uzbek dark registration were inspected
with view_image; the dark registration passed axe. Colors, type, layout, media,
control states and wrapping remain consistent with the recorded system. The
initial dark capture interacted before React hydration; the capture script now
proves a working client password control before selecting theme. No app code or
timeout was changed for this capture sequencing issue.
