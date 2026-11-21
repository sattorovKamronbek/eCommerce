import Link from "next/link";
import { isUuid } from "@/lib/uuid";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatTiyin } from "@/lib/orders/model";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { isMarketplaceLocale } from "@/messages/marketplace";
import { orderDictionaries } from "@/messages/orders";
import { listingDictionaries } from "@/messages/seller-catalog";

export default async function PublicListing({ params }: { params: Promise<{ locale: string; ecosystem: string; id: string }> }) {
  const { locale, ecosystem, id } = await params;
  if (!isMarketplaceLocale(locale) || (ecosystem !== "cs2" && ecosystem !== "fashion") || !isUuid(id)) notFound();
  const copy = listingDictionaries[locale];
  const client = createPublicSupabaseClient();
  const result = client ? await client.from("marketplace_public_listings").select("*").eq("id", id).eq("ecosystem", ecosystem).maybeSingle() : null;
  if (!result || result.error) return <section className="mp-catalog"><p role="alert">{copy.catalogUnavailable}</p></section>;
  if (!result.data) notFound();
  const item = result.data;
  const orders = orderDictionaries[locale];
  const offer = item.available && client ? await client.from("marketplace_checkout_offers").select("listing_id")
    .eq("listing_id", item.id).maybeSingle() : null;
  return <section className="mp-catalog real-catalog"><Link className="mp-text-link" href={`/${locale}/listings/${ecosystem}`}>{copy.back}</Link>
    <h1>{item.title}</h1><p className="real-description">{item.description}</p>
    <p>{formatTiyin(item.price_tiyin, locale)}</p>
    {item.category ? <p>{copy.category}: {item.category}</p> : null}{item.variant ? <p>{copy.variant}: {item.variant}</p> : null}
    <p>{item.available ? copy.available : copy.outOfStock}</p>
    {ecosystem === "cs2" ? <p>{copy.unverifiedCs2}</p> : null}
    {offer?.data ? <div><Button asChild><Link href={`/${locale}/account/checkout/${ecosystem}/${id}`}>{orders.checkout}</Link></Button></div>
      : <p>{orders.offerUnavailable}</p>}
  </section>;
}
