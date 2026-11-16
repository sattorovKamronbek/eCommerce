import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import type { Ecosystem, MarketplaceSample, SampleType } from "@/data/marketplace-samples";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";
import { filterMarketplaceSamples, formatSamplePrice, sampleFilterQuery, type SampleFilters } from "@/lib/marketplace";
import { SampleCard } from "./sample-card";
import { MarketplaceBackLink } from "./frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

export function TradingBoundary({ locale }: { locale: MarketplaceLocale }) {
  const copy = marketplaceDictionaries[locale];
  return (
    <Alert className="mp-boundary" role="note">
      <Info aria-hidden="true" />
      <AlertTitle>{copy.notLive}</AlertTitle>
      <AlertDescription>{copy.boundary}</AlertDescription>
    </Alert>
  );
}

export function MarketplaceCatalog({ locale, ecosystem, filters }: { locale: MarketplaceLocale; ecosystem: Ecosystem; filters: SampleFilters }) {
  const copy = marketplaceDictionaries[locale];
  const base = "/" + locale + "/marketplace";
  const catalogHref = base + "/" + ecosystem;
  const items = filterMarketplaceSamples(ecosystem, locale, filters);
  const types: SampleType[] = ecosystem === "cs2" ? ["rifle", "knife"] : ["outerwear", "overshirt"];
  const categories = [{ value: "", label: copy.allTypes }, ...types.map((type) => ({ value: type, label: copy.types[type] }))];
  const hasFilters = Boolean(filters.q || filters.type || filters.sort && filters.sort !== "featured");

  return (
    <div className="mp-catalog mp-catalog-index">
      <nav className="mp-breadcrumb" aria-label={copy.breadcrumb}>
        <Link href={base}>{copy.discover}</Link><span aria-hidden="true">/</span><span aria-current="page">{copy[ecosystem]}</span>
      </nav>
      <div className="mp-catalog-heading">
        <h1>{copy[ecosystem]}</h1>
        <p className="mp-catalog-intro">{ecosystem === "cs2" ? copy.cs2Intro : copy.fashionIntro}</p>
      </div>
      <nav className="mp-types" aria-label={copy.typeNavigation}>
        {categories.map(({ value, label }) => (
          <Link key={value} href={catalogHref + sampleFilterQuery({ ...filters, type: value })} aria-current={(filters.type ?? "") === value ? "page" : undefined}>{label}</Link>
        ))}
      </nav>
      <form key={JSON.stringify(filters)} action={catalogHref} method="get" className="mp-filter-form" autoComplete="off">
        <FieldGroup className="mp-filter-fields">
          <Field orientation="horizontal">
            <FieldLabel htmlFor="sample-search">{copy.search}</FieldLabel>
            <Input id="sample-search" name="q" type="search" placeholder={copy.searchPlaceholder} maxLength={100} defaultValue={filters.q ?? ""} autoCapitalize="none" spellCheck={false} />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="sample-type">{copy.type}</FieldLabel>
            <NativeSelect id="sample-type" name="type" defaultValue={filters.type ?? ""}>
              <NativeSelectOption value="">{copy.allTypes}</NativeSelectOption>
              {types.map((type) => <NativeSelectOption key={type} value={type}>{copy.types[type]}</NativeSelectOption>)}
            </NativeSelect>
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="sample-sort">{copy.sort}</FieldLabel>
            <NativeSelect id="sample-sort" name="sort" defaultValue={filters.sort ?? "featured"}>
              <NativeSelectOption value="featured">{copy.featured}</NativeSelectOption>
              <NativeSelectOption value="price-asc">{copy.priceAsc}</NativeSelectOption>
              <NativeSelectOption value="price-desc">{copy.priceDesc}</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Button type="submit" size="lg">{copy.apply}</Button>
        </FieldGroup>
      </form>
      <div className="mp-results">
        <p role="status" aria-live="polite">{new Intl.NumberFormat(locale).format(items.length)} {copy.sampleCount}</p>
        {hasFilters ? <Link href={catalogHref}>{copy.reset}</Link> : null}
      </div>
      {items.length ? (
        <div className="mp-sample-grid">{items.map((sample) => <SampleCard key={sample.id} sample={sample} locale={locale} filters={filters} />)}</div>
      ) : (
        <Empty><EmptyHeader><EmptyTitle>{copy.emptyTitle}</EmptyTitle><EmptyDescription>{copy.emptyBody}</EmptyDescription></EmptyHeader><EmptyContent><Button asChild variant="outline"><Link href={catalogHref}>{copy.reset}</Link></Button></EmptyContent></Empty>
      )}
      <TradingBoundary locale={locale} />
      <p className="mp-price-note">{copy.priceNote}</p>
    </div>
  );
}

export function MarketplaceDetail({ locale, sample }: { locale: MarketplaceLocale; sample: MarketplaceSample }) {
  const copy = marketplaceDictionaries[locale];
  const item = copy.items[sample.id];

  return (
    <div className="mp-catalog mp-detail-page">
      <Suspense fallback={<Link className="mp-text-link mp-back" href={"/" + locale + "/marketplace/" + sample.ecosystem}><ArrowLeft aria-hidden="true" />{copy.back}</Link>}>
        <MarketplaceBackLink href={"/" + locale + "/marketplace/" + sample.ecosystem} label={copy.back} />
      </Suspense>
      <div className="mp-detail">
        <div className="mp-detail-media"><Image src={sample.image} alt={item.name} fill priority sizes="(max-width: 800px) 100vw, 55vw" /></div>
        <div className="mp-detail-copy">
          <p className="mp-muted">{copy.sample}</p>
          <h1>{item.name}</h1>
          <p className="mp-detail-description">{item.description}</p>
          <div className="mp-detail-price"><p className="mp-muted">{copy.price}</p><p>{formatSamplePrice(sample.samplePriceUzs, locale)}</p></div>
          <dl>
            <div><dt>{copy.category}</dt><dd>{copy.types[sample.type]}</dd></div>
            <div><dt>{copy.availability}</dt><dd>{copy.notForSale}</dd></div>
          </dl>
          {sample.sizes.length ? (
            <fieldset className="mp-sizes"><legend>{copy.size}</legend><div>{sample.sizes.map((size, index) => <label key={size}><input type="radio" name="sample-size" value={size} defaultChecked={index === 0} /><span>{size}</span></label>)}</div><p>{copy.sizeNote}</p></fieldset>
          ) : null}
          <p className="mp-detail-note">{sample.ecosystem === "cs2" ? copy.detailNote : copy.fashionNote}</p>
          <p className="mp-muted">{copy.priceNote}</p>
        </div>
      </div>
      <TradingBoundary locale={locale} />
    </div>
  );
}
