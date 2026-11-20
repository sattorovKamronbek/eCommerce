import Link from "next/link";
import { AccountShell, AccountUnavailable, SellerSetupRequired } from "@/components/account/shell";
import { listingDictionaries } from "@/messages/seller-catalog";
import type { MarketplaceLocale } from "@/messages/marketplace";

export function SellerAccessNotice({ locale, kind }: { locale: MarketplaceLocale; kind: "unavailable" | "denied" | "mfa" | "setup" }) {
  const copy = listingDictionaries[locale];
  if (kind === "setup") return <SellerSetupRequired locale={locale} />;
  if (kind === "unavailable") return <AccountUnavailable locale={locale} />;
  return <AccountShell locale={locale} title={copy.products} intro={kind === "mfa" ? copy.requireMfa : copy.requireApproval}>
    <Link className="mp-text-link" href={kind === "mfa" ? `/${locale}/account/security?next=${encodeURIComponent(`/${locale}/seller/products`)}` : `/${locale}/seller/apply`}>{kind === "mfa" ? copy.verify : copy.apply}</Link>
  </AccountShell>;
}
