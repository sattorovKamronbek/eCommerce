import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Providers } from "@/components/providers";
import { MarketplaceFrame, type NavigationCopy } from "@/components/marketplace/frame";
import { MarketplaceFooter } from "@/components/marketplace/footer";
import { marketplaceConfig, storeConfig } from "@/lib/config";
import { isMarketplaceLocale, marketplaceDictionaries } from "@/messages/marketplace";
import { accountDictionaries } from "@/messages/account";
import "../../globals.css";
import "@/components/marketplace/styles.css";
import "@/components/account/styles.css";

export function generateStaticParams() { return marketplaceConfig.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isMarketplaceLocale(locale)) notFound();
  const copy = marketplaceDictionaries[locale];
  return { title: { default: `${storeConfig.name} — ${copy.subtitle}`, template: `%s | ${storeConfig.name}` }, description: copy.subtitle, robots: { index: false, follow: false }, icons: { icon: "/icon.svg" } };
}

export default async function MarketplaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isMarketplaceLocale(locale)) notFound();
  const copy = marketplaceDictionaries[locale];
  const { discover, cs2, fashion, notice, skip, navigation, language, theme, light, dark, system } = copy;
  const navigationCopy: NavigationCopy = { discover, cs2, fashion, notice, skip, navigation, language, theme, light, dark, system, account: accountDictionaries[locale].account };
  return <html lang={locale} suppressHydrationWarning><body><Providers defaultTheme="system" enableSystem><MarketplaceFrame locale={locale} copy={navigationCopy} footer={<MarketplaceFooter locale={locale} />}>{children}</MarketplaceFrame></Providers></body></html>;
}
