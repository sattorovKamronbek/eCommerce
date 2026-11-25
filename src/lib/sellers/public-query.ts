import { parseAdminPage } from "@/lib/auth/validation";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { isCs2Category, isCs2Model, isCs2Wear, type Cs2Category, type Cs2Wear } from "./cs2";
import { parseUzsTiyin } from "./listing";

export type ListingEcosystem = "cs2" | "fashion";
export type Cs2ListingFilters = { category?: Cs2Category; model?: string; wear?: Cs2Wear };
type ListingPriceFilter = { min: string; max: string } & (
  { error: "format" | "range" } | { error?: never; minTiyin: number | null; maxTiyin: number | null }
);
export type PublicListingQuery = {
  q: string;
  page: number;
  sort: "recent" | "price-asc" | "price-desc";
  cs2?: Cs2ListingFilters;
  price?: ListingPriceFilter;
  inStock?: true;
};

export const listingPriceInputLength = 16;

function parsePriceBound(value: string) {
  const amount = value.replace(",", ".");
  return /^0(?:\.0{1,2})?$/.test(amount) ? 0 : parseUzsTiyin(amount);
}

function parseListingPrice(minPrice: string | string[] | undefined, maxPrice: string | string[] | undefined): ListingPriceFilter | undefined {
  const min = typeof minPrice === "string" ? minPrice.trim() : "";
  const max = typeof maxPrice === "string" ? maxPrice.trim() : "";
  const inputs = { min: min.slice(0, listingPriceInputLength), max: max.slice(0, listingPriceInputLength) };
  if (Array.isArray(minPrice) || Array.isArray(maxPrice)) return { ...inputs, error: "format" };
  if (!min && !max) return undefined;

  const minTiyin = parsePriceBound(min);
  const maxTiyin = parsePriceBound(max);
  if ((min && minTiyin === null) || (max && maxTiyin === null)) return { ...inputs, error: "format" };
  if (minTiyin !== null && maxTiyin !== null && minTiyin > maxTiyin) return { ...inputs, error: "range" };
  return { ...inputs, minTiyin, maxTiyin };
}

export function parsePublicListingQuery(
  input: Record<string, string | string[] | undefined>,
  ecosystem?: ListingEcosystem,
): PublicListingQuery {
  const q = typeof input.q === "string" && !/[\u0000-\u001f\u007f]/.test(input.q) ? input.q.trim().slice(0, 80) : "";
  const sort = input.sort === "price-asc" || input.sort === "price-desc" ? input.sort : "recent";
  const filters: PublicListingQuery = { q, page: parseAdminPage(input.page), sort };
  const price = parseListingPrice(input.minPrice, input.maxPrice);
  if (price) filters.price = price;
  if (input.stock === "in-stock") filters.inStock = true;
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
  if (filters.price?.min) query.set("minPrice", filters.price.min);
  if (filters.price?.max) query.set("maxPrice", filters.price.max);
  if (filters.inStock) query.set("stock", "in-stock");
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
