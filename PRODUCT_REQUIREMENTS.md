# VERSAX product requirements — CS2 skins and clothing

## Confirmed launch direction — 2026-11-22

VERSAX will launch as a single-vendor store. The owner's business owns the
catalog and inventory for both CS2 and clothing and is the sole merchant.
Customers can register, browse, purchase and manage their own accounts. Only
authorized internal users can create and manage products. Public seller
registration, independent seller storefronts and onboarding, commission
splitting and third-party payouts are outside launch scope. This decision
supersedes the earlier marketplace, hybrid stock and seller settlement plans.

Both categories launch together. The established direction is Uzbekistan and
nearby markets, English, Uzbek and Russian, and UZS as the primary currency.
Keep the localized App Router frontend, real Supabase accounts, the current
server-side authorization architecture and the dedicated VERSAX project
`xevzbtivteugbqbmmtyz`. Existing order, account and audit records must survive
the transition. Production ownership and availability for legacy listings
must be verified before treating them as store stock.

### Access roles

| Role | Confirmed responsibility | Current implementation |
| --- | --- | --- |
| Owner | Complete platform control, including assigning and revoking staff access. Owner authority requires independently verified provisioning. | Existing UUID-based `owner` role, verified MFA, and recent authenticator verification for privileged role management. Signup and migrations do not promote anyone. |
| Admin | Administrative operations with configurable permissions. | Existing `admin` role and verified MFA. Existing admin operations need to be mapped to individual permissions for launch. |
| Manager/Staff | Products, inventory and orders according to assigned permissions. | Launch requirement. The current database role constraint permits `owner` and `admin`; a legacy seller grant is unrelated to staff authority. |
| Customer | Shopping and personal account management. | Existing authenticated customer access without a privileged role row. |

### Internal operations and product workflows

The Owner Dashboard and Admin Dashboard should lead staff to the actions they
are permitted to take. Product Management includes quick entry, bulk edits,
image management, controlled publishing and availability. Inventory includes
stock counts, movement history, and low-stock warnings. Order Management,
Customer Management, Payment Management, Shipping and Delivery Management,
CS2 Trade Management, Sales Analytics, Promotions and Discounts, Customer
Support, Security and Audit Logs, Staff Permissions, and Store Settings are
launch workstreams. Use real records for sales and revenue and expose the
operational actions that non-technical staff need for daily work.

- **CS2** requires individual asset identity, verified availability, reservation
  status and traceable trade status. A wear option can describe more than one
  unique asset. A trade and any dispute must identify the asset involved.
- **Clothing** requires product variants, stock per color/size combination,
  product images, shipping and returns. Retain the current variant galleries
  and product details where appropriate.
- **Orders and payments** use authoritative server prices and inventory checks,
  exact UZS amounts, idempotent state transitions and auditable payment review.
  Clothing fulfillment and CS2 trades use their own workflows.

Future independent selling is an extension point. Keep catalog, inventory,
orders, payments and fulfillment modular and document where merchant ownership
would attach. The launch has one merchant and no seller payout or onboarding
infrastructure beyond the retained historical implementation.

### CS2 reservation setup and operations

The owner designated Fazliddin to handle CS2 sales and Shakhriyor to handle
clothing sales. Fazliddin enters the actual Steam Asset ID and buyer-facing
payment contact for each of his published CS2 listings. The existing Owner
can correct these settings. These responsibilities do not assign an Owner or
Admin role to either operator.

CS2 payment and Steam trade delivery start with the manual workflow. Any
future trade automation depends on documented platform support and authorization.

### Catalog selling access — 2026-11-25

Verified administrators can assign existing active accounts the right to sell
CS2 skins, clothing, or both on behalf of VERSAX. The Owner can also manage
catalog access for Owner and Admin accounts. Assigned staff use two-step
verification to publish their own listings and configure manual reservations.
The assignment requires only an existing VERSAX account and the administrator's
selection. CS2 reservations still identify the item by its actual Asset ID.

An explicit assignment controls the categories available to that account.
Removing a category hides its listings and closes new reservations. Existing
orders remain available to their participants and administrators.

### Decisions needed before live acceptance

| Decision | Current launch status |
| --- | --- |
| Existing inventory and orders | Confirm which legacy listing, asset and checkout records belong to the business, the verified catalog operator, and how any outstanding legacy orders will be resolved. Do not infer business ownership from a seller grant. |
| Staff access | Confirm initial staff assignments and which operators can publish, adjust stock, handle payment/refunds, view customer data and manage settings. The proposed authorization design uses owner-assigned permissions and verified MFA. |
| Merchant payment operation | Click Business is an earlier preference. Confirm the merchant entity, provider contract, supported categories, payment evidence and refund/reconciliation process. Visa capability and later cryptocurrency remain preferences pending feasibility. |
| CS2 trade operation | Confirm the authorized delivery method, evidence of ownership/availability and receipt, trade restrictions, reversals and dispute handling. Existing manual orders do not verify Steam ownership or establish a custody model. |
| Clothing shipping, returns and support | Confirm launch destinations, rates, carriers, return eligibility and responsibility, and support escalation. The prior [draft returns policy](docs/FASHION_RETURNS_POLICY.md) needs review for the business's own store. |
| Checkout structure and release targets | Confirm mixed-category checkout expectations, operating/default locale, operating geographies, business timeline and measurable launch targets. Fulfillment stays separated by product type. |

See the [implementation roadmap](docs/MILESTONES.md) for proposed sequencing,
[architecture](docs/ARCHITECTURE.md) for domain boundaries and extension points,
and [project progress](PROJECT_PROGRESS.md) for implementation and release status.

## Historical marketplace decisions and delivery

The following sections preserve the earlier marketplace work and approvals.
The launch decision above takes precedence over historical seller, payment
recipient and fulfillment plans. Earlier delivery notes record the state as
of their original dates.

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

The original store uses temporary ORO branding, Uzbek, UZS, local development products and browser persistence. It has no production checkout, account system, seller backend, Steam integration or payment provider. The former single-vendor roadmap is preserved in docs and historical PROJECT_PROGRESS.md sections. These historical settings were not automatically transformation decisions; UZS was subsequently explicitly selected by the owner, and the preview retains Uzbek as its default entry. The owner later selected VERSAX as the marketplace brand and supplied the logo.

## Administrator activity and site operations — 2026-11-22

The owner requested account details, site operations in the admin dashboard,
and visibility into how many items each user bought. They selected a history
of every successful sign-in.

The admin workspace reads account data and the last sign-in from Supabase
Auth. History starts when the migration is installed and records successful
password sign-ins. If the account requires MFA, the entry records when MFA
succeeds. The admin view displays the timestamp for the selected account.
Account detail and this history require the existing verified admin or owner
access. The overview counts currently completed orders, sums their item
quantities, and shows their total including delivery in UZS. Admins can open
purchase and sales order lists filtered to the selected account.

The dashboard shows account and listing counts, pending seller applications
and payment reports, disputes, all orders and completed orders. Reservation
availability is shown per ecosystem using the existing settings.

## Owner dashboard and profile verification — 2026-11-21

The owner requested a dashboard for managing users and roles, new CS2 and
clothing listings, sales, verification and account suspensions. The owner
confirmed that they should be able to select a specific profile and request
either a manual identity check or contact verification. For a contact check,
the owner chooses whether the user receives the code by email or SMS.
The owner confirmed that requesting verification does not automatically limit
buying or selling. The owner manages account suspensions separately.

The dashboard uses the existing administration workspace. It links to profiles
and access management, recent seller listings, seller applications, direct-payment
orders, payment reports and disputes. Role grants and revocations are limited to
administrator access under the current owner and recent MFA requirements.
Suspension and restoration use the existing audited marketplace access controls.

The owner approved the manual identity workflow. The owner sends a request from
a specific user’s admin profile. The user sees a one-time code in their account
and shares it when the owner contacts them directly. The owner independently
checks the person’s identity and records the decision with that code. Documents
stay outside the site. The request and decision retain their history and neither
changes account roles or seller approval. The existing seller identity review
has its own account-control check.

For the contact workflow, the proposed interaction is to verify the code from the
same signed-in profile. The owner confirmed that email and SMS services are
currently unconfigured. Select and verify the delivery services and agree on the
source of customers’ phone numbers before enabling this workflow. Email and SMS
should verify control of the contact destination. Supabase Auth auto-confirmation
does not establish that proof.

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
On 2026-11-22 the owner requested that customers see the seller application
only while an administrator has opened intake. A verified administrator can
open or close intake from Seller applications. Intake starts closed. During a
closure applicants can view their existing application and complete pending
verification. New submissions and resubmissions wait until intake reopens.
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

## CS2 seller listing variants — 2026-11-21

The owner requested CS2 category and model selection inspired by LIS-SKINS,
including the Five-SeveN and Desert Eagle pistol models. Sellers select the
wears they offer, set a separate price for each, and can upload multiple photos.
The owner selected separate photos per variant. A buyer can switch between
the published wears for a seller's skin and compare their prices.

Each wear uses the existing listing-level checkout and inventory. The form
supports optional photo uploads, with up to four photos per variant in the
implementation. [CS2 listing variants design](docs/superpowers/specs/2026-11-21-cs2-listing-variants.md)

## Clothing product entry — 2026-11-21

The owner requested multiple sizes, multiple photos and additional product
details when a seller adds clothing. The owner suggested Uzum Market, Polo and
other clothing sites as references. At the time of the request, the seller form
had one free-text variant field and one stock count for clothing. Photo upload
was available on CS2 listings.

The seller creates one product with a category, title and description. They
choose sizes for each color, upload a gallery per color and set stock for each
offered color and size combination. The shared price applies unless the seller
sets an override. The form offers an optional size chart in centimeters and
fields for brand, fabric composition, fit and care instructions. The public
product page shows the selected color's photos, the size chart and availability
for the selected combination. Reservations use that combination's listing and
stock. Legacy clothing listings still use their existing purchase path.

The owner confirmed a single product card with color, fabric composition, fit
and care details. They approved a separate gallery per color, stock per color
and size, an overridable default price and an optional measurement guide in
centimeters. [Clothing listing design](docs/superpowers/specs/2026-11-21-clothing-listing-variants.md)
[Uzum seller guide](https://seller.uzum.uz/manual/uz/5.product-creation/)
[Polo Ralph Lauren product page](https://www.ralphlauren.com/men-clothing-polo-shirts/custom-slim-fit-mesh-polo-shirt/582999.html)
[Shopify variant inventory](https://help.shopify.com/en/manual/products/variants/)

## Backup sign-in methods — 2026-11-21

The owner wants to sign in from another device while their primary authenticator
is unavailable. They selected a second authenticator, one-time backup codes and
SMS verification alongside the existing sign-in method. The design describes
the effect on privileged operations and the provider settings that need to be
verified. [Backup sign-in design](docs/superpowers/specs/2026-11-21-sign-in-backup-options.md)

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
- Seller workspaces, further admin modules and commerce domain contracts remain proposed. The initial read-only admin workspace is separately approved in the accounts slice above. The development catalog uses `/{locale}/marketplace`, separate `/cs2` and `/fashion` paths and localized sample details. This describes the original migration phase. The owner retired the preserved homepage on 2026-11-21.
- Preliminary phases 0–10 from the owner brief, with proposed measurable gates in the audit. The owner may change their order and content.

Potential item/category fields, seller metrics, payouts, reviews, promotions, storefront modules and advanced integrations listed in the brief express future capability options. Their exact data models, sources and first-release inclusion remain unapproved.

## Historical decision status before the single-vendor update

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
| D10 | Seller Center/Admin modules and action permissions at launch | Limits privileged scope and defines role matrix | Owner dashboard, user access, listing and direct-order management, seller review and targeted profile verification requested. Contact verification channel chosen per request. Profile verification operating rules remain open |
| D11 | Brand name, visual references and shared versus distinct identity | Gates design generation and navigation decisions | Confirmed VERSAX with an owner-supplied logo |
| D12 | Expected sellers, listings, daily users, order volume and launch timeline/budget constraints | Grounds query, operational and performance design | Large-scale ambition reconfirmed; numeric targets, timeline and budget remain follow-up |
| D13 | Steam/item/price/image data sources, permitted commercial use and verification confidence | Prevents unsupported capabilities and misleading market/ownership claims | Research + owner gate |
| D14 | Mixed-ecosystem/multi-seller baskets, split payments/orders and customer-facing totals | Determines checkout boundaries and refund/fulfillment grouping | Separate order for each seller and ecosystem; checkout and payment implementation remain open |
| D15 | Identity backend, signup methods, account/admin first slice and infrastructure isolation | Defines real authentication, private data and initial privileged scope | Detailed design approved; dedicated project xevzbtivteugbqbmmtyz confirmed, public credentials configured and migration applied per owner; authenticated/email/admin end-to-end verification pending; other live application's project remains untouched |

## Earlier marketplace decisions and technical constraints

No custodial/bot-based CS2 model, wallet or escrow is selected. Click Business is the selected integration target, but no contract or supported marketplace payout mechanism has been verified. No platform commission is charged for now, and platform-received CS2 funds are intended for payout after both parties confirm delivery; payout execution remains open. All sellers require administrator approval, while eligibility and verification remain open. Integrations depend on documented access and permitted use. Steam policy research does not establish authorization for a particular commercial model. No unavailable ownership/float/pattern/market-price API is assumed.

Before real trading or money movement: owner approves the commercial model; provider/platform/jurisdiction feasibility is checked; server authorization, transactions, idempotency, verified events, reversal/dispute handling and reconciliation are tested.

## Decision recording protocol

For each owner answer, record date, decision ID, the answer, scope and remaining conditions. Recommendations stay labelled proposed until explicit confirmation. Update the audit/roadmap after decisions; do not erase prior requirements or delivery history. Later groups should be asked in manageable batches, not as an unstructured questionnaire.

## Owner answers

| Date | Decision IDs | Owner statement and scope | Remaining conditions |
| --- | --- | --- | --- |
| 2026-11-22 | D01, D03–D10, D14 | Launch VERSAX as a single-vendor business selling its own CS2 skins and clothing. Scope the Owner, Admin, Manager/Staff and Customer roles as above. Exclude public seller onboarding, independent storefronts, commissions and third-party payouts from launch. | Confirm existing inventory ownership and open-order disposition, staff permissions, merchant payments/refunds, and separate CS2 and clothing operating procedures. |
| 2026-11-21 | D15 | Preserve authenticator sign-in and add a backup authenticator, one-time backup codes and SMS verification. | Review the sign-in design, verify native recovery-code settings and select an SMS delivery provider. |
| 2026-11-21 | D04, D10, D15 | Owner dashboard for users and roles, listing and sales management, identity and contact verification, and account suspensions. The owner contacts the user directly for identity checks and records the outcome with the one-time code from their profile. The owner chooses email or SMS for contact verification. Buying and selling remain available during checks. | Email and SMS services are unconfigured. Select and verify code delivery services before enabling contact verification. |
| 2026-11-21 | D01, D03, D07, D10 | Start with direct seller payments in both CS2 and clothing. Administrators review payment evidence and decide disputes case by case. Retire the original storefront homepage and use seller listings in the marketplace navigation. | Before switching on reservations, verify the dedicated schema, seller flows, expiration job and the people and procedures responsible for payment review, refunds and fulfillment. Click settlement remains pending. |
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
