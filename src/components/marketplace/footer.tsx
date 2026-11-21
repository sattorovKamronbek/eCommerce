import Link from "next/link";
import { storeConfig } from "@/lib/config";
import { accountDictionaries } from "@/messages/account";
import { editorialDictionaries } from "@/messages/editorial";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";

export function MarketplaceFooter({ locale }: { locale: MarketplaceLocale }) {
  const copy = marketplaceDictionaries[locale];
  const editorial = editorialDictionaries[locale];
  const account = accountDictionaries[locale];
  return <footer className="mp-footer">
    <div className="mp-footer-inner">
      <div className="mp-footer-brand">
        <Link className="mp-wordmark" translate="no" href={`/${locale}/marketplace`}>{storeConfig.name}</Link>
        <p>{copy.subtitle}</p>
      </div>
      <nav aria-label={editorial.browse}>
        <Link href={`/${locale}/listings/fashion`}>{copy.fashion}</Link>
        <Link href={`/${locale}/listings/cs2`}>{copy.cs2}</Link>
        <Link href={`/${locale}/search`}>{copy.search}</Link>
      </nav>
      <nav aria-label={copy.how}>
        <Link href={`/${locale}/marketplace/how-it-works`}>{copy.how}</Link>
        <Link href={`/${locale}/account`}>{account.account}</Link>
        <Link href="/katalog" hrefLang="uz">{editorial.sampleCatalog}</Link>
        <Link href="/savat" hrefLang="uz">{editorial.sampleCart}</Link>
      </nav>
    </div>
  </footer>;
}
