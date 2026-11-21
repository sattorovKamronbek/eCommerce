import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicListingQuery } from "@/lib/sellers/public-query";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";

export function ListingFilters({ action, filters, locale }: {
  action: string;
  filters: PublicListingQuery;
  locale: MarketplaceLocale;
}) {
  const copy = listingDictionaries[locale];
  return <Form key={`${filters.q}:${filters.sort}`} action={action} className="real-filters" role="search" autoComplete="off">
    <label>{copy.search}<input name="q" type="search" maxLength={80} defaultValue={filters.q} /></label>
    <label>{copy.sort}<select name="sort" defaultValue={filters.sort}>
      <option value="recent">{copy.recent}</option>
      <option value="price-asc">{copy.priceAsc}</option>
      <option value="price-desc">{copy.priceDesc}</option>
    </select></label>
    <Button type="submit"><Search aria-hidden="true" />{copy.searchButton}</Button>
    {(filters.q || filters.sort !== "recent") && <Link className="mp-text-link real-clear" href={action}>{marketplaceDictionaries[locale].reset}</Link>}
  </Form>;
}
