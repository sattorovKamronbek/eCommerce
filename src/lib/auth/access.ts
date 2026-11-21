import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { safeReturnPath } from "./validation";

export async function requireAccount(locale: MarketplaceLocale, destination = `/${locale}/account`, options: { allowMfaPending?: boolean; allowSuspended?: boolean } = {}) {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  let result;
  try { result = await client.auth.getUser(); } catch { return null; }
  if (result.error && result.error.name !== "AuthSessionMissingError" && result.error.status !== 401 && result.error.status !== 403) return null;
  const user = result.data.user;
  if (!user?.email_confirmed_at) redirect(`/${locale}/account/login?next=${encodeURIComponent(safeReturnPath(destination, locale))}`);
  try {
    const status = await client.rpc("marketplace_account_is_active");
    // The account slice can run on the preceding schema during rollout.
    if (status.error?.code !== "PGRST202") {
      if (status.error) return null;
      if (!status.data) return options.allowSuspended ? { client, user, suspended: true } : null;
    }
  } catch { return null; }
  if (!options.allowMfaPending && user.factors?.some(factor => factor.status === "verified")) {
    let assurance;
    try { assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel(); } catch { return null; }
    if (assurance.error) return null;
    if (assurance.data.currentLevel !== "aal2") redirect(`/${locale}/account/security?next=${encodeURIComponent(safeReturnPath(destination, locale))}`);
  }
  return { client, user, suspended: false };
}

export async function requireAdmin(locale: MarketplaceLocale, destination = `/${locale}/admin`) {
  const account = await requireAccount(locale, destination);
  if (!account) return { kind: "unavailable" } as const;
  let needsStepUp = false;
  try {
    const result = await account.client.from("marketplace_user_roles").select("role").eq("user_id", account.user.id).maybeSingle();
    if (result.error) return { kind: "unavailable" } as const;
    if (!result.data || (result.data.role !== "admin" && result.data.role !== "owner")) return { kind: "denied" } as const;
    const assurance = await account.client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) return { kind: "unavailable" } as const;
    if (assurance.data.currentLevel !== "aal2" || !account.user.factors?.some(factor => factor.status === "verified")) {
      // Redirect outside the catch block, since Next.js redirects by throwing.
      needsStepUp = true;
    } else {
      return { kind: "admin", ...account } as const;
    }
  } catch { return { kind: "unavailable" } as const; }
  if (needsStepUp) redirect(`/${locale}/account/security?next=${encodeURIComponent(safeReturnPath(destination, locale))}`);
  return { kind: "unavailable" } as const;
}
