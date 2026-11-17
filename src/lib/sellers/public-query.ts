import { parseAdminPage } from "@/lib/auth/validation";
import type { MarketplaceLocale } from "@/messages/marketplace";

export type ListingEcosystem = "cs2" | "fashion";
export type PublicListingQuery = { q: string; page: number; sort: "recent" | "price-asc" | "price-desc" };

export function parsePublicListingQuery(input: Record<string, string | string[] | undefined>): PublicListingQuery {
  const q = typeof input.q === "string" && !/[\u0000-\u001f\u007f]/.test(input.q) ? input.q.trim().slice(0, 80) : "";
  const sort = input.sort === "price-asc" || input.sort === "price-desc" ? input.sort : "recent";
  return { q, page: parseAdminPage(input.page), sort };
}

export function publicListingHref(locale: MarketplaceLocale, ecosystem: ListingEcosystem, filters: PublicListingQuery): string {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.sort !== "recent") query.set("sort", filters.sort);
  if (filters.page > 1) query.set("page", String(filters.page));
  return `/${locale}/listings/${ecosystem}${query.size ? `?${query}` : ""}`;
}
