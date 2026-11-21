import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isMarketplaceLocale, marketplaceDictionaries } from "@/messages/marketplace";

export default async function MarketplaceHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isMarketplaceLocale(locale)) notFound();
  const copy = marketplaceDictionaries[locale];
  return (
    <div className="mp-home">
      <div className="mp-home-hero">
        <section className="mp-intro">
          <h1><span>{copy.titleLine1}</span><span>{copy.titleLine2}</span></h1>
          <p>{copy.subtitle}</p>
          <p className="mp-intro-detail">{copy.buyingIntro}</p>
          <div className="mp-hero-actions">
            <Button asChild size="lg"><Link href={`/${locale}/listings/cs2`}>{copy.exploreCs2}<ArrowRight aria-hidden="true" data-icon="inline-end" /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href={`/${locale}/listings/fashion`}>{copy.exploreFashion}<ArrowRight aria-hidden="true" data-icon="inline-end" /></Link></Button>
          </div>
        </section>
        <div className="mp-destinations">
          <Link className="mp-destination mp-destination-cs2" href={`/${locale}/listings/cs2`} aria-labelledby="destination-cs2">
            <div className="mp-destination-media"><Image src="/images/marketplace/rifle.png" alt="" fill priority sizes="(max-width: 600px) 50vw, (max-width: 1000px) 45vw, 28vw" /></div>
            <div className="mp-destination-copy"><h2 id="destination-cs2">{copy.cs2}</h2><ArrowUpRight aria-hidden="true" /></div>
          </Link>
          <Link className="mp-destination mp-destination-fashion" href={`/${locale}/listings/fashion`} aria-labelledby="destination-fashion">
            <div className="mp-destination-media"><Image src="/images/marketplace/puffer.png" alt="" fill priority sizes="(max-width: 600px) 50vw, (max-width: 1000px) 45vw, 28vw" /></div>
            <div className="mp-destination-copy"><h2 id="destination-fashion">{copy.fashion}</h2><ArrowUpRight aria-hidden="true" /></div>
          </Link>
        </div>
      </div>
      <section className="mp-home-about" aria-labelledby="marketplace-about-title">
        <div className="mp-section-heading"><h2 id="marketplace-about-title">{copy.buyingTitle}</h2><Link className="mp-text-link" href={`/${locale}/marketplace/how-it-works`}>{copy.how}<ArrowRight aria-hidden="true" /></Link></div>
        <div className="mp-home-about-grid">
          <article><h3>{copy.cs2}</h3><p>{copy.cs2Plan}</p></article>
          <article><h3>{copy.fashion}</h3><p>{copy.fashionPlan}</p></article>
        </div>
        <p className="mp-home-about-note">{copy.planNote}</p>
      </section>
    </div>
  );
}
