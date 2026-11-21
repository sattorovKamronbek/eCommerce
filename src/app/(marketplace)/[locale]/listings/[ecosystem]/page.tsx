import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingFilters } from "@/components/marketplace/listing-filters";
import { ListingResults, ListingResultsLoading } from "@/components/marketplace/listing-results";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { loadPublicListings } from "@/lib/sellers/public-catalog";
import { parsePublicListingQuery, publicListingHref, publicListingQueryString, type ListingEcosystem, type PublicListingQuery } from "@/lib/sellers/public-query";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";
import { listingDictionaries } from "@/messages/seller-catalog";
import { accountDictionaries } from "@/messages/account";

async function CatalogResults({ locale, ecosystem, filters }: {
  locale: MarketplaceLocale;
  ecosystem: ListingEcosystem;
  filters: PublicListingQuery;
}) {
  const client = createPublicSupabaseClient();
  const result = client ? await loadPublicListings(client, ecosystem, filters) : { rows: [], hasNext: false, error: true };
  const copy = listingDictionaries[locale];
  const common = accountDictionaries[locale];

  return <>
    <ListingResults result={result} locale={locale} heading="h2" detailQuery={publicListingQueryString(filters)} />
    {(filters.page > 1 || result.hasNext) && <nav className="account-pagination" aria-label={copy.publicTitle}>
      {filters.page > 1 ? <Link href={publicListingHref(locale, ecosystem, { ...filters, page: filters.page - 1 })} rel="prev">{common.previous}</Link> : <span aria-disabled="true">{common.previous}</span>}
      <span aria-current="page">{common.page} {filters.page}</span>
      {result.hasNext ? <Link href={publicListingHref(locale, ecosystem, { ...filters, page: filters.page + 1 })} rel="next">{common.next}</Link> : <span aria-disabled="true">{common.next}</span>}
    </nav>}
  </>;
}

export default async function PublicListings({ params, searchParams }: {
  params: Promise<{ locale: string; ecosystem: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale, ecosystem }, query] = await Promise.all([params, searchParams]);
  if (!isMarketplaceLocale(locale) || (ecosystem !== "cs2" && ecosystem !== "fashion")) notFound();

  const copy = listingDictionaries[locale];
  const filters = parsePublicListingQuery(query, ecosystem);
  const base = `/${locale}/listings/${ecosystem}`;

  return <div className="mp-catalog real-catalog">
    <div className="mp-page-heading">
      <h1>{copy[ecosystem]} <span>— {copy.publicTitle}</span></h1>
      <p>{copy.publicNotice}</p>
      {ecosystem === "cs2" && <p>{copy.unverifiedCs2}</p>}
    </div>
    <ListingFilters action={base} filters={filters} locale={locale} cs2={ecosystem === "cs2"} />
    <Suspense key={base + publicListingQueryString(filters)} fallback={<ListingResultsLoading locale={locale} />}>
      <CatalogResults locale={locale} ecosystem={ecosystem} filters={filters} />
    </Suspense>
  </div>;
}
