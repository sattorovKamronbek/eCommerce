import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Cs2ListingGallery } from "@/components/marketplace/cs2-listing-gallery";
import { Button } from "@/components/ui/button";
import { formatTiyin } from "@/lib/orders/model";
import { CS2_WEAR, isCs2Category, isCs2Wear } from "@/lib/sellers/cs2";
import { loadPublicCs2Variants } from "@/lib/sellers/public-catalog";
import { parsePublicListingQuery, publicListingHref, publicListingQueryString, type ListingEcosystem } from "@/lib/sellers/public-query";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Database, PublicListing as PublicListingRow } from "@/lib/supabase/database";
import { isUuid } from "@/lib/uuid";
import { cs2CatalogDictionaries, formatCs2Wear } from "@/messages/cs2-catalog";
import { cs2Dictionaries } from "@/messages/cs2-listing";
import { editorialDictionaries } from "@/messages/editorial";
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
  const cs2 = ecosystem === "cs2";
  const cs2Copy = cs2CatalogDictionaries[locale];
  const category = cs2 && isCs2Category(item.cs2_category) ? cs2Dictionaries[locale].categories[item.cs2_category] : item.category;
  const model = cs2 ? item.cs2_model : null;
  const wear = cs2 && isCs2Wear(item.cs2_wear) ? formatCs2Wear(locale, item.cs2_wear) : "";

  return <div className="mp-catalog real-detail">
    <Link className="mp-text-link mp-back" href={back}><ArrowLeft aria-hidden="true" />{fromSearch ? editorial.backToSearch : copy.back}</Link>
    <div className="real-detail-grid">
      <div className="mp-page-heading">
        <p className="mp-kicker">{marketplaceDictionaries[locale][ecosystem]}</p>
        <h1>{item.title}</h1>
        {cs2 && !!item.cs2_images?.length && <Cs2ListingGallery key={item.id} id={item.id} files={item.cs2_images} title={item.title} locale={locale} />}
        <p className="real-description">{item.description}</p>
        {cs2 && <p>{copy.unverifiedCs2}</p>}
      </div>
      <section className="real-offer" aria-labelledby="listing-facts">
        <h2 id="listing-facts" className="mp-imprint">{editorial.listingFacts}</h2>
        <p className="mp-price">{formatTiyin(item.price_tiyin, locale)}</p>
        <p className="mp-availability" data-available={item.available}>{item.available ? copy.available : copy.outOfStock}</p>
        {(category || model || wear || item.variant) && <dl>
          {category && <div><dt>{copy.category}</dt><dd>{category}</dd></div>}
          {model && <div><dt>{cs2Copy.model}</dt><dd>{model}</dd></div>}
          {wear
            ? <div><dt>{cs2Copy.wear}</dt><dd>{wear}</dd></div>
            : item.variant && <div><dt>{copy.variant}</dt><dd>{item.variant}</dd></div>}
        </dl>}
        {cs2 && client && wear && item.cs2_group_key && <Suspense fallback={null}>
          <Cs2Variants client={client} locale={locale} listing={item} detailQuery={publicListingQueryString(filters, fromSearch)} />
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
