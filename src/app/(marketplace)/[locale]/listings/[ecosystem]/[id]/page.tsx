import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FashionSizeGuide, FashionVariants } from "@/components/marketplace/fashion-variants";
import { ListingGallery } from "@/components/marketplace/listing-gallery";
import { Button } from "@/components/ui/button";
import { formatTiyin } from "@/lib/orders/model";
import { CS2_WEAR, cs2PhotoHref, isCs2Category, isCs2Wear } from "@/lib/sellers/cs2";
import { fashionPhotoHref } from "@/lib/sellers/fashion";
import { loadPublicCs2Variants, loadPublicFashionVariants } from "@/lib/sellers/public-catalog";
import { parsePublicListingQuery, publicListingHref, publicListingQueryString, type ListingEcosystem } from "@/lib/sellers/public-query";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Database, PublicListing as PublicListingRow } from "@/lib/supabase/database";
import { isUuid } from "@/lib/uuid";
import { cs2CatalogDictionaries, formatCs2Wear } from "@/messages/cs2-catalog";
import { cs2Dictionaries } from "@/messages/cs2-listing";
import { editorialDictionaries } from "@/messages/editorial";
import { fashionCatalogDictionaries } from "@/messages/fashion-catalog";
import { isMarketplaceLocale, marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";
import { orderDictionaries } from "@/messages/orders";
import { listingDictionaries } from "@/messages/seller-catalog";

async function CheckoutOffer({ client, locale, ecosystem, id }: {
  client: SupabaseClient<Database>;
  locale: MarketplaceLocale;
  ecosystem: ListingEcosystem;
  id: string;
}) {
  const copy = orderDictionaries[locale];
  const offer = await client.from("marketplace_checkout_offers").select("listing_id").eq("listing_id", id).maybeSingle().retry(false);
  return offer.data
    ? <Button asChild size="lg"><Link href={`/${locale}/account/checkout/${ecosystem}/${id}`}>{copy.checkout}</Link></Button>
    : <p className="mp-muted">{copy.offerUnavailable}</p>;
}

async function Cs2Variants({ client, locale, listing, detailQuery }: {
  client: SupabaseClient<Database>;
  locale: MarketplaceLocale;
  listing: PublicListingRow;
  detailQuery: string;
}) {
  const siblings = await loadPublicCs2Variants(client, listing);
  const variants = [listing, ...siblings].flatMap(({ id, cs2_wear, price_tiyin }) => (
    isCs2Wear(cs2_wear) ? [{ id, wear: cs2_wear, price: price_tiyin }] : []
  )).sort((a, b) => CS2_WEAR.indexOf(a.wear) - CS2_WEAR.indexOf(b.wear));
  if (variants.length < 2) return null;

  const copy = cs2CatalogDictionaries[locale];
  return <nav className="real-listing-variants" aria-labelledby="listing-variants">
    <h3 id="listing-variants">{copy.variants}</h3>
    <ul>
      {variants.map(({ id, wear, price }) => <li key={id}>
        <Link href={`/${locale}/listings/cs2/${id}${detailQuery}`} prefetch={false} aria-current={id === listing.id ? "page" : undefined}>
          <span>{formatCs2Wear(locale, wear)}</span>
          <span>{formatTiyin(price, locale)}</span>
        </Link>
      </li>)}
    </ul>
  </nav>;
}

async function FashionVariantOptions({ client, locale, listing, detailQuery }: {
  client: SupabaseClient<Database>;
  locale: MarketplaceLocale;
  listing: PublicListingRow;
  detailQuery: string;
}) {
  const variants = await loadPublicFashionVariants(client, listing);
  return <FashionVariants variants={variants} selected={listing} locale={locale} detailQuery={detailQuery} />;
}

export default async function PublicListing({ params, searchParams }: {
  params: Promise<{ locale: string; ecosystem: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale, ecosystem, id }, query] = await Promise.all([params, searchParams]);
  if (!isMarketplaceLocale(locale) || (ecosystem !== "cs2" && ecosystem !== "fashion") || !isUuid(id)) notFound();

  const copy = listingDictionaries[locale];
  const editorial = editorialDictionaries[locale];
  const client = createPublicSupabaseClient();
  const result = client ? await client.from("marketplace_public_listings").select("*").eq("id", id).eq("ecosystem", ecosystem).maybeSingle().retry(false) : null;
  if (!result || result.error) return <div className="mp-catalog"><p className="mp-feed-status" role="alert">{copy.catalogUnavailable}</p></div>;
  if (!result.data) notFound();

  const item = result.data;
  const orders = orderDictionaries[locale];
  const fromSearch = query.from === "search";
  const filters = parsePublicListingQuery(query, fromSearch ? undefined : ecosystem);
  const back = fromSearch ? `/${locale}/search${publicListingQueryString(filters)}` : publicListingHref(locale, ecosystem, filters);
  const detailQuery = publicListingQueryString(filters, fromSearch);
  const cs2 = ecosystem === "cs2";
  const fashion = ecosystem === "fashion" && !!item.fashion_product_id;
  const cs2Copy = cs2CatalogDictionaries[locale];
  const fashionCopy = fashionCatalogDictionaries[locale];
  const category = cs2 && isCs2Category(item.cs2_category) ? cs2Dictionaries[locale].categories[item.cs2_category] : item.category;
  const model = cs2 ? item.cs2_model : null;
  const wear = cs2 && isCs2Wear(item.cs2_wear) ? formatCs2Wear(locale, item.cs2_wear) : "";
  const galleryId = cs2 ? item.id : fashion ? item.fashion_color_id : null;
  const photos = galleryId
    ? cs2 ? item.cs2_images?.map((file) => cs2PhotoHref(galleryId, file))
      : item.fashion_images?.map((file) => fashionPhotoHref(galleryId, file))
    : null;
  const facts = [
    [copy.category, category],
    [cs2Copy.model, model],
    wear ? [cs2Copy.wear, wear] : [copy.variant, fashion ? null : item.variant],
    [fashionCopy.brand, fashion ? item.fashion_brand : null],
    [fashionCopy.material, fashion ? item.fashion_material : null],
    [fashionCopy.fit, fashion ? item.fashion_fit : null],
    [fashionCopy.care, fashion ? item.fashion_care : null],
  ].filter(([, value]) => value);

  return <div className="mp-catalog real-detail">
    <Link className="mp-text-link mp-back" href={back}><ArrowLeft aria-hidden="true" />{fromSearch ? editorial.backToSearch : copy.back}</Link>
    <div className="real-detail-grid">
      <div className="mp-page-heading">
        <p className="mp-kicker">{marketplaceDictionaries[locale][ecosystem]}</p>
        <h1>{item.title}</h1>
        {photos?.length ? <ListingGallery key={galleryId} ecosystem={ecosystem} photos={photos}
          title={fashion && item.fashion_color ? `${item.title} · ${item.fashion_color}` : item.title} locale={locale} /> : null}
        <p className="real-description">{item.description}</p>
        {cs2 && <p>{copy.unverifiedCs2}</p>}
      </div>
      <section className="real-offer" aria-labelledby="listing-facts">
        <h2 id="listing-facts" className="mp-imprint">{editorial.listingFacts}</h2>
        <p className="mp-price">{formatTiyin(item.price_tiyin, locale)}</p>
        <p className="mp-availability" data-available={item.available}>{item.available ? copy.available : copy.outOfStock}</p>
        {fashion && client && <Suspense fallback={<FashionVariants variants={[]} selected={item} locale={locale} detailQuery={detailQuery} />}>
          <FashionVariantOptions client={client} locale={locale} listing={item} detailQuery={detailQuery} />
        </Suspense>}
        {fashion && !!item.fashion_size_guide?.length && <FashionSizeGuide guide={item.fashion_size_guide} locale={locale} />}
        {facts.length > 0 && <dl className={fashion ? "fashion-listing-facts" : undefined}>
          {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>}
        {cs2 && client && wear && item.cs2_group_key && <Suspense fallback={null}>
          <Cs2Variants client={client} locale={locale} listing={item} detailQuery={detailQuery} />
        </Suspense>}
        {item.available && client
          ? <Suspense fallback={<p className="mp-muted" role="status">{orders.offerLoading}</p>}>
            <CheckoutOffer client={client} locale={locale} ecosystem={ecosystem} id={item.id} />
          </Suspense>
          : <p className="mp-muted">{orders.offerUnavailable}</p>}
      </section>
    </div>
  </div>;
}
