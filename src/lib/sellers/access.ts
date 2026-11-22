import "server-only";
import { isSellerSchemaMissing } from "@/lib/sellers/schema";
import { requireAccount } from "@/lib/auth/access";
import type { MarketplaceLocale } from "@/messages/marketplace";

export async function requireSeller(locale: MarketplaceLocale) {
  const account = await requireAccount(locale, `/${locale}/seller/products`);
  if (!account) return { kind: "unavailable" } as const;
  try {
    const [application, grant, role, assurance] = await Promise.all([
      account.client.from("marketplace_seller_applications").select("status, revision, requested_scope").eq("applicant_id", account.user.id).maybeSingle(),
      account.client.from("marketplace_seller_grants").select("application_revision").eq("seller_id", account.user.id).maybeSingle(),
      account.client.from("marketplace_user_roles").select("role").eq("user_id", account.user.id).maybeSingle(),
      account.client.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (isSellerSchemaMissing(application.error) || isSellerSchemaMissing(grant.error)) return { kind: "setup" } as const;
    if (application.error || grant.error || role.error || assurance.error) return { kind: "unavailable" } as const;
    if (role.data?.role !== "owner" && role.data?.role !== "admin") return { kind: "denied" } as const;
    if (!application.data || application.data.status !== "approved" || !grant.data || application.data.revision !== grant.data.application_revision) return { kind: "denied" } as const;
    if (assurance.data.currentLevel !== "aal2" || !account.user.factors?.some(factor => factor.status === "verified")) {
      return { kind: "mfa" } as const;
    }
    return { kind: "seller", account, scope: application.data.requested_scope } as const;
  } catch { return { kind: "unavailable" } as const; }
}
