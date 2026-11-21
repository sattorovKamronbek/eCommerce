import type { PublicListingResults } from "@/lib/sellers/public-catalog";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";
import { PublicListingCard } from "./public-listing-card";

export function ListingResultsLoading({ locale }: { locale: MarketplaceLocale }) {
  return <p className="mp-feed-status" role="status">{marketplaceDictionaries[locale].loading}</p>;
}

export function ListingResults({ result, locale, heading, detailQuery }: {
  result: PublicListingResults;
  locale: MarketplaceLocale;
  heading: "h2" | "h3" | "h4";
  detailQuery?: string;
}) {
  const copy = listingDictionaries[locale];
  if (result.error) return <p className="mp-feed-status" role="alert">{copy.catalogUnavailable}</p>;
  if (!result.rows.length) return <p className="mp-feed-status">{copy.noPublic}</p>;
  return <div className="real-listings">
    {result.rows.map((listing) => <PublicListingCard key={listing.id} listing={listing} locale={locale} heading={heading} detailQuery={detailQuery} />)}
  </div>;
}
