import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PublicListing } from "@/lib/supabase/database";
import { literalNamePattern } from "@/lib/auth/admin-users";
import type { ListingEcosystem, PublicListingQuery } from "./public-query";

export async function loadPublicListings(client: SupabaseClient<Database>, ecosystem: ListingEcosystem, filters: PublicListingQuery): Promise<{ rows: PublicListing[]; hasNext: boolean; error: boolean }> {
  const size = 20;
  const start = (filters.page - 1) * size;
  try {
    let query = client.from("marketplace_public_listings").select("*").eq("ecosystem", ecosystem);
    if (filters.q) query = query.regexIMatch("title", literalNamePattern(filters.q));
    if (filters.sort === "price-asc") query = query.order("price_tiyin", { ascending: true });
    if (filters.sort === "price-desc") query = query.order("price_tiyin", { ascending: false });
    const result = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(start, start + size);
    if (result.error) return { rows: [], hasNext: false, error: true };
    const rows = result.data ?? [];
    return { rows: rows.slice(0, size), hasNext: rows.length > size && filters.page < 10000, error: false };
  } catch { return { rows: [], hasNext: false, error: true }; }
}
