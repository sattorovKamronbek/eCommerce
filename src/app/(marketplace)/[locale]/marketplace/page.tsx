import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EditorialArt, EditorialHeading, EditorialLink } from "@/components/marketplace/editorial";
import { ListingResults } from "@/components/marketplace/listing-results";
import { loadPublicListings, type PublicListingResults } from "@/lib/sellers/public-catalog";
import type { ListingEcosystem } from "@/lib/sellers/public-query";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { editorialDictionaries } from "@/messages/editorial";
import { isMarketplaceLocale, marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";

async function NewArrivals({ locale }: { locale: MarketplaceLocale }) {
  const copy = marketplaceDictionaries[locale];
  const editorial = editorialDictionaries[locale];
  const client = createPublicSupabaseClient();
  const ecosystems = ["fashion", "cs2"] as const;
  const groups = await Promise.all(ecosystems.map(async (ecosystem): Promise<[ListingEcosystem, PublicListingResults]> => [
    ecosystem,
    client ? await loadPublicListings(client, ecosystem, { q: "", sort: "recent", page: 1 }, 3)
      : { rows: [], hasNext: false, error: true },
  ]));

  return <div className="mp-arrivals-grid">
    {groups.map(([ecosystem, result]) => <section key={ecosystem} aria-labelledby={`arrivals-${ecosystem}`}>
      <div className="mp-arrival-heading">
        <h3 id={`arrivals-${ecosystem}`}>{copy[ecosystem]}</h3>
        <EditorialLink href={`/${locale}/listings/${ecosystem}`}>{editorial.allListings}</EditorialLink>
      </div>
      <ListingResults result={result} locale={locale} heading="h4" />
    </section>)}
  </div>;
}

export default async function MarketplaceHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isMarketplaceLocale(locale)) notFound();

  const copy = marketplaceDictionaries[locale];
  const editorial = editorialDictionaries[locale];
  const fashion = `/${locale}/listings/fashion`;
  const cs2 = `/${locale}/listings/cs2`;
  const how = `/${locale}/marketplace/how-it-works`;
  const rifle = "/images/marketplace/rifle.png";
  const overshirt = "/images/marketplace/overshirt.png";
  const picks = [
    { section: copy.fashion, title: editorial.pickLayer, href: fashion, image: "/images/marketplace/puffer.png" },
    { section: copy.cs2, title: editorial.pickFinish, href: cs2, image: "/images/marketplace/knife.png" },
    { section: editorial.stories, title: editorial.texture, href: "#collection-stories", image: overshirt },
  ];

  return <div className="mp-home">
    <section className="mp-spread" aria-label={editorial.edition}>
      <div className="mp-spread-flag"><span className="mp-imprint">{editorial.edition}</span></div>
      <article className="mp-cover mp-story">
        <EditorialArt src="/images/marketplace/editorial-outerwear.webp" alt={editorial.coverAlt} preload
          sizes="(max-width: 660px) calc(100vw - 36px), (max-width: 1000px) 60vw, (max-width: 1440px) 48vw, 660px" />
        <div className="mp-story-copy">
          <p className="mp-kicker">{editorial.collection}</p>
          <h1>{editorial.outerwear}</h1>
          <p>{editorial.outerwearBody}</p>
          <EditorialLink href={fashion}>{copy.exploreFashion}</EditorialLink>
        </div>
      </article>

      <div className="mp-secondary-stories">
        <article className="mp-story">
          <EditorialArt src={rifle} sizes="(max-width: 660px) 38vw, (max-width: 1000px) 32vw, 340px" />
          <div className="mp-story-copy">
            <p className="mp-kicker">{copy.cs2}</p>
            <h2>{editorial.loadout}</h2>
            <p>{editorial.loadoutBody}</p>
            <EditorialLink href={cs2}>{copy.exploreCs2}</EditorialLink>
          </div>
        </article>
        <article className="mp-story mp-story-text" id="collection-stories">
          <p className="mp-kicker">{editorial.stories}</p>
          <h2>{editorial.texture}</h2>
          <p>{editorial.textureBody}</p>
          <EditorialLink href={fashion}>{copy.fashion}</EditorialLink>
        </article>
      </div>

      <aside className="mp-picks" aria-labelledby="editorial-picks">
        <EditorialHeading id="editorial-picks">{editorial.picks}</EditorialHeading>
        <ul>
          {picks.map((pick) => <li key={pick.title}>
            <Link href={pick.href} className="mp-pick-link">
              <div><p className="mp-kicker">{pick.section}</p><p className="mp-pick-title">{pick.title}</p></div>
              <EditorialArt src={pick.image} sizes="80px" />
            </Link>
          </li>)}
        </ul>
        <EditorialLink href={how}>{editorial.pickGuide}</EditorialLink>
      </aside>
    </section>

    <section className="mp-arrivals" aria-labelledby="new-arrivals">
      <EditorialHeading id="new-arrivals">{editorial.arrivals}</EditorialHeading>
      <Suspense fallback={<p className="mp-feed-status">{copy.loading}</p>}><NewArrivals locale={locale} /></Suspense>
    </section>

    <section className="mp-home-about" aria-labelledby="marketplace-how">
      <div className="mp-section-heading">
        <EditorialHeading id="marketplace-how">{copy.buyingTitle}</EditorialHeading>
        <EditorialLink href={how}>{copy.how}</EditorialLink>
      </div>
      <div className="mp-home-about-grid">
        <article><h3>{copy.fashion}</h3><p>{copy.fashionPlan}</p></article>
        <article><h3>{copy.cs2}</h3><p>{copy.cs2Plan}</p></article>
      </div>
      <p className="mp-home-about-note">{copy.planNote}</p>
    </section>
  </div>;
}
