import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicListingQueryString, type PublicListingQuery } from "@/lib/sellers/public-query";
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
  const key = publicListingQueryString({ ...filters, page: 1 });
  return <Form key={key} action={action} className={cs2 ? "real-filters real-filters-cs2" : "real-filters"} role="search" autoComplete="off">
    <label>{copy.search}<input name="q" type="search" maxLength={80} defaultValue={filters.q} /></label>
    {cs2 && <Cs2ListingFilterFields filters={filters.cs2} locale={locale} />}
    <label>{copy.sort}<select name="sort" defaultValue={filters.sort}>
      <option value="recent">{copy.recent}</option>
      <option value="price-asc">{copy.priceAsc}</option>
      <option value="price-desc">{copy.priceDesc}</option>
    </select></label>
    <Button type="submit"><Search aria-hidden="true" />{copy.searchButton}</Button>
    {key && <Link className="mp-text-link real-clear" href={action}>{marketplaceDictionaries[locale].reset}</Link>}
  </Form>;
}
