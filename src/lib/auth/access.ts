import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { safeReturnPath } from "./validation";

export async function requireAccount(locale: MarketplaceLocale, destination = `/${locale}/account`) {
  const client = await createServerSupabaseClient();
  if (!client) return null;
  let result;
  try { result = await client.auth.getUser(); } catch { return null; }
  if (result.error && result.error.name !== "AuthSessionMissingError" && result.error.status !== 401 && result.error.status !== 403) return null;
  const user = result.data.user;
  if (!user?.email_confirmed_at) redirect(`/${locale}/account/login?next=${encodeURIComponent(safeReturnPath(destination, locale))}`);
  return { client, user };
}

export async function requireAdmin(locale: MarketplaceLocale, destination = `/${locale}/admin`) {
  const account = await requireAccount(locale, destination);
  if (!account) return { kind: "unavailable" } as const;
  try {
    const result = await account.client.from("marketplace_user_roles").select("role").eq("user_id", account.user.id).maybeSingle();
    if (result.error) return { kind: "unavailable" } as const;
    if (!result.data || (result.data.role !== "admin" && result.data.role !== "owner")) return { kind: "denied" } as const;
    return { kind: "admin", ...account } as const;
  } catch { return { kind: "unavailable" } as const; }
}
