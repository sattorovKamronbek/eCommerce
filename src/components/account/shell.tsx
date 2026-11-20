import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { accountDictionaries } from "@/messages/account";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";
import { Alert, AlertDescription } from "@/components/ui/alert";

export async function accountLocale(params: Promise<{ locale: string }>): Promise<MarketplaceLocale> {
  const { locale } = await params;
  if (!isMarketplaceLocale(locale)) notFound();
  return locale;
}
export function AccountShell({ locale, title, intro, children, presentation = "compact" }: {
  locale: MarketplaceLocale; title: string; intro?: string; children?: React.ReactNode; presentation?: "compact" | "entry";
}) {
  const copy = accountDictionaries[locale];
  const panel = <div className="account-panel">
    <div className="account-heading"><h1>{title}</h1>{intro ? <p>{intro}</p> : null}</div>
    {children}
  </div>;
  return <section className={`account-shell${presentation === "entry" ? " account-entry" : ""}`}>
    <Link className="mp-text-link" href={`/${locale}/marketplace`}><ArrowLeft aria-hidden="true" />{copy.back}</Link>
    {presentation === "entry" ? <div className="account-entry-grid">
      <aside className="account-brand">
        <div><p className="account-brand-title">{copy.brandTitle}</p><p>{copy.brandIntro}</p></div>
        <div className="account-brand-images" aria-hidden="true">
          <div><Image src="/images/marketplace/rifle.png" alt="" fill sizes="(min-width: 900px) 480px, 1px" /></div>
          <div><Image src="/images/marketplace/overshirt.png" alt="" fill sizes="(min-width: 900px) 480px, 1px" /></div>
        </div>
        <p className="account-brand-caption">{copy.illustrations}</p>
      </aside>
      {panel}
    </div> : panel}
  </section>;
}
export function AccountUnavailable({ locale }: { locale: MarketplaceLocale }) {
  const copy = accountDictionaries[locale];
  return <AccountShell locale={locale} title={copy.unavailableTitle} intro={copy.unavailableBody} />;
}
export function SellerSetupRequired({ locale, admin = false }: { locale: MarketplaceLocale; admin?: boolean }) {
  const copy = accountDictionaries[locale];
  return <AccountShell locale={locale} title={copy.sellerSetupTitle} intro={admin ? copy.sellerSetupAdminBody : copy.sellerSetupBody} />;
}
export function AccountDenied({ locale }: { locale: MarketplaceLocale }) {
  const copy = accountDictionaries[locale];
  return <AccountShell locale={locale} title={copy.deniedTitle} intro={copy.deniedBody}>
    <Link className="mp-text-link" href={`/${locale}/account`}>{copy.accountLink}</Link>
  </AccountShell>;
}
export function AccountNotice({ locale, message }: { locale: MarketplaceLocale; message: "invalidLink" | "passwordUpdated" }) {
  return <Alert><AlertDescription>{accountDictionaries[locale].feedback[message]}</AlertDescription></Alert>;
}
