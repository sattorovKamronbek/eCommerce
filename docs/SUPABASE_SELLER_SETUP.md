# Owner and seller setup in Supabase

As of 2026-11-21, the production migration history includes all seven repository
versions. Use this guide for remaining setup and for recovery after checking the
actual migration history. [Production verification](../PROJECT_PROGRESS.md#production-supabase-migrations--2026-11-21)

The site uses project **xevzbtivteugbqbmmtyz**. Do not run these instructions in the owner's other application. No role or schema is changed automatically by the app.

1. In the Supabase dashboard, verify the project reference in the URL is exactly `xevzbtivteugbqbmmtyz`. Open its SQL Editor.
2. Run the read-only [owner diagnostics](../supabase/setup/owner_diagnostics.sql). It returns booleans rather than account IDs or secrets. Confirm `owner_account_exists`, `owner_email_confirmed` and `owner_role_in_marketplace_table` are true. If they are not, stop and inspect the exact authenticated user's role; never grant an owner role using email matching alone. Do not share passwords, authenticator keys or one-time codes.
3. The setup bundle is intended for the case where seller tables are **all absent** and the intended verified owner role is already assigned. Review and run the entire [atomic setup SQL](../supabase/setup/owner_seller_setup.sql) once. It stops when it detects a partial or existing seller installation and rolls back the whole transaction on any error. Stop on an error rather than deleting objects or running the bundle repeatedly.
4. Rerun the read-only diagnostics. All six installation booleans should be true. These checks establish object presence, not a complete security audit of existing policies. `owner_has_verified_mfa` may be false until the owner enrolls the site's authenticator under `/uz/account/security` and verifies its code. Afterwards sign out, sign in, verify MFA for the session and open `/uz/admin/sellers`. The owner role itself is not modified by the setup bundle.
5. If the database diagnostics show the objects but the app or Data API still reports a missing relation, the API schema cache may be stale. In the same verified project, Supabase documents `NOTIFY pgrst, 'reload schema';` in the SQL Editor; see [Supabase cache refresh](https://supabase.com/kb/troubleshooting/refresh-postgrest-schema). Recheck the API afterwards.
6. The SQL Editor is not the Supabase CLI migration runner. A manually executed bundle does **not** create migration-history entries; do not subsequently apply the same migrations again. Reconcile migration history using the official Supabase workflow after inspecting the actual project state; never mark anything applied without verifying every object.

The bundle is generated from four repository migrations by `node scripts/build-owner-seller-setup.mjs`. Database setup creates seller onboarding and listings only; orders, checkout and Click settlement are not enabled. Applying this SQL to the wrong Supabase project can modify that project, so verify the dashboard project reference every time.

## Direct payments and account administration

1. Verify the account and seller objects above. Apply the next platform migrations in version order using the same reviewed migration workflow. [Direct orders](../supabase/migrations/202611210005_direct_orders.sql), [account administration](../supabase/migrations/202611210006_admin_accounts.sql).
2. Verify signup and sign-in with dedicated test accounts. Verify the owner and administrator sign in with a configured authenticator. In `/uz/admin/users`, an administrator can suspend or restore customer access. The owner can grant or revoke the administrator role after fresh TOTP verification. Confirm the exact candidate UUID and account control independently. The candidate must already have a verified MFA factor. The owner role is managed through [owner bootstrap](OWNER_BOOTSTRAP.md).
3. Enable Supabase Cron in this project. Run the expiration job as the database administrator. A one-minute schedule closes orders with no payment report after their 48-hour deadline and releases their reserved stock. It leaves reported orders available for review. Check the job's execution history in the dashboard. [Supabase Cron setup](https://supabase.com/docs/guides/cron/install).

   ```sql
   select cron.schedule(
     'marketplace-expire-direct-orders',
     '* * * * *',
     'select marketplace_private.expire_direct_orders();'
   );
   ```

4. In a test environment, have an approved seller set per-listing payment contact, clothing shipping price or CS2 asset ID. Test stock conservation, valid account isolation, expiry, the payment evidence review, two separate delivery confirmations and dispute decisions. Plan applicant verification, buyer support, shipping regions, return and refund execution outside VERSAX, dispute evidence handling and retention before opening real sales. The code only checks the seller-supplied CS2 ID for reuse. It does not verify Steam ownership or transfer eligibility.
5. New reservations default to disabled. Once setup and launch verification are complete, enable them in the dedicated project below. Turning the setting back off stops new reservations and leaves existing orders and the expiration job operational.

   ```sql
   update marketplace_private.direct_order_settings
   set accepting_orders = true where singleton;
   ```

An order contains one listing and belongs to one seller and ecosystem. Buyers reserve before sending money and can see the server-calculated total on the order. The buyer or seller reports a timestamp, amount and transaction reference. An administrator records their review and any case-by-case decision. The parties move funds and fulfill orders outside VERSAX. The site records no processor-confirmed settlement or automated refund. Clothing delivery details are visible to the buyer, relevant seller and authorized admins. Review how long to retain these details and order records before release.

Payment times are entered and shown in Uzbekistan time. A reservation with no report closes automatically. A late payment report opens a case for administrator review while the stock stays released. The dashboard records review decisions and stock disposition. Review evidence privately, and keep account secrets and personal documents out of shared notes. Communicate how the seller and administrator handle funds when a payment is reported after the reservation expires.
