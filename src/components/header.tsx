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
