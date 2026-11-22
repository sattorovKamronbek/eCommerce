# Admin activity implementation plan

**Goal** Give verified administrators account and purchasing details, a sign-in history, and a live overview of work queues.

**Architecture** Keep reporting in the existing private Next.js admin workspace. Add an authenticated Postgres summary for accounts and operations, and an RLS-protected sign-in history recorded from Supabase's password authentication claim when the required factors have passed.

**Scope** Use the existing admin role checks, order state machine, seller application workflow, and reservation settings. Use the dedicated VERSAX project for any rollout. See [requirements](../../../PRODUCT_REQUIREMENTS.md).

- [x] Verify SQL authorization, session capture and MFA completion, deterministic history ordering, per-buyer completed order quantities, and actual queue counts in PGlite.
- [x] Add the private account overview, sign-in event table and dashboard summary in `202611220013_admin_activity.sql`. Record password sign-ins from migration time and show the provider's previous last sign-in value in the account overview.
- [x] Show verified account details, paginated sign-in history and purchase and sales links on the admin profile. Filter the existing paginated orders view by validated buyer or seller UUID. Keep failed reads visibly unavailable.
- [x] Add current queue counts, completed purchases, and reservation availability to the existing dashboard. Maintain English, Uzbek and Russian copy.
- [x] Run typecheck, lint, Vitest, production build and the affected desktop and mobile Playwright flows. Record results and rollout state in `PROJECT_PROGRESS.md`.
