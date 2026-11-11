import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketplaceDetail } from "@/components/marketplace/catalog";
import { marketplaceSamples } from "@/data/marketplace-samples";
import { isMarketplaceLocale, marketplaceDictionaries } from "@/messages/marketplace";

type Props = { params: Promise<{ locale: string; ecosystem: string; sampleId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export function generateStaticParams() { return marketplaceSamples.map((sample) => ({ ecosystem: sample.ecosystem, sampleId: sample.id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, ecosystem, sampleId } = await params;
  const sample = marketplaceSamples.find((item) => item.id === sampleId && item.ecosystem === ecosystem);
  if (!isMarketplaceLocale(locale) || !sample) notFound();
  return { title: marketplaceDictionaries[locale].items[sample.id].name };
}
export default async function SamplePage({ params, searchParams }: Props) {
  const [{ locale, ecosystem, sampleId }, query] = await Promise.all([params, searchParams]);
  const sample = marketplaceSamples.find((item) => item.id === sampleId && item.ecosystem === ecosystem);
  if (!isMarketplaceLocale(locale) || !sample) notFound();
  const read = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  return <MarketplaceDetail locale={locale} sample={sample} filters={{ q: read("q").slice(0, 100), type: read("type"), sort: read("sort") }} />;
}
