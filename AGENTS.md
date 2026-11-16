# Engineering agreement
Work in independently verifiable phases. Current scope: owner-approved real accounts and initial read-only admin users panel, following the completed marketplace frontend. The detailed accounts/admin design was approved on 2026-11-11; use the dedicated Supabase project xevzbtivteugbqbmmtyz. The owner's other live application's project must remain untouched. Owner selected both frontend migration options: add the new locale routes first, preserve the old home at /storefront-preview, then replace the main entry after verification. Former storefront Phases 0–1 remain completed historical work. The bounded identity slice is approved; broader backend architecture and live commerce are not approved by that scope.
Use strict TypeScript, App Router and Server Components by default. Keep interactive islands small.
Customer copy belongs in src/messages; brand configuration in src/lib/config.ts.
Development data must remain visibly identified. Never describe browser cart totals as authoritative.
Do not implement fake authentication, orders, payment confirmations, ratings, or business metrics.
Future database changes require migrations, RLS, server authorization and transaction-safe inventory.
Keep secrets out of Git. Never expose service-role credentials.
Run typecheck, lint, unit tests, production build and relevant Playwright workflows before handoff.
Update PROJECT_PROGRESS.md with evidence and limitations. Ask before destructive repository/database operations.

Marketplace direction is recorded in PRODUCT_REQUIREMENTS.md; distinguish confirmed requirements, proposals and unanswered decisions.
The owner controls major business and architecture decisions. First discovery answers and frontend migration selection were received on 2026-11-11; see PRODUCT_REQUIREMENTS.md. Preserve existing runtime functionality and use the recorded migration strategy. Obtain unresolved business decisions before implementing dependent backend or live-commerce features.
Never assume a CS2 transaction/custody model, payment provider, commission, payout policy or seller policy. Do not implement unsupported Steam capabilities or collect Steam passwords, session cookies or Steam Guard secrets.
