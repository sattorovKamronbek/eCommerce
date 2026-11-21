# Direct seller orders implementation plan

**Goal**

Remove the retired home and make seller listings the marketplace entry. Add a manual direct-payment order flow for CS2 and clothing.

**Owner decisions**

The buyer pays the seller directly in both categories. Admin reviews reports and decides disputes case by case. Cancel reservations after 48 hours without a report. Record payment time, amount and transaction reference. Clothing uses a seller-set shipping price and private buyer delivery details. Keep seller and buyer delivery confirmations separate. See [product requirements](../../../PRODUCT_REQUIREMENTS.md).

**Implementation**

- [x] Make the homepage and navigation use real listings. Check the retired route returns 404, both catalogs are reachable, and retained historical samples remain labeled.
- [x] Add a migration for versioned checkout terms, order and audit records, RLS, transactional stock, a controlled reservation switch, and an expiration function. Test role boundaries, stale quotes, retries, stock conservation, independent confirmations, and admin dispute decisions.
- [x] Wire localized buyer checkout, buyer and seller order views, seller terms and admin review using the existing Supabase session. Take one listing per order and recheck its displayed price, shipping and description in PostgreSQL. Store a seller-provided contact for coordinating payment outside ORO.
- [x] Add audited account suspension and restoration for administrator sessions. Limit administrator role assignment and revocation to the owner using a fresh provider-verified TOTP session.
- [x] Document setup in the dedicated project and the scheduler. Run TypeScript, lint, database/unit tests, build and browser workflows.

**Release conditions**

Keep new reservations off until seller migrations, authenticated sessions, the expiration job and operating procedures are verified. The admin records case-by-case decisions and stock disposition. Any transfer or refund happens outside the site. Review seller-supplied CS2 identifiers for launch. This release stores a seller-supplied asset reference and prevents reuse of that reference. It cannot verify Steam ownership or automatically identify the same item under a different reference.
