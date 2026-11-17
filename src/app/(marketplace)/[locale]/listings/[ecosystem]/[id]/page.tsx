import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { isMarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";

export default async function PublicListing({ params }: { params: Promise<{ locale: string; ecosystem: string; id: string }> }) {
  const { locale, ecosystem, id } = await params;
  if (!isMarketplaceLocale(locale) || (ecosystem !== "cs2" && ecosystem !== "fashion") || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const copy = listingDictionaries[locale];
  const client = createPublicSupabaseClient();
  const result = client ? await client.from("marketplace_public_listings").select("*").eq("id", id).eq("ecosystem", ecosystem).maybeSingle() : null;
  if (!result || result.error) return <section className="mp-catalog"><p role="alert">{copy.catalogUnavailable}</p></section>;
  if (!result.data) notFound();
  const item = result.data;
  return <section className="mp-catalog real-catalog"><Link className="mp-text-link" href={`/${locale}/listings/${ecosystem}`}>{copy.back}</Link>
    <h1>{item.title}</h1><p className="real-description">{item.description}</p>
    <p>{new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.price_tiyin / 100)} UZS</p>
    {item.category ? <p>{copy.category}: {item.category}</p> : null}{item.variant ? <p>{copy.variant}: {item.variant}</p> : null}
    <p>{item.available ? copy.available : copy.outOfStock}</p><p>{copy.publicNotice}</p>{ecosystem === "cs2" ? <p>{copy.unverifiedCs2}</p> : null}
  </section>;
}
