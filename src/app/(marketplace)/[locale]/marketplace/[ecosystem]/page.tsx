import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MarketplaceCatalog } from "@/components/marketplace/catalog";
import { isMarketplaceLocale, marketplaceDictionaries } from "@/messages/marketplace";

type Props = { params: Promise<{ locale: string; ecosystem: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, ecosystem } = await params;
  if (!isMarketplaceLocale(locale) || (ecosystem !== "cs2" && ecosystem !== "fashion")) notFound();
  return { title: marketplaceDictionaries[locale][ecosystem] };
}
export default async function CatalogPage({ params, searchParams }: Props) {
  const [{ locale, ecosystem }, query] = await Promise.all([params, searchParams]);
  if (!isMarketplaceLocale(locale) || (ecosystem !== "cs2" && ecosystem !== "fashion")) notFound();
  const read = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  return <MarketplaceCatalog locale={locale} ecosystem={ecosystem} filters={{ q: read("q").slice(0, 100), type: read("type"), sort: read("sort") }} />;
}
