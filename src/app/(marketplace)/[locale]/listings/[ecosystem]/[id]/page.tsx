import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { formatTiyin } from "@/lib/orders/model";
import { parsePublicListingQuery, publicListingHref, publicListingQueryString, type ListingEcosystem } from "@/lib/sellers/public-query";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { Database } from "@/lib/supabase/database";
import { isUuid } from "@/lib/uuid";
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
  const filters = parsePublicListingQuery(query);
  const fromSearch = query.from === "search";
  const back = fromSearch ? `/${locale}/search${publicListingQueryString(filters)}` : publicListingHref(locale, ecosystem, filters);

  return <div className="mp-catalog real-detail">
    <Link className="mp-text-link mp-back" href={back}><ArrowLeft aria-hidden="true" />{fromSearch ? editorial.backToSearch : copy.back}</Link>
    <div className="real-detail-grid">
      <div className="mp-page-heading">
        <p className="mp-kicker">{marketplaceDictionaries[locale][ecosystem]}</p>
        <h1>{item.title}</h1>
        <p className="real-description">{item.description}</p>
        {ecosystem === "cs2" && <p>{copy.unverifiedCs2}</p>}
      </div>
      <section className="real-offer" aria-labelledby="listing-facts">
        <h2 id="listing-facts" className="mp-imprint">{editorial.listingFacts}</h2>
        <p className="mp-price">{formatTiyin(item.price_tiyin, locale)}</p>
        <p className="mp-availability" data-available={item.available}>{item.available ? copy.available : copy.outOfStock}</p>
        {(item.category || item.variant) && <dl>
          {item.category && <div><dt>{copy.category}</dt><dd>{item.category}</dd></div>}
          {item.variant && <div><dt>{copy.variant}</dt><dd>{item.variant}</dd></div>}
        </dl>}
        {item.available && client
          ? <Suspense fallback={<p className="mp-muted" role="status">{orders.offerLoading}</p>}>
            <CheckoutOffer client={client} locale={locale} ecosystem={ecosystem} id={item.id} />
          </Suspense>
          : <p className="mp-muted">{orders.offerUnavailable}</p>}
      </section>
    </div>
  </div>;
}
