# Owner setup repair

**Goal:** Diagnose and resolve the owner's seller-review setup failure without granting roles by email or altering any remote database automatically.

**Architecture:** Preserve existing authenticated server and RLS boundaries; distinguish missing seller schema from transient service failures. Provide a reviewed atomic SQL deployment bundle and read-only setup diagnostic for the dedicated Supabase project. Continue separately with provider-independent commerce only where rules and transaction safety can be established.

**Constraints:** Dedicated project xevzbtivteugbqbmmtyz only; no secrets, destructive operations, fake payment, bypass of MFA or false success. Do not change the owner's existing role. Existing marketplace demo labels remain until real commerce is verified.

1. Reproduce absent-schema errors in authenticated seller-review rendering; add localized actionable setup feedback and preserve generic handling of other failures.
2. Produce an atomic migration bundle and diagnostic covering confirmed identity, exact owner grant, verified MFA, required relations and functions; test the bundle in PGlite including rollback on inconsistent pre-existing objects.
3. Diagnose and develop any separately authorized provider-independent commerce functionality without asserting live Click support.
4. Run unit, typecheck, lint, production build, relevant browser workflows and security review; document precise remote and live-commerce limitations.
