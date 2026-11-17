import "server-only";
import { requireAccount } from "@/lib/auth/access";
import type { MarketplaceLocale } from "@/messages/marketplace";

export async function requireSeller(locale: MarketplaceLocale) {
  const account = await requireAccount(locale, `/${locale}/seller/products`);
  if (!account) return { kind: "unavailable" } as const;
  try {
    const [application, grant, assurance] = await Promise.all([
      account.client.from("marketplace_seller_applications").select("status, revision, requested_scope").eq("applicant_id", account.user.id).maybeSingle(),
      account.client.from("marketplace_seller_grants").select("application_revision").eq("seller_id", account.user.id).maybeSingle(),
      account.client.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (application.error || grant.error || assurance.error) return { kind: "unavailable" } as const;
    if (!application.data || application.data.status !== "approved" || !grant.data || application.data.revision !== grant.data.application_revision) return { kind: "denied" } as const;
    if (assurance.data.currentLevel !== "aal2") return { kind: "mfa" } as const;
    return { kind: "seller", account, scope: application.data.requested_scope } as const;
  } catch { return { kind: "unavailable" } as const; }
}
