import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatTiyin } from "@/lib/orders/model";
import { cs2PhotoHref, isCs2Wear } from "@/lib/sellers/cs2";
import { fashionPhotoHref } from "@/lib/sellers/fashion";
import type { PublicListingCardData } from "@/lib/sellers/public-catalog";
import { formatCs2Wear } from "@/messages/cs2-catalog";
import { fashionCatalogDictionaries } from "@/messages/fashion-catalog";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";

export function PublicListingCard({ listing, locale, heading: Heading, detailQuery = "" }: {
  listing: PublicListingCardData;
  locale: MarketplaceLocale;
  heading: "h2" | "h3" | "h4";
  detailQuery?: string;
}) {
  const copy = listingDictionaries[locale];
  const href = `/${locale}/listings/${listing.ecosystem}/${listing.id}${detailQuery}`;
  const cs2 = listing.ecosystem === "cs2";
  const groupedFashion = !cs2 && !!listing.fashion_product_id;
  const cs2Cover = cs2 ? listing.cs2_images?.[0] : undefined;
  const fashionCover = groupedFashion ? listing.fashion_images?.[0] : undefined;
  const cover = cs2Cover ? cs2PhotoHref(listing.id, cs2Cover)
    : fashionCover && listing.fashion_color_id ? fashionPhotoHref(listing.fashion_color_id, fashionCover) : undefined;
  const variant = cs2 && isCs2Wear(listing.cs2_wear) ? formatCs2Wear(locale, listing.cs2_wear) : listing.variant;
  const details = [cs2 ? listing.cs2_model ?? listing.category : listing.category,
    groupedFashion ? listing.fashion_brand : variant].filter(Boolean).join(" · ");
  const price = formatTiyin(listing.price_tiyin, locale);
  return <article className="real-listing-card">
    <Link href={href} prefetch={false} className="real-listing-link" data-cover={cover ? "true" : undefined}>
      {cover && <div className="real-listing-cover">
        <Image src={cover} alt="" fill unoptimized loading="lazy" />
      </div>}
      <Heading>{listing.title}</Heading>
      <ArrowUpRight aria-hidden="true" />
    </Link>
    {details && <p>{details}</p>}
    <p className="mp-price">{groupedFashion ? fashionCatalogDictionaries[locale].fromPrice(price) : price}</p>
    <p className="mp-availability" data-available={listing.available}>{listing.available ? copy.available : copy.outOfStock}</p>
  </article>;
}
