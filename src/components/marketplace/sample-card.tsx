import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MarketplaceSample } from "@/data/marketplace-samples";
import { formatSamplePrice, sampleFilterQuery, type SampleFilters } from "@/lib/marketplace";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";

type SampleCardProps = {
  sample: MarketplaceSample;
  locale: MarketplaceLocale;
  filters?: SampleFilters;
  headingLevel?: 2 | 3;
};

export function SampleCard({ sample, locale, filters = {}, headingLevel = 2 }: SampleCardProps) {
  const copy = marketplaceDictionaries[locale];
  const item = copy.items[sample.id];
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const titleId = `sample-${sample.id}`;
  const href = `/${locale}/marketplace/${sample.ecosystem}/${sample.id}${sampleFilterQuery(filters)}`;

  return (
    <article className="mp-sample-card" data-sample={sample.id}>
      <Link href={href} className="mp-sample-link" aria-labelledby={titleId}>
        <div className="mp-sample-media">
          <Image src={sample.image} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw" />
        </div>
        <div className="mp-sample-copy">
          <p className="mp-muted">{copy.sample}</p>
          <Heading id={titleId}>{item.name}</Heading>
          <p className="mp-muted">{copy.illustration}</p>
          <div className="mp-sample-bottom">
            <p className="mp-sample-price">{formatSamplePrice(sample.samplePriceUzs, locale)}</p>
            <span className="mp-card-action">{copy.view}<ArrowRight aria-hidden="true" /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
