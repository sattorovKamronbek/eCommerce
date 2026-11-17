import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicListingCard } from "@/components/marketplace/public-listing-card";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { loadPublicListings } from "@/lib/sellers/public-catalog";
import { parsePublicListingQuery, publicListingHref } from "@/lib/sellers/public-query";
import { isMarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";
import { accountDictionaries } from "@/messages/account";

export default async function PublicListings({ params, searchParams }: {
  params: Promise<{ locale: string; ecosystem: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale, ecosystem }, query] = await Promise.all([params, searchParams]);
  if (!isMarketplaceLocale(locale) || (ecosystem !== "cs2" && ecosystem !== "fashion")) notFound();
  const copy = listingDictionaries[locale]; const common = accountDictionaries[locale];
  const filters = parsePublicListingQuery(query);
  const client = createPublicSupabaseClient();
  const result = client ? await loadPublicListings(client, ecosystem, filters) : { rows: [], hasNext: false, error: true };
  const base = `/${locale}/listings/${ecosystem}`;
  return <section className="mp-catalog real-catalog">
    <Link className="mp-text-link" href={`/${locale}/marketplace`}>{copy.back}</Link>
    <h1>{copy[ecosystem]} — {copy.publicTitle}</h1><p>{copy.publicNotice}</p>
    {ecosystem === "cs2" ? <p>{copy.unverifiedCs2}</p> : null}
    <form action={base} className="real-filters" method="get">
      <label>{copy.search}<input name="q" type="search" maxLength={80} defaultValue={filters.q} /></label>
      <label>{copy.sort}<select name="sort" defaultValue={filters.sort}><option value="recent">{copy.recent}</option><option value="price-asc">{copy.priceAsc}</option><option value="price-desc">{copy.priceDesc}</option></select></label>
      <button>{copy.searchButton}</button>
    </form>
    {result.error ? <p role="alert">{copy.catalogUnavailable}</p> : result.rows.length ? <div className="real-listings">{result.rows.map(listing => <PublicListingCard key={listing.id} listing={listing} locale={locale} />)}</div> : <p>{copy.noPublic}</p>}
    <nav className="account-pagination" aria-label={copy.publicTitle}>
      {filters.page > 1 ? <Link href={publicListingHref(locale, ecosystem, { ...filters, page: filters.page - 1 })} rel="prev">{common.previous}</Link> : <span aria-disabled="true">{common.previous}</span>}
      <span aria-current="page">{common.page} {filters.page}</span>{result.hasNext ? <Link href={publicListingHref(locale, ecosystem, { ...filters, page: filters.page + 1 })} rel="next">{common.next}</Link> : <span aria-disabled="true">{common.next}</span>}
    </nav>
  </section>;
}
