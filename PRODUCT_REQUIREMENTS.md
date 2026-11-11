# Product requirements — CS2 and Fashion marketplace

Status: first owner discovery answers and combined frontend migration direction recorded; frontend preview authorized, commercial details remain open. Date: 2026-11-11. No final backend or live-commerce architecture is approved by this document.

## Confirmed direction from the owner's transformation brief

- Transform the existing repository into a premium multi-vendor platform with related but distinct CS2 and fashion ecosystems; preserve current work and use an incremental migration strategy.
- Owner decides product priorities and significant business policies. Audit/discovery precedes major implementation. Do not silently convert proposals into requirements.
- CS2 is legitimate item commerce. No wagering, betting, roulette or randomized paid rewards. No Steam passwords, session cookies or Steam Guard secrets; no unsupported integration or unauthorized trade automation.
- Fashion physical-product logistics and CS2 digital-item fulfillment need specialized workflows.
- Platform owner, administrators, moderators, sellers, seller staff and customers need appropriately scoped authority, enforced on the server. Independent sellers must not access each other's private operational data.
- Seller Center and Platform Admin Center are intended future products; exact modules, permissions and launch scope need approval. Financial metrics must come from records, not fabricated numbers.
- Retain preferred Next.js/React/TypeScript/Tailwind/shadcn stack where practical; Supabase/PostgreSQL remain preferred backend candidates. A modular monolith is a starting preference, not a locked schema or implementation.
- Both ecosystems share primitives/accessibility while retaining different identities: dark-first, professional CS2 commerce; spacious editorial fashion. Support coordinated light, dark and system themes.
- Server validation/authorization, transaction integrity, exact monetary representation, verified payment outcomes, auditability and reversals/fraud handling are required engineering properties.
- Ask the first discovery group and wait for owner answers before locking architecture or making major changes.

## Existing implementation facts — not new marketplace launch decisions

The original store uses temporary ORO branding, Uzbek, UZS, local development products and browser persistence. It has no production checkout, account system, seller backend, Steam integration or payment provider. The former single-vendor roadmap is preserved in docs and historical PROJECT_PROGRESS.md sections. These historical settings were not automatically transformation decisions; UZS was subsequently explicitly selected by the owner, while ORO remains temporary and the preview retains Uzbek as its default entry.

## Latest owner request — 2026-11-11

The owner reiterated in Uzbek that the existing site should become a complete, large-scale site selling both CS2 skins and clothing, and requested work on that transformation now. In the first discovery answers, the owner confirmed:

- **Release scope:** CS2 and fashion together in the first version.
- **Market:** primarily Uzbekistan and nearby countries, with other countries potentially using the platform later. The exact neighboring-country list, operating entity country and cross-border shipping coverage are not specified.
- **Languages:** English, Uzbek and Russian. Default language and locale/currency selection behavior are not specified.
- **Currency/payment preferences:** the owner subsequently selected UZS as the primary currency and requested Visa and cryptocurrency payment capabilities. No gateway, acquirer, crypto asset/network, custody arrangement or availability is selected; crypto was mentioned as a later capability. Operating entity country remains unanswered.
- **CS2 rollout:** initially listings/contact and P2P; the eventual ambition is platform-managed commerce. This does not yet assign who receives payment, who is responsible for delivery/reversals or how a trade is verified. No custody, bot, wallet, escrow or payment provider is approved by that answer.
- **Scale:** a large-scale ambition; numerical capacity, launch timeline and budget are still unspecified.

The owner subsequently selected both frontend migration options, requested support for both CS2 payment-flow possibilities, and confirmed hybrid clothing supply. The implementation interpretation was communicated: add new locale routes, preserve the existing home at `/storefront-preview`, then switch `/` to the marketplace after verification. This authorizes the bounded frontend preview in [docs/MARKETPLACE_PHASE1_PROPOSAL.md](docs/MARKETPLACE_PHASE1_PROPOSAL.md). It does not authorize a provider, live payment flow, custody or seller settlement policy.

## Proposed, not approved

- Candidate modular-monolith domains and additive migration steps in MARKETPLACE_AUDIT.md.
- Reusing UI primitives, token foundations, localization and test tooling while introducing domain-specific catalog/listing/fulfillment contracts.
- Future seller/admin workspace routes and production domain contracts remain proposed. The approved development preview uses `/{locale}/marketplace`, separate `/cs2` and `/fashion` paths and localized sample details; the original home is retained at `/storefront-preview`.
- Preliminary phases 0–10 from the owner brief, with proposed measurable gates in the audit. The owner may change their order and content.

Potential item/category fields, seller metrics, payouts, reviews, promotions, storefront modules and advanced integrations listed in the brief express future capability options. Their exact data models, sources and first-release inclusion remain unapproved.

## Open decisions

| ID | Decision | Why it matters | Status |
| --- | --- | --- | --- |
| D01 | First release: CS2, fashion, or both; first customer journey and measurable goal | Defines minimal launch scope and dependencies | Both together confirmed; detailed first journeys and success measures remain open |
| D02 | Audience, buyer/seller countries, operating entity country, currencies/languages | Constrains providers, onboarding, shipping, consumer rules and localization | Uzbekistan/nearby region, en/uz/ru and UZS primary currency confirmed; exact countries, operating entity and production default locale open |
| D03 | CS2 role: discovery/listings only, P2P, manual coordination or permitted integration; who takes payment/delivers | Determines custody, proof of delivery, reversal risk and settlement feasibility | Listings/contact + P2P initially; both direct-seller and platform-payment options desired; operating rules, delivery/reversal responsibility and verification open |
| D04 | Seller eligibility, individual/business sellers, invitation/open applications, verification/reverification | Defines onboarding, risk and private data requirements | Follow-up |
| D05 | Fashion operations: third-party sellers, platform-owned stock or hybrid; permitted categories | Determines ownership, fulfillment and responsibility | Hybrid confirmed: own products + independent sellers; categories, seller onboarding, stock and fulfillment rules still open |
| D06 | Commission basis/rate, subscriptions/listing fees and who pays fees | Defines pricing, accounting and seller economics | Follow-up; no default |
| D07 | Payment methods/provider and money flow: direct seller, provider split or platform collection | Requires provider support and country/model review | Visa and later crypto requested; both direct-seller/platform-payment possibilities desired; provider, asset/network, custody and operating rules unselected |
| D08 | Payout timing, reserves, reversal exposure, refund/dispute responsibility | Defines accounting and settlement; no wallet/escrow approved | Follow-up |
| D09 | Fashion shipping regions, carrier responsibility, returns and customer support | Defines logistics/state transitions | Follow-up |
| D10 | Seller Center/Admin modules and action permissions at launch | Limits privileged scope and defines role matrix | Follow-up |
| D11 | Brand name, visual references and shared versus distinct identity | Gates design generation and navigation decisions | Follow-up; ORO remains temporary |
| D12 | Expected sellers, listings, daily users, order volume and launch timeline/budget constraints | Grounds query, operational and performance design | Large-scale ambition reconfirmed; numeric targets, timeline and budget remain follow-up |
| D13 | Steam/item/price/image data sources, permitted commercial use and verification confidence | Prevents unsupported capabilities and misleading market/ownership claims | Research + owner gate |
| D14 | Mixed-ecosystem/multi-seller baskets, split payments/orders and customer-facing totals | Determines checkout boundaries and refund/fulfillment grouping | Follow-up; no default |

## Deferred decisions and technical constraints

No custodial/bot-based CS2 model, wallet, escrow, provider, fee, payout period or seller approval policy is selected. Integrations depend on documented access and permitted use. Steam policy research does not establish authorization for a particular commercial model. No unavailable ownership/float/pattern/market-price API is assumed.

Before real trading or money movement: owner approves the commercial model; provider/platform/jurisdiction feasibility is checked; server authorization, transactions, idempotency, verified events, reversal/dispute handling and reconciliation are tested.

## Decision recording protocol

For each owner answer, record date, decision ID, the answer, scope and remaining conditions. Recommendations stay labelled proposed until explicit confirmation. Update the audit/roadmap after decisions; do not erase prior requirements or delivery history. Later groups should be asked in manageable batches, not as an unstructured questionnaire.

## Owner answers

| Date | Decision IDs | Owner statement and scope | Remaining conditions |
| --- | --- | --- | --- |
| 2026-11-11 | D01, D12 (partial) | Reaffirmed a complete site for CS2 skins and clothing with a large-scale ambition; asked to adapt the existing site now | Quantified capacity, timeline and budget remain open. |
| 2026-11-11 | D01 | Selected CS2 and clothing together for the first release | Specific launch journeys and success measures remain open. |
| 2026-11-11 | D02 (partial) | Primarily Uzbekistan and neighboring countries; English, Uzbek and Russian; other countries possible later | Exact countries, operating entity country, currency/currencies and default language are not selected. Regional intent does not approve worldwide shipping or trading. |
| 2026-11-11 | D03 (partial) | Selected options 1 and 2 (listings/contact and P2P) initially; wants option 3 (platform-managed commerce) eventually | Payment recipient, delivery/reversal responsibility, verification and permitted integration still need decisions. This is a staged direction, not approval to implement money movement or custody. |
| 2026-11-11 | Frontend/migration scope | Answered “ikkisi ham” (both) to additive preview versus preserved legacy home + entry replacement | Applied as a sequence: new locale routes, recoverable preservation, legacy home at `/storefront-preview`, main entry cutover after checks. No deployment included. |
| 2026-11-11 | D03, D07 (partial) | Said both payment possibilities may be supported: direct seller payment and platform receipt, with seller delivery in the presented options | Desired future capabilities only. No provider, country feasibility, settlement timing, dispute/reversal responsibility or transaction verification selected. Preview has no live payment/delivery actions. |
| 2026-11-11 | D05 | Confirmed own products and independent clothing sellers together | Hybrid supply confirmed. Seller verification, fulfillment, returns and production stock contracts remain open. |
| 2026-11-11 | D02, D07 (partial) | Answered “UZS keyin crypto va VISA orqali albatta”: UZS primary currency; Visa and cryptocurrency payment capabilities requested, with crypto mentioned as later | Visa is a requested card-payment capability, not a chosen gateway or another currency. Crypto assets/networks, provider support, money flow/custody and operating entity country remain open. No live payment capability is implemented. |

First discovery and frontend migration answers are recorded above. Implement the authorized frontend preview while keeping real trading unavailable. Next discovery must resolve operating entity, exact country coverage, the operational distinction between the two payment flows, provider feasibility, crypto asset/network if pursued, delivery/reversal responsibility and seller onboarding before dependent backend/commerce implementation. UZS preference does not make sample prices authoritative or approve a payment provider.
