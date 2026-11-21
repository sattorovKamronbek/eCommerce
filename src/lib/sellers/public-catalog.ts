import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PublicListing } from "@/lib/supabase/database";
import { literalNamePattern } from "@/lib/auth/admin-users";
import { CS2_WEAR, isCs2Wear } from "./cs2";
import type { ListingEcosystem, PublicListingQuery } from "./public-query";

export type PublicListingResults = { rows: PublicListing[]; hasNext: boolean; error: boolean };

export async function loadPublicListings(
  client: SupabaseClient<Database>, ecosystem: ListingEcosystem, filters: PublicListingQuery, size = 20,
): Promise<PublicListingResults> {
  const start = (filters.page - 1) * size;
  try {
    // A retry with provider backoff keeps the visitor waiting on the same view.
    let query = client.from("marketplace_public_listings").select("*").eq("ecosystem", ecosystem).retry(false);
    if (filters.q) query = query.regexIMatch("title", literalNamePattern(filters.q));
    if (ecosystem === "cs2" && filters.cs2) {
      const { category, model, wear } = filters.cs2;
      if (category) query = query.eq("cs2_category", category);
      if (model) query = query.eq("cs2_model", model);
      if (wear) query = query.eq("cs2_wear", wear);
    }
    if (filters.sort === "price-asc") query = query.order("price_tiyin", { ascending: true });
    if (filters.sort === "price-desc") query = query.order("price_tiyin", { ascending: false });
    const result = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(start, start + size);
    if (result.error) return { rows: [], hasNext: false, error: true };
    const rows = result.data ?? [];
    return { rows: rows.slice(0, size), hasNext: rows.length > size && filters.page < 10000, error: false };
  } catch { return { rows: [], hasNext: false, error: true }; }
}

type PublicCs2Variant = Pick<PublicListing, "id" | "price_tiyin" | "cs2_wear">;

export async function loadPublicCs2Variants(
  client: SupabaseClient<Database>,
  listing: Pick<PublicListing, "id" | "title" | "cs2_group_key" | "cs2_model" | "cs2_wear">,
): Promise<PublicCs2Variant[]> {
  if (!listing.cs2_group_key || !listing.cs2_model || !isCs2Wear(listing.cs2_wear) || listing.cs2_wear === "NP") return [];
  try {
    const result = await client.from("marketplace_public_listings")
      .select("id, price_tiyin, cs2_wear")
      .eq("ecosystem", "cs2")
      .eq("cs2_group_key", listing.cs2_group_key)
      .eq("cs2_model", listing.cs2_model)
      .eq("title", listing.title)
      .neq("id", listing.id)
      .neq("cs2_wear", "NP")
      .limit(CS2_WEAR.length - 2)
      .retry(false);
    return result.data ?? [];
  } catch {
    return [];
  }
}
