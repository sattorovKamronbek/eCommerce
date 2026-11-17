import Link from "next/link";
import type { PublicListing } from "@/lib/supabase/database";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";

export function PublicListingCard({ listing, locale }: { listing: PublicListing; locale: MarketplaceLocale }) {
  const copy = listingDictionaries[locale];
  return <article className="real-listing-card"><h2><Link href={`/${locale}/listings/${listing.ecosystem}/${listing.id}`}>{listing.title}</Link></h2>
    {listing.category ? <p>{listing.category}</p> : null}{listing.variant ? <p>{listing.variant}</p> : null}
    <p>{new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(listing.price_tiyin / 100)} UZS</p>
    <p>{listing.available ? copy.available : copy.outOfStock}</p><Link className="mp-text-link" href={`/${locale}/listings/${listing.ecosystem}/${listing.id}`}>{copy.view}</Link>
  </article>;
}
