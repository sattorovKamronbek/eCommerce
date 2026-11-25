import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EditorialLink } from "@/components/marketplace/editorial";
import { ListingFilters } from "@/components/marketplace/listing-filters";
import { ListingResults, ListingResultsLoading } from "@/components/marketplace/listing-results";
import { loadPublicListings } from "@/lib/sellers/public-catalog";
import { parsePublicListingQuery, publicListingHref, publicListingQueryString, type ListingEcosystem, type PublicListingQuery } from "@/lib/sellers/public-query";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { editorialDictionaries } from "@/messages/editorial";
import { isMarketplaceLocale, marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";

async function SearchResults({ locale, ecosystem, filters }: {
  locale: MarketplaceLocale; ecosystem: ListingEcosystem; filters: PublicListingQuery;
}) {
  const editorial = editorialDictionaries[locale];
  const client = createPublicSupabaseClient();
  const result = client ? await loadPublicListings(client, ecosystem, filters, 6) : { rows: [], hasNext: false, error: true };
  return <>
    <ListingResults result={result} locale={locale} heading="h3" detailQuery={publicListingQueryString(filters, true)} />
    {result.hasNext && <EditorialLink href={publicListingHref(locale, ecosystem, filters)}>{editorial.moreResults}</EditorialLink>}
  </>;
}

export default async function MarketplaceSearch({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isMarketplaceLocale(locale)) notFound();

  const editorial = editorialDictionaries[locale];
  const copy = marketplaceDictionaries[locale];
  const filters = { ...parsePublicListingQuery(query), page: 1 };
  return <div className="mp-catalog real-catalog">
    <div className="mp-page-heading">
      <h1>{editorial.searchTitle}</h1>
      <p>{editorial.searchIntro}</p>
    </div>
    <ListingFilters action={`/${locale}/search`} filters={filters} locale={locale} />
    {filters.q ? <div className="mp-search-results">
      {(["fashion", "cs2"] as const).map(ecosystem => <section key={ecosystem} aria-labelledby={`search-${ecosystem}`}>
        <div className="mp-arrival-heading"><h2 id={`search-${ecosystem}`}>{copy[ecosystem]}</h2></div>
        <Suspense key={publicListingQueryString(filters)} fallback={<ListingResultsLoading locale={locale} />}>
          <SearchResults locale={locale} ecosystem={ecosystem} filters={filters} />
        </Suspense>
      </section>)}
    </div> : <p className="mp-feed-status">{editorial.searchPrompt}</p>}
  </div>;
}
