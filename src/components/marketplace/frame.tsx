"use client";

import { Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, Monitor, Moon, Sun, UserRound } from "lucide-react";
import { marketplaceConfig, storeConfig } from "@/lib/config";
import { localeNames, type MarketplaceLocale, type MarketplaceMessages } from "@/messages/marketplace";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export type NavigationCopy = Pick<MarketplaceMessages, "discover" | "cs2" | "fashion" | "skip" | "navigation" | "language" | "theme" | "light" | "dark" | "system"> & { account: string };

const subscribeToMount = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function LanguageLinks({ locale, path, label, query = "" }: { locale: MarketplaceLocale; path: string; label: string; query?: string }) {
  return <nav className="mp-languages" aria-label={label}>
    {marketplaceConfig.locales.map((target) => <Link key={target} href={`${path.replace(`/${locale}/`, `/${target}/`)}${query}`} lang={target} hrefLang={target} aria-label={localeNames[target]} aria-current={target === locale ? "page" : undefined}>{target.toUpperCase()}</Link>)}
  </nav>;
}

function QueryLanguageLinks(props: { locale: MarketplaceLocale; path: string; label: string }) {
  const query = useSearchParams().toString();
  return <LanguageLinks {...props} query={query ? `?${query}` : ""} />;
}

export function MarketplaceBackLink({ href, label }: { href: string; label: string }) {
  const query = useSearchParams().toString();
  return <Link className="mp-text-link mp-back" href={`${href}${query ? `?${query}` : ""}`}><ArrowLeft aria-hidden="true" />{label}</Link>;
}

export function MarketplaceFrame({ locale, copy, children, footer }: { locale: MarketplaceLocale; copy: NavigationCopy; children: React.ReactNode; footer: React.ReactNode }) {
  const path = usePathname();
  const { theme, setTheme } = useTheme();
  // Match server markup during hydration before reading a persisted preference.
  const mounted = useSyncExternalStore(subscribeToMount, clientSnapshot, serverSnapshot);
  const preference = mounted ? theme ?? "system" : "system";
  const base = `/${locale}/marketplace`;
  const catalogs = `/${locale}/listings`;
  const section = path.split("/")[3];
  const isCatalog = path.startsWith(`${catalogs}/`) || path.startsWith(`${base}/`);
  const world = isCatalog && (section === "cs2" || section === "fashion") ? section : "home";
  const ThemeIcon = preference === "dark" ? Moon : preference === "light" ? Sun : Monitor;
  return <div className="mp" data-world={world} data-preference={preference}>
    <a className="skip-link" href="#marketplace-main">{copy.skip}</a>
    <header><div className="mp-header">
      <Link href={base} className="mp-wordmark" translate="no">{storeConfig.name}</Link>
      <nav className="mp-navigation" aria-label={copy.navigation}>
        {[[base, copy.discover], [`${catalogs}/cs2`, copy.cs2], [`${catalogs}/fashion`, copy.fashion]].map(([href, label]) => <Link key={href} href={href} aria-current={href === base ? path === href ? "page" : undefined : (path === href || path.startsWith(`${href}/`)) ? "page" : undefined}>{label}</Link>)}
      </nav>
      <div className="mp-tools">
        <Link className="mp-account-link" href={`/${locale}/account`} aria-label={copy.account}><UserRound aria-hidden="true" /></Link>
        <Suspense fallback={<LanguageLinks locale={locale} path={path} label={copy.language} />}><QueryLanguageLinks locale={locale} path={path} label={copy.language} /></Suspense>
        <label className="mp-theme">
          <ThemeIcon aria-hidden="true" />
          <span className="sr-only">{copy.theme}</span>
          <NativeSelect aria-label={copy.theme} value={preference} onChange={(event) => setTheme(event.target.value)}>
            <NativeSelectOption value="system">{copy.system}</NativeSelectOption>
            <NativeSelectOption value="light">{copy.light}</NativeSelectOption>
            <NativeSelectOption value="dark">{copy.dark}</NativeSelectOption>
          </NativeSelect>
        </label>
      </div>
    </div></header>
    <main id="marketplace-main" tabIndex={-1}>{children}</main>
    {footer}
  </div>;
}
