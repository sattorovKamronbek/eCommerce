import Link from "next/link";
import { ArrowLeft, Store, UserRound, UsersRound } from "lucide-react";
import { accountDictionaries } from "@/messages/account";
import { sellerDictionaries } from "@/messages/seller";
import type { MarketplaceLocale } from "@/messages/marketplace";

export function WorkspaceShell({ locale, title, intro, active, admin, children }: {
  locale: MarketplaceLocale; title: string; intro: string; active: "profile" | "users" | "sellers";
  admin: boolean; children: React.ReactNode;
}) {
  const copy = accountDictionaries[locale];
  return <section className="account-workspace">
    <aside className="workspace-sidebar">
      <div className="workspace-label"><p>{active === "users" || active === "sellers" ? copy.admin : copy.account}</p><span>{copy.workspace}</span></div>
      <nav aria-label={copy.workspaceNavigation}>
        {admin ? <Link href={`/${locale}/admin/users`} aria-current={active === "users" ? "page" : undefined}><UsersRound aria-hidden="true" />{copy.users}</Link> : null}
        {admin ? <Link href={`/${locale}/admin/sellers`} aria-current={active === "sellers" ? "page" : undefined}><Store aria-hidden="true" />{sellerDictionaries[locale].adminLink}</Link> : null}
        <Link href={`/${locale}/account`} aria-current={active === "profile" ? "page" : undefined}><UserRound aria-hidden="true" />{copy.profile}</Link>
        <Link href={`/${locale}/seller/apply`}><Store aria-hidden="true" />{sellerDictionaries[locale].applicationLink}</Link>
      </nav>
      <Link className="workspace-back" href={`/${locale}/marketplace`}><ArrowLeft aria-hidden="true" />{copy.back}</Link>
    </aside>
    <div className="workspace-content">
      <div className="account-heading"><h1>{title}</h1><p>{intro}</p></div>
      {children}
    </div>
  </section>;
}
