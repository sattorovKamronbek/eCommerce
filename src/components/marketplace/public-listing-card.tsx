import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatTiyin } from "@/lib/orders/model";
import type { PublicListing } from "@/lib/supabase/database";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";

export function PublicListingCard({ listing, locale, heading: Heading, detailQuery = "" }: {
  listing: PublicListing;
  locale: MarketplaceLocale;
  heading: "h2" | "h3" | "h4";
  detailQuery?: string;
}) {
  const copy = listingDictionaries[locale];
  const href = `/${locale}/listings/${listing.ecosystem}/${listing.id}${detailQuery}`;
  const details = [listing.category, listing.variant].filter(Boolean).join(" · ");
  return <article className="real-listing-card">
    <Link href={href} className="real-listing-link">
      <Heading>{listing.title}</Heading>
      <ArrowUpRight aria-hidden="true" />
    </Link>
    {details && <p>{details}</p>}
    <p className="mp-price">{formatTiyin(listing.price_tiyin, locale)}</p>
    <p className="mp-availability" data-available={listing.available}>{listing.available ? copy.available : copy.outOfStock}</p>
  </article>;
}
