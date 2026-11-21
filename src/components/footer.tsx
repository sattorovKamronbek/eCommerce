import { copy } from "@/messages";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowUpRight } from "lucide-react";
import { storeConfig } from "@/lib/config";
import { messages as uz } from "@/messages";
export function Footer() {
  return (
    <footer className="footer">
      <div className="newsletter">
        <div>
          <p className="eyebrow">{copy.brendOlami}</p>
          <h2>{uz.footer.newsletter}</h2>
        </div>
        <p>{uz.footer.newsletterNote}</p>
      </div>
      <div className="footer-main">
        <div>
          <Link href="/" className="wordmark" translate="no">
            <BrandLogo />
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
