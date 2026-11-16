import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile } from "@/lib/supabase/database";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";
import { parseAdminPage } from "./validation";

export type AdminFilters = { q: string; language: MarketplaceLocale | ""; page: number };
export type AdminProfiles = { rows: Profile[]; hasNext: boolean; error: boolean };
export function literalNamePattern(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function parseAdminFilters(query: Record<string, string | string[] | undefined>): AdminFilters {
  const q = typeof query.q === "string" && !/[\u0000-\u001f\u007f]/.test(query.q) ? query.q.trim().slice(0, 80) : "";
  const language = typeof query.language === "string" && isMarketplaceLocale(query.language) ? query.language : "";
  return { q, language, page: parseAdminPage(query.page) };
}

export function adminUsersHref(locale: MarketplaceLocale, filters: AdminFilters, page = filters.page): string {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.language) query.set("language", filters.language);
  if (page > 1) query.set("page", String(page));
  return `/${locale}/admin/users${query.size ? `?${query}` : ""}`;
}

export async function loadAdminProfiles(client: SupabaseClient<Database>, filters: AdminFilters): Promise<AdminProfiles> {
  const size = 20;
  const start = (filters.page - 1) * size;
  try {
    let query = client.from("marketplace_profiles").select("id, display_name, preferred_locale, created_at, updated_at");
    // PostgREST treats '*' as a LIKE wildcard alias. Escaped imatch keeps every
    // character literal while retaining case-insensitive substring matching.
    if (filters.q) query = query.regexIMatch("display_name", literalNamePattern(filters.q));
    if (filters.language) query = query.eq("preferred_locale", filters.language);
    const result = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(start, start + size);
    if (result.error) return { rows: [], hasNext: false, error: true };
    const rows = result.data ?? [];
    return { rows: rows.slice(0, size), hasNext: rows.length > size && filters.page < 10000, error: false };
  } catch { return { rows: [], hasNext: false, error: true }; }
}
