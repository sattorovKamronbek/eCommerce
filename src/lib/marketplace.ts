import { marketplaceSamples, type Ecosystem, type MarketplaceSample } from "@/data/marketplace-samples";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";

export type SampleFilters = { q?: string; type?: string; sort?: string };

export function sampleFilterQuery(filters: SampleFilters): string {
  const params = new URLSearchParams();
  const query = filters.q?.trim().slice(0, 100);
  if (query) params.set("q", query);
  if (filters.type) params.set("type", filters.type);
  if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function filterMarketplaceSamples(ecosystem: Ecosystem, locale: MarketplaceLocale, filters: SampleFilters): MarketplaceSample[] {
  const query = (filters.q ?? "").trim().slice(0, 100).toLocaleLowerCase(locale);
  const dictionary = marketplaceDictionaries[locale];
  const result = marketplaceSamples.filter((item) => item.ecosystem === ecosystem
    && (!filters.type || item.type === filters.type)
    && (!query || `${dictionary.items[item.id].name} ${dictionary.types[item.type]}`.toLocaleLowerCase(locale).includes(query)));
  if (filters.sort === "price-asc") result.sort((a, b) => a.samplePriceUzs - b.samplePriceUzs);
  if (filters.sort === "price-desc") result.sort((a, b) => b.samplePriceUzs - a.samplePriceUzs);
  return result;
}
export function formatSamplePrice(amount: number, locale: MarketplaceLocale): string {
  return `${new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US").format(amount)} UZS`;
}
