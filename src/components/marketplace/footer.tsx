import Link from "next/link";
import { storeConfig } from "@/lib/config";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";

export function MarketplaceFooter({ locale }: { locale: MarketplaceLocale }) {
  const copy = marketplaceDictionaries[locale];
  return <footer className="mp-footer">
    <div><Link className="mp-wordmark" translate="no" href={`/${locale}/marketplace`}>{storeConfig.name}</Link><p>{copy.tagline}</p></div>
    <nav aria-label={copy.how}><Link href={`/${locale}/marketplace/how-it-works`}>{copy.how}</Link></nav>
  </footer>;
}
