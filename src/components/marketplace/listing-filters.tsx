import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listingPriceInputLength, publicListingQueryString, type PublicListingQuery } from "@/lib/sellers/public-query";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";
import { Cs2ListingFilterFields } from "./cs2-listing-filters";

export function ListingFilters({ action, filters, locale, cs2 = false }: {
  action: string;
  filters: PublicListingQuery;
  locale: MarketplaceLocale;
  cs2?: boolean;
}) {
  const copy = listingDictionaries[locale];
  const activeFilters = publicListingQueryString({ ...filters, page: 1 });
  const priceError = filters.price?.error;
  const priceFeedback = priceError ? "listing-price-error" : undefined;
  return <Form key={`${activeFilters}:${priceError ?? ""}`} action={action} className="real-filters public-listing-filters" role="search" autoComplete="off">
    <label>{copy.search}<input name="q" type="search" maxLength={80} defaultValue={filters.q} /></label>
    <label>{copy.sort}<select name="sort" defaultValue={filters.sort}>
      <option value="recent">{copy.recent}</option>
      <option value="price-asc">{copy.priceAsc}</option>
      <option value="price-desc">{copy.priceDesc}</option>
    </select></label>
    <label>{copy.stock}<select name="stock" defaultValue={filters.inStock ? "in-stock" : ""}>
      <option value="">{copy.allStock}</option>
      <option value="in-stock">{copy.inStock}</option>
    </select></label>
    {cs2 && <Cs2ListingFilterFields filters={filters.cs2} locale={locale} />}
    <label>{copy.minPrice}<input name="minPrice" inputMode="decimal" maxLength={listingPriceInputLength} defaultValue={filters.price?.min}
      aria-invalid={priceError ? true : undefined} aria-describedby={priceFeedback} /></label>
    <label>{copy.maxPrice}<input name="maxPrice" inputMode="decimal" maxLength={listingPriceInputLength} defaultValue={filters.price?.max}
      aria-invalid={priceError ? true : undefined} aria-describedby={priceFeedback} /></label>
    <Button type="submit"><Search aria-hidden="true" />{copy.searchButton}</Button>
    {priceError && <p className="public-listing-filter-error" id={priceFeedback} role="alert">{copy.priceErrors[priceError]}</p>}
    {(activeFilters || priceError) && <Link className="mp-text-link real-clear" href={action}>{marketplaceDictionaries[locale].reset}</Link>}
  </Form>;
}
