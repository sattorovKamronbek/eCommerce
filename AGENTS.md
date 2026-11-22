# Engineering agreement
Work in independently verifiable phases. The owner confirmed a single-vendor VERSAX launch on 2026-11-22. Follow PRODUCT_REQUIREMENTS.md and docs/MILESTONES.md. Preserve the existing accounts and authorization architecture, catalog and order records, and use only the dedicated Supabase project xevzbtivteugbqbmmtyz. The owner's other live application's project must remain untouched. The completed frontend migration added the new locale routes and used /storefront-preview to preserve the old home during cutover. Former storefront Phases 0–1 remain completed historical work.
Use strict TypeScript, App Router and Server Components by default. Keep interactive islands small.
Customer copy belongs in src/messages; brand configuration in src/lib/config.ts.
Development data must remain visibly identified. Never describe browser cart totals as authoritative.
Do not implement fake authentication, orders, payment confirmations, ratings, or business metrics.
Future database changes require migrations, RLS, server authorization and transaction-safe inventory.
Keep secrets out of Git. Never expose service-role credentials.
Run typecheck, lint, unit tests, production build and relevant Playwright workflows before handoff.
Update PROJECT_PROGRESS.md with evidence and limitations. Ask before destructive repository/database operations.

Store direction is recorded in PRODUCT_REQUIREMENTS.md. Distinguish confirmed requirements, proposals and unanswered decisions.
The owner controls major business and architecture decisions. Preserve existing runtime functionality during the single-vendor cutover. Obtain unresolved business decisions before implementing dependent backend or live-commerce features. Never grant owner access automatically.
Never assume a CS2 transaction/custody model, payment provider, commission, payout policy or seller policy. Do not implement unsupported Steam capabilities or collect Steam passwords, session cookies or Steam Guard secrets.
