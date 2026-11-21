import { parseAdminPage } from "@/lib/auth/validation";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { isCs2Category, isCs2Model, isCs2Wear, type Cs2Category, type Cs2Wear } from "./cs2";

export type ListingEcosystem = "cs2" | "fashion";
export type Cs2ListingFilters = { category?: Cs2Category; model?: string; wear?: Cs2Wear };
export type PublicListingQuery = {
  q: string;
  page: number;
  sort: "recent" | "price-asc" | "price-desc";
  cs2?: Cs2ListingFilters;
};

export function parsePublicListingQuery(
  input: Record<string, string | string[] | undefined>,
  ecosystem?: ListingEcosystem,
): PublicListingQuery {
  const q = typeof input.q === "string" && !/[\u0000-\u001f\u007f]/.test(input.q) ? input.q.trim().slice(0, 80) : "";
  const sort = input.sort === "price-asc" || input.sort === "price-desc" ? input.sort : "recent";
  const filters: PublicListingQuery = { q, page: parseAdminPage(input.page), sort };
  if (ecosystem === "cs2") {
    const cs2: Cs2ListingFilters = {};
    if (isCs2Category(input.category)) {
      cs2.category = input.category;
      if (isCs2Model(input.category, input.model)) cs2.model = input.model;
    }
    if (isCs2Wear(input.wear)) cs2.wear = input.wear;
    if (cs2.category || cs2.wear) filters.cs2 = cs2;
  }
  return filters;
}

export function publicListingQueryString(filters: PublicListingQuery, fromSearch = false): string {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.sort !== "recent") query.set("sort", filters.sort);
  if (filters.page > 1) query.set("page", String(filters.page));
  if (fromSearch) query.set("from", "search");
  else {
    if (filters.cs2?.category) query.set("category", filters.cs2.category);
    if (filters.cs2?.model) query.set("model", filters.cs2.model);
    if (filters.cs2?.wear) query.set("wear", filters.cs2.wear);
  }
  return query.size ? `?${query}` : "";
}

export function publicListingHref(locale: MarketplaceLocale, ecosystem: ListingEcosystem, filters: PublicListingQuery): string {
  return `/${locale}/listings/${ecosystem}${publicListingQueryString(ecosystem === "cs2" ? filters : { ...filters, cs2: undefined })}`;
}
