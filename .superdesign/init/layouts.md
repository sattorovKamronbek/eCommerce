# Shared layouts — complete source

Two separate root layouts are intentional: marketplace `/{locale}/marketplace/**` and retained legacy storefront routes. Cross-root navigation may reload the document. Marketplace locale is `uz`, `ru` or `en`; brand/config remains `src/lib/config.ts`; customer copy remains `src/messages`. There is no root `src/app/layout.tsx` or separate breadcrumb component. Protected account/admin pages use `src/components/account/workspace.tsx`; public catalogs remain sidebarless. Breadcrumb markup is inline in catalog/detail files. The marketplace root imports both legacy/base `src/app/globals.css` and marketplace-only `src/components/marketplace/styles.css`; the legacy root imports only globals.css. The marketplace shell remains sidebarless; wordmarks use translate="no" and the main target has tabIndex=-1 for the skip link.

## `src/app/(marketplace)/[locale]/layout.tsx`

Marketplace root layout: localized html document, metadata, provider, shared client frame and server footer.

```tsx
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
```

## `src/components/marketplace/frame.tsx`

Marketplace shell: skip link, wordmark, route-aware ecosystem navigation, query-preserving locale navigation, persisted light/dark/system theme, development notice and main landmark.

```tsx
"use client";

import { Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, Monitor, Moon, Sun } from "lucide-react";
import { marketplaceConfig, storeConfig } from "@/lib/config";
import { localeNames, type MarketplaceLocale, type MarketplaceMessages } from "@/messages/marketplace";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export type NavigationCopy = Pick<MarketplaceMessages, "discover" | "cs2" | "fashion" | "notice" | "skip" | "navigation" | "language" | "theme" | "light" | "dark" | "system">;

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
  const world = path.startsWith(`${base}/cs2`) ? "cs2" : path.startsWith(`${base}/fashion`) ? "fashion" : "home";
  const ThemeIcon = preference === "dark" ? Moon : preference === "light" ? Sun : Monitor;
  return <div className="mp" data-world={world} data-preference={preference}>
    <a className="skip-link" href="#marketplace-main">{copy.skip}</a>
    <header><div className="mp-header">
      <Link href={base} className="mp-wordmark" translate="no">{storeConfig.name}</Link>
      <nav className="mp-navigation" aria-label={copy.navigation}>
        {[[base, copy.discover], [`${base}/cs2`, copy.cs2], [`${base}/fashion`, copy.fashion]].map(([href, label]) => <Link key={href} href={href} aria-current={href === base ? path === href ? "page" : undefined : path.startsWith(href) ? "page" : undefined}>{label}</Link>)}
      </nav>
      <div className="mp-tools">
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
    </div><div className="mp-notice"><p>{copy.notice}</p></div></header>
    <main id="marketplace-main" tabIndex={-1}>{children}</main>
    {footer}
  </div>;
}
```

## `src/components/marketplace/footer.tsx`

Marketplace footer: temporary brand, tagline, retained storefront and how-it-works links.

```tsx
import Link from "next/link";
import { storeConfig } from "@/lib/config";
import { marketplaceDictionaries, type MarketplaceLocale } from "@/messages/marketplace";

export function MarketplaceFooter({ locale }: { locale: MarketplaceLocale }) {
  const copy = marketplaceDictionaries[locale];
  return <footer className="mp-footer">
    <div><Link className="mp-wordmark" translate="no" href={`/${locale}/marketplace`}>{storeConfig.name}</Link><p>{copy.tagline}</p></div>
    <nav aria-label={copy.how}><Link href="/storefront-preview">{copy.legacy}</Link><Link href={`/${locale}/marketplace/how-it-works`}>{copy.how}</Link></nav>
  </footer>;
}
```

## `src/app/(storefront)/layout.tsx`

Separate legacy root layout: Uzbek document, metadata, theme/shop provider, skip link, header, main and footer.

```tsx
import { copy } from "@/messages";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { storeConfig } from "@/lib/config";
import "../globals.css";
export const metadata: Metadata = {
  title: {
    default: `${storeConfig.name} — Hayotga did bilan`,
    template: `%s | ${storeConfig.name}`,
  },
  description: copy.uyingizVaKundalikHayotingizUchunDid,
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body>
        <Providers enableSystem>
          <a className="skip-link" href="#asosiy">
            {copy.asosiyMazmungaOtish}
          </a>
          <Header />
          <main id="asosiy">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

## `src/components/header.tsx`

Legacy announcement, sticky header, desktop/menu navigation, search, account, wishlist, theme switch and cart drawer.

```tsx
"use client";
import { copy } from "@/messages";
import Link from "next/link";
import {
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { storeConfig } from "@/lib/config";
import { messages as uz } from "@/messages";
import { ThemeToggle } from "./theme-toggle";
import { useShop } from "@/stores/shop";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { CartContent } from "./cart-content";
export function Header() {
  const [menu, setMenu] = useState(false);
  const count = useShop((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  return (
    <>
      <div className="announcement" role="region" aria-label={copy.dokonEloni}>
        {copy.kundalikHayotUchunDidBilanTanlangan}{" "}
        <span>{copy.ozbekistondaYaratilayotganDokon}</span>
      </div>
      <header className="header">
        <div className="header-inner">
          <Sheet open={menu} onOpenChange={setMenu}>
            <SheetTrigger asChild>
              <button
                className="icon-button mobile-menu"
                aria-label={uz.nav.menu}
              >
                <Menu />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="menu-sheet">
              <SheetTitle>{storeConfig.name}</SheetTitle>
              <SheetDescription>{copy.dokonBoylabSayohat}</SheetDescription>
              <nav className="mobile-links">
                {[
                  ["/katalog", uz.nav.catalog],
                  ["/katalog?yangi=1", uz.nav.arrivals],
                  ["/storefront-preview#kolleksiyalar", uz.nav.collections],
                  ["/malumot/biz-haqimizda", uz.nav.about],
                  ["/hisob", uz.nav.account],
                ].map(([href, label]) => (
                  <Link key={href} href={href} onClick={() => setMenu(false)}>
                    {label}
                    <ArrowRight />
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <Link
            className="wordmark"
            href="/"
            aria-label={`${storeConfig.name} — bosh sahifa`}
          >
            {storeConfig.name}
            <span>{copy.hayotgaDidBilan}</span>
          </Link>
          <nav className="desktop-nav" aria-label={copy.asosiyNavigatsiya}>
            <Link href="/katalog">{uz.nav.catalog}</Link>
            <Link href="/katalog?yangi=1">{uz.nav.arrivals}</Link>
            <Link href="/storefront-preview#kolleksiyalar">{uz.nav.collections}</Link>
            <Link href="/malumot/biz-haqimizda">{uz.nav.about}</Link>
          </nav>
          <div className="header-actions">
            <Link
              href="/katalog#qidirish"
              className="icon-button"
              aria-label={uz.nav.search}
            >
              <Search />
            </Link>
            <Link
              className="icon-button account-icon"
              href="/hisob"
              aria-label={uz.nav.account}
            >
              <UserRound />
            </Link>
            <Link
              href="/sevimlilar"
              className="icon-button"
              aria-label={uz.nav.wishlist}
            >
              <Heart />
            </Link>
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="icon-button bag-button"
                  aria-label={`${uz.nav.cart} (${count})`}
                >
                  <ShoppingBag />
                  {count > 0 && <span className="cart-count">{count}</span>}
                </button>
              </SheetTrigger>
              <SheetContent className="cart-sheet">
                <SheetTitle>{uz.cart.title}</SheetTitle>
                <SheetDescription>
                  {copy.namunaviyMahalliySavat}
                </SheetDescription>
                <CartContent compact />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
```

## `src/components/footer.tsx`

Legacy editorial footer, information links and visible development qualification.

```tsx
import { copy } from "@/messages";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { storeConfig } from "@/lib/config";
import { messages as uz } from "@/messages";
export function Footer() {
  return (
    <footer className="footer">
      <div className="newsletter">
        <div>
          <p className="eyebrow">{copy.oroOlami}</p>
          <h2>{uz.footer.newsletter}</h2>
        </div>
        <p>{uz.footer.newsletterNote}</p>
      </div>
      <div className="footer-main">
        <div>
          <Link href="/" className="wordmark">
            {storeConfig.name}
          </Link>
          <p>{uz.footer.tagline}</p>
        </div>
        <div>
          <h3>{uz.footer.shop}</h3>
          <Link href="/katalog">{uz.nav.catalog}</Link>
          <Link href="/katalog?yangi=1">{uz.nav.arrivals}</Link>
          <Link href="/sevimlilar">{uz.nav.wishlist}</Link>
        </div>
        <div>
          <h3>{uz.footer.help}</h3>
          <Link href="/malumot/yetkazib-berish">{uz.footer.shipping}</Link>
          <Link href="/malumot/qaytarish">{uz.footer.returns}</Link>
          <Link href="/malumot/boglanish">
            {uz.footer.contact}
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <div>
          <h3>{copy.bizBilanTanishing}</h3>
          <Link href="/malumot/biz-haqimizda">{uz.nav.about}</Link>
          <Link href="/malumot/maxfiylik">{copy.maxfiylik}</Link>
          <span>{copy.ozbekistonUzs}</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {storeConfig.name}. {uz.footer.rights}
        </span>
        <span>{uz.common.demo}</span>
      </div>
    </footer>
  );
}
```

## `src/components/providers.tsx`

Shared next-themes provider and explicit Zustand browser-state rehydration.

```tsx
"use client";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { useShop } from "@/stores/shop";
export function Providers({ children, defaultTheme = "light", enableSystem = false }: {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  enableSystem?: boolean;
}) {
  useEffect(() => {
    void useShop.persist.rehydrate();
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem={enableSystem}>
      {children}
    </ThemeProvider>
  );
}
```

## `src/components/theme-toggle.tsx`

Legacy compact resolved-theme light/dark button.

```tsx
"use client";
import { copy } from "@/messages";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      className="icon-button theme-button"
      aria-label={copy.rangMavzusiniAlmashtirish}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="sun" />
      <Moon className="moon" />
    </button>
  );
}
```


## Account workspace additions — 2026-11-12

`src/components/account/shell.tsx` owns compact and split public account forms. `workspace.tsx` owns protected profile/users navigation; `admin-users.tsx` renders the authorized query result. Dedicated presentation is in `account/styles.css`.
