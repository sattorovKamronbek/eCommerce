# Product requirements — CS2 and Fashion marketplace

Status: frontend preview and accounts slice delivered locally; owner-role and seller-application foundation under local implementation. Started 2026-11-11. Dedicated Supabase project confirmed and public credentials configured locally; live-commerce policies and provider remain open.

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

## Owner and seller request — 2026-11-16

The owner designated `sattorovkamronbek2@gmail.com` as the intended principal
site owner. Owner authority must be attached to the independently verified account,
not granted automatically to an account that merely supplies this email address.
The owner reports that this marketplace account already exists and that they can
access SQL Editor in the dedicated Supabase project; neither claim has yet been
independently verified through the application or a privileged connection.
The owner requested the ability to add sellers, with three permitted scopes:
CS2 only, clothing only, or both. Sellers need a capable product-entry experience.
All sellers apply and require administrator approval, regardless of category.
Both individuals and companies may apply.
The owner requested all important application information, but did not specify
individual fields or identity-document collection and verification procedures.
The owner confirmed applicants may correct and resubmit rejected or mistaken
applications; the administrator reviews each submitted revision.
For seller identity and account-control review, the owner chose direct contact
and secure, separate checking of documents by the administrator. The exact
method, retention and reliable binding to the account remain to be established;
documents are not collected in the application form.
Once approved, sellers may publish new products immediately without an additional
per-product admin review; administrator product-management powers remain.
The owner also requested real customer purchasing and removal of demonstration
items and labels. These are product goals; detailed seller onboarding, listing
workflow, payments, delivery and the remaining commercial rules still need the
decisions recorded below. Sample content must remain clearly identified while it
is still displayed; remove it as real catalog functionality replaces it.

For CS2 purchases, the owner confirmed that both direct-to-seller payment and
payment to the platform are desired, and administrators must be able to see
transactions. For a direct seller payment, the seller or buyer reports the
payment and an administrator checks it. Reporting and administrator verification
are distinct; the detailed evidence and review procedures remain open. The
choice of provider, seller settlement execution, delivery mechanism and reversals
also remain open.
Visibility of transactions does not establish that payments outside the platform
can be automatically detected or independently verified.

For CS2 fulfillment, the seller initially delivers the skin; the owner may want
site-mediated delivery later. Both the seller and buyer confirm delivery; their
confirmations must be recorded separately so administrators can see each one.
The delivery mechanism, evidence and dispute procedure are not yet specified.
A future site-mediated option does not approve Steam custody, bots or an
integration mechanism.

For CS2 payments received by the platform, the owner wants seller payout after
both buyer and seller confirm delivery. If one party does not confirm or objects,
do not release platform-held funds to the seller; an administrator reviews the
case. Direct seller payments outside the platform cannot be held by the site.
Provider support, payout execution, dispute handling and reversals remain to be
designed and verified. The owner selected Click Business as the integration target;
the business is not yet registered and has no provider contract. Click's approval
of CS2, this marketplace model, settlement and actual credentials remain open.
The owner chose no
platform commission for now; later changes and their effective dates need a
separate decision.

For clothing, the owner answered "seller" to who receives payment and who
delivers. Working interpretation: the customer pays the seller directly and the
seller delivers; the owner can correct this interpretation. Payment methods,
shipping regions, returns, and how platform-owned stock is handled remain open.

## Accounts and administration follow-up — 2026-11-16

The owner requested that new users can sign in with email and password without
first confirming their email, while retaining security. The owner also selected
that only the site owner may manage roles, administrators may manage products
and user status, and moderators may review. Blocked users must lose access to
private and trading functions. Independent clothing sellers apply and require
administrator approval. These decisions replace the previous
first-sign-in confirmation preference and settle who should control roles; they
do not by themselves define an owner bootstrap procedure, moderation operations
or commerce rules. At the time of that follow-up, no implementation or provider
setting had changed for these decisions. In particular, a self-asserted email must
not be used as proof of identity or a basis for granting privileges.

The owner requested a visual redesign drawing inspiration from LIS-SKINS for
skins and Ralph Lauren for fashion, plus broader administration and automation.
The first concept in `docs/design/2026-11-16/marketplace-concept.png` was not
accepted. The owner wants all of the offered visual directions available through
themes: dark/technical skins, light/classic fashion, and light or dark versions
of both experiences. The owner approved the visual direction in
`docs/design/2026-11-16/catalog-directions.png`; its generated ratings, counts,
products, prices and unavailable filters are illustrative, not approved data.
The later home-page concept in `docs/design/2026-11-16/home-proposal.png` was
not accepted. The owner asked for the first section to explain the online store
more fully, with additional information on the home page. A revised direction
in `docs/design/2026-11-16/home-explained-proposal.png` also needs changes.
The owner requested information about how the store works, sellers and products;
the existing localized buying/selling explanation is now included on the home
page. Real commerce must not be presented as already available.
Trading, payments, seller operations and the full administration contract still
depend on the unresolved business decisions listed below.

## Accounts and administration follow-up — 2026-11-11

The owner requested a functional application beyond the completed frontend,
including real user registration and an admin panel. After the initial inspection,
the owner explicitly selected this delivery order:

1. Email/password registration, email confirmation, password recovery, personal
   profiles and an administrator-only users list.
2. Seller workspace and a real catalog in a later implementation slice.

On 2026-11-12 the owner asked to finish the user/admin experience and polish the
whole interface, explicitly avoiding oversized text and a generic generated
appearance. This continues the approved accounts/read-only-admin slice, with
confirmation retry, compact typography and useful profile-list search; it does
not settle the outstanding seller, payment or fulfillment decisions. The owner
identified the intended administrator account privately and confirmed the Gmail
SMTP credential rejection has not yet been corrected. Administrator assignment
and successful email delivery remain unverified external setup steps.

The owner confirmed having a Supabase project, then clarified that it belongs to
another application which is still running. This is not permission to modify that
application's database, users or auth settings. A separate Supabase project for
this application is the builder's recommendation; its creation/connection and
schema have not been verified. The owner offered to open another Supabase account
if necessary; a new account has not been selected as a requirement.

The detailed design is approved in
[accounts/admin design](docs/superpowers/specs/2026-11-11-accounts-admin-design.md).
Selecting the first feature set does not settle seller eligibility, commissions,
payments, fulfillment, CS2 custody, refunds or payout rules. Those decisions remain
open before their dependent implementation. The owner approved coding and
confirmed `xevzbtivteugbqbmmtyz` as a newly dedicated project, configured the public
key in ignored local environment and reported applying the versioned migration.
Live anonymous API reads of both private tables were denied with 401/42501.
Authenticated/email/admin integration results remain to be established; local
implementation and tests are recorded in `PROJECT_PROGRESS.md`.

## Proposed, not approved

On 2026-11-15 the owner requested complete administration, email/username login,
coherent skins/clothing experiences and login-security checks. Asked which modules
matter, the owner answered that all are important, including users/roles,
catalogues, sellers and order/payment administration. This confirms their desired
scope, not unresolved permission, seller, payment or fulfillment policies. See
the [reviewable expansion proposal](docs/superpowers/specs/2026-11-15-admin-marketplace-expansion.md).
Username authentication and privileged writes are proposed next phases; they are
not implemented or implied by the existing email/read-only-admin design.

- Candidate modular-monolith domains and additive migration steps in MARKETPLACE_AUDIT.md.
- Reusing UI primitives, token foundations, localization and test tooling while introducing domain-specific catalog/listing/fulfillment contracts.
- Seller workspaces, further admin modules and commerce domain contracts remain proposed. The initial read-only admin workspace is separately approved in the accounts slice above. The development catalog uses `/{locale}/marketplace`, separate `/cs2` and `/fashion` paths and localized sample details; the original home is retained at `/storefront-preview`.
- Preliminary phases 0–10 from the owner brief, with proposed measurable gates in the audit. The owner may change their order and content.

Potential item/category fields, seller metrics, payouts, reviews, promotions, storefront modules and advanced integrations listed in the brief express future capability options. Their exact data models, sources and first-release inclusion remain unapproved.

## Open decisions

| ID | Decision | Why it matters | Status |
| --- | --- | --- | --- |
| D01 | First release: CS2, fashion, or both; first customer journey and measurable goal | Defines minimal launch scope and dependencies | Both together confirmed; detailed first journeys and success measures remain open |
| D02 | Audience, buyer/seller countries, operating entity country, currencies/languages | Constrains providers, onboarding, shipping, consumer rules and localization | Uzbekistan/nearby region, en/uz/ru and UZS primary currency confirmed; exact countries, operating entity and production default locale open |
| D03 | CS2 role: discovery/listings only, P2P, manual coordination or permitted integration; who takes payment/delivers | Determines custody, proof of delivery, reversal risk and settlement feasibility | Listings/contact + P2P initially; both direct-seller and platform-payment options desired; operating rules, delivery/reversal responsibility and verification open |
| D04 | Seller eligibility, individual/business sellers, invitation/open applications, verification/reverification | Defines onboarding, risk and private data requirements | Individuals and companies may apply; all require admin approval; verification and detailed eligibility remain open |
| D05 | Fashion operations: third-party sellers, platform-owned stock or hybrid; permitted categories | Determines ownership, fulfillment and responsibility | Hybrid confirmed: own products + independent sellers; categories, seller onboarding, stock and fulfillment rules still open |
| D06 | Commission basis/rate, subscriptions/listing fees and who pays fees | Defines pricing, accounting and seller economics | No platform commission for now; other fees and later changes remain open |
| D07 | Payment methods/provider and money flow: direct seller, provider split or platform collection | Requires provider support and country/model review | Click Business selected as target; business registration, contract, support for CS2 and settlement, asset/network and operating rules remain open |
| D08 | Payout timing, reserves, reversal exposure, refund/dispute responsibility | Defines accounting and settlement; no wallet/escrow approved | CS2 platform funds: seller payout after both delivery confirmations, otherwise admin review; provider, execution and reversals remain open |
| D09 | Fashion shipping regions, carrier responsibility, returns and customer support | Defines logistics/state transitions | Seller sets shipping price; owner delegated a common return policy to research; see docs/FASHION_RETURNS_POLICY.md. Regions, carrier and operational workflow remain open |
| D10 | Seller Center/Admin modules and action permissions at launch | Limits privileged scope and defines role matrix | Initial admin users list selected with accounts; seller modules and other privileged actions still require decisions |
| D11 | Brand name, visual references and shared versus distinct identity | Gates design generation and navigation decisions | Follow-up; ORO remains temporary |
| D12 | Expected sellers, listings, daily users, order volume and launch timeline/budget constraints | Grounds query, operational and performance design | Large-scale ambition reconfirmed; numeric targets, timeline and budget remain follow-up |
| D13 | Steam/item/price/image data sources, permitted commercial use and verification confidence | Prevents unsupported capabilities and misleading market/ownership claims | Research + owner gate |
| D14 | Mixed-ecosystem/multi-seller baskets, split payments/orders and customer-facing totals | Determines checkout boundaries and refund/fulfillment grouping | Separate order for each seller and ecosystem; checkout and payment implementation remain open |
| D15 | Identity backend, signup methods, account/admin first slice and infrastructure isolation | Defines real authentication, private data and initial privileged scope | Detailed design approved; dedicated project xevzbtivteugbqbmmtyz confirmed, public credentials configured and migration applied per owner; authenticated/email/admin end-to-end verification pending; other live application's project remains untouched |

## Deferred decisions and technical constraints

No custodial/bot-based CS2 model, wallet or escrow is selected. Click Business is the selected integration target, but no contract or supported marketplace payout mechanism has been verified. No platform commission is charged for now, and platform-received CS2 funds are intended for payout after both parties confirm delivery; payout execution remains open. All sellers require administrator approval, while eligibility and verification remain open. Integrations depend on documented access and permitted use. Steam policy research does not establish authorization for a particular commercial model. No unavailable ownership/float/pattern/market-price API is assumed.

Before real trading or money movement: owner approves the commercial model; provider/platform/jurisdiction feasibility is checked; server authorization, transactions, idempotency, verified events, reversal/dispute handling and reconciliation are tested.

## Decision recording protocol

For each owner answer, record date, decision ID, the answer, scope and remaining conditions. Recommendations stay labelled proposed until explicit confirmation. Update the audit/roadmap after decisions; do not erase prior requirements or delivery history. Later groups should be asked in manageable batches, not as an unstructured questionnaire.

## Owner answers

| Date | Decision IDs | Owner statement and scope | Remaining conditions |
| --- | --- | --- | --- |
| 2026-11-18 | D03, D07, D09, D14 | A reservation without a payment report is automatically cancelled after 48 hours; a direct-payment report may store payment time, amount and transaction ID; clothing orders may store the buyer's name, phone and address, visible to the relevant seller and admin. | The buyer also needs access to their own order. Payment reports are unverified until admin review; scheduler operation, payment evidence review, personal-data retention, refunds and provider support remain unresolved. |
| 2026-11-18 | D09, D14 | Seller sets delivery price; orders are separated by seller and ecosystem. Owner asked us to derive one clothing return rule from other stores. | Selected customer-facing draft in docs/FASHION_RETURNS_POLICY.md; legal review, seller implementation and checkout remain outstanding. |
| 2026-11-16 | D02, D07 (partial) | Business not yet registered; no payment-provider contract. After reviewing options, selected Click Business as target. | Verify merchant eligibility, Visa, CS2 listings, marketplace settlement, hold and seller payouts with Click; register the business and obtain credentials. Selection is not evidence of any approved capabilities or live connection. |
| 2026-11-16 | D04 (partial) | Administrator contacts the seller and checks documents securely outside the site to verify identity and account control. | Establish the actual secure procedure, evidence, retention and binding to the account; never treat self-reported email alone as proof. |
| 2026-11-16 | D04 (partial) | Applicants may correct and resubmit rejected or mistaken applications; administrators review them again. | Seller identity evidence and approved-seller category changes remain open. |
| 2026-11-16 | D04 (partial) | Seller applications should require all important information. | Exact fields and safe identity/document verification remain to be defined. |
| 2026-11-16 | D04 (partial) | Individuals and companies can apply to become sellers. | Verification, eligibility and application details remain open. |
| 2026-11-16 | D04, D10 (partial) | Approved sellers can immediately publish new products without per-product administrator approval. | Listing validation, administrator actions and complaint/removal procedures remain to be defined. |
| 2026-11-16 | D03, D08 (partial) | If a party fails to confirm CS2 delivery or objects, hold platform funds and have an administrator review. | A site cannot hold an already completed direct seller payment; dispute procedures and provider support remain open. |
| 2026-11-16 | D07 | No payment provider has been selected yet. | Provider, entity, supported payment and payout flows and feasibility remain open. |
| 2026-11-16 | D04 (partial) | All sellers, including CS2-only and dual-category sellers, apply and require administrator approval. | Eligibility, verification, category changes and detailed onboarding remain open. |
| 2026-11-16 | D06 | No platform commission for now. | Later changes and effective dates require a decision. |
| 2026-11-16 | D05, D07, D09 (partial) | Answered "seller" when asked who receives clothing payment and delivers; interpreted as seller for both. | Owner can correct interpretation; payment methods, shipping, returns and platform-owned stock remain open. |
| 2026-11-16 | D03, D08 (partial) | Pay the seller after both buyer and seller confirm delivery for CS2 funds initially received by the platform. | Provider support, settlement execution, disputes, reversals and missing confirmations remain open. |
| 2026-11-16 | D03 (partial) | Both seller and buyer confirm delivery of the CS2 skin. | What happens if they disagree or one does not confirm, evidence and dispute handling remain open. |
| 2026-11-16 | D03 (partial) | CS2 skins are initially delivered by the seller; site-mediated delivery may be considered later. | Delivery mechanism, proof and disputes are unspecified; no custody or automation is approved. |
| 2026-11-16 | D03, D07, D10 (partial) | For a direct seller payment, the seller or buyer reports the payment and an administrator checks it. | Evidence, review and dispute procedures remain open; no automatic verification is implied. |
| 2026-11-16 | D03, D07, D10 (partial) | For CS2, wants both direct-to-seller and platform payments, with administrator visibility into transactions. | Provider, direct-payment review procedure, settlement, delivery and reversals remain open. |
| 2026-11-11 | D01, D12 (partial) | Reaffirmed a complete site for CS2 skins and clothing with a large-scale ambition; asked to adapt the existing site now | Quantified capacity, timeline and budget remain open. |
| 2026-11-11 | D01 | Selected CS2 and clothing together for the first release | Specific launch journeys and success measures remain open. |
| 2026-11-11 | D02 (partial) | Primarily Uzbekistan and neighboring countries; English, Uzbek and Russian; other countries possible later | Exact countries, operating entity country, currency/currencies and default language are not selected. Regional intent does not approve worldwide shipping or trading. |
| 2026-11-11 | D03 (partial) | Selected options 1 and 2 (listings/contact and P2P) initially; wants option 3 (platform-managed commerce) eventually | Payment recipient, delivery/reversal responsibility, verification and permitted integration still need decisions. This is a staged direction, not approval to implement money movement or custody. |
| 2026-11-11 | Frontend/migration scope | Answered “ikkisi ham” (both) to additive preview versus preserved legacy home + entry replacement | Applied as a sequence: new locale routes, recoverable preservation, legacy home at `/storefront-preview`, main entry cutover after checks. No deployment included. |
| 2026-11-11 | D03, D07 (partial) | Said both payment possibilities may be supported: direct seller payment and platform receipt, with seller delivery in the presented options | Desired future capabilities only. No provider, country feasibility, settlement timing, dispute/reversal responsibility or transaction verification selected. Preview has no live payment/delivery actions. |
| 2026-11-11 | D05 | Confirmed own products and independent clothing sellers together | Hybrid supply confirmed. Seller verification, fulfillment, returns and production stock contracts remain open. |
| 2026-11-11 | D02, D07 (partial) | Answered “UZS keyin crypto va VISA orqali albatta”: UZS primary currency; Visa and cryptocurrency payment capabilities requested, with crypto mentioned as later | Visa is a requested card-payment capability, not a chosen gateway or another currency. Crypto assets/networks, provider support, money flow/custody and operating entity country remain open. No live payment capability is implemented. |
| 2026-11-11 | D10, D15 (partial) | Requested that the site become functional, specifically including admin and user accounts, and asked for necessary information to be requested | Request starts backend/account discovery; unspecified commercial operations are not silently selected. |
| 2026-11-11 | D15 (partial) | Answered “Menda mavjud Supabase loyihasi bor” | Project identity, schema and access were not supplied. |
| 2026-11-11 | D10, D15 (partial) | Answered “Ha, shu tartibda boshlang” to accounts first: email/password, confirmation, recovery, profile and admin users list; then seller workspace/real catalog | First slice/order selected; detailed design review and verified infrastructure remain before implementation. |
| 2026-11-11 | D15 (partial) | Clarified that the existing Supabase project serves another currently running application; offered another account if needed | Preserve the other application. Dedicated project recommended, not created or connected. |
| 2026-11-11 | D10, D15 | Approved the detailed accounts/admin design and explicitly requested coding; subsequently confirmed project xevzbtivteugbqbmmtyz is newly dedicated to this marketplace | Implementation and integration checks required; no commerce decisions implied. |
| 2026-11-11 | D15 setup | Reported local publishable-key setup and execution of supabase/migrations/202611110001_accounts.sql | Public settings and anonymous denial independently checked; email template/delivery and authenticated/admin workflows still require verification. |
| 2026-11-12 | D15 email setup | Reported registration submission failure, confirmed Custom SMTP is off, has no known domain/SMTP service and can create free resources; latest update says setup has not been done | Live confirmation-resend probe returned 429. Builder provided an existing-Gmail/App-Password setup for local testing; this is not configured or verified and does not select a production email service. |
| 2026-11-12 | D15 email setup follow-up | Confirmed Google 2-Step Verification was initially off; received App Password/Gmail SMTP instructions and subsequently reported setup complete | Post-setup resend returned 500 unexpected_failure with an email-delivery error. Exact Auth log requested; SMTP authentication and actual delivery are not yet verified. No production email-service or commerce decision implied. |

First discovery and frontend migration answers are recorded above. Implement the authorized frontend preview while keeping real trading unavailable. Next discovery must resolve operating entity, exact country coverage, the operational distinction between the two payment flows, provider feasibility, crypto asset/network if pursued, delivery/reversal responsibility and seller onboarding before dependent backend/commerce implementation. UZS preference does not make sample prices authoritative or approve a payment provider.

### Signup correction — 2026-11-16

The owner reiterated that signup must not request email confirmation. The app now
supports a provider-issued immediate session and refuses to submit signup if
public provider settings still require confirmation. This replaces the previous
behavior that signed out immediate sessions and displayed confirmation guidance.
No provider setting was changed. UUID role authorization, RLS and password-based
authentication remain in place; automatic confirmation is not mailbox proof.
