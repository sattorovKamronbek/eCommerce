# Owner and seller application foundation

These migrations and pages are local code, not evidence that the dedicated
Supabase project has been modified. They use only project `xevzbtivteugbqbmmtyz`;
do not apply them to the owner's other live application. Before applying, inspect
the existing schema and migration history: the original accounts migration was
reportedly applied using SQL Editor and might not be in CLI migration history.
Apply the new versioned migrations in order without resetting the database.

`202611160001_seller_applications.sql` enables application intake and admin
reviews. Its approval records an administrative decision only; it does **not**
grant seller permissions or make goods purchasable. Admins must contact the
seller and check identity and account control securely outside this form. The
specific evidence/retention and reliable binding to an authenticated account
still need to be established. The form must not be used to collect ID documents.
Reopening an approval must revoke seller access atomically if seller permissions
are added in a later migration; this intake-only version has no such access.
Audit records include the reviewed scope and scope changes, but do not retain
historical personal details or prove that identity was independently verified.

`202611160002_owner_role.sql` adds a distinct owner role and lets that role use
existing admin reads; it assigns no role. Do not promote based on an email string
or `email_confirmed_at`: provider auto-confirmation is not proof of mailbox
control. Before any owner grant, independently verify the intended account UUID,
the authenticated session, mailbox/recovery control and a working second factor.
The application does not yet provide the owner MFA/role-management workflow or a
verified bootstrap procedure. Consequently, this code alone does not safely make
the designated Gmail account the owner; no automated owner grant is provided.

Before public use, verify actual Auth, recovery, RLS isolation and admin review
against the dedicated project using designated test accounts. The local PGlite
tests exercise PostgreSQL policies but cannot prove actual Supabase settings,
mail delivery, identity review, deployment, or live account protection.
