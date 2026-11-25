import Link from "next/link";
import { ArrowLeft, Bell, LayoutDashboard, Package, Store, UserRound, UsersRound } from "lucide-react";
import { accountDictionaries } from "@/messages/account";
import { dashboardDictionaries } from "@/messages/admin-dashboard";
import { sellerDictionaries } from "@/messages/seller";
import { listingDictionaries } from "@/messages/seller-catalog";
import { orderDictionaries } from "@/messages/orders";
import type { MarketplaceLocale } from "@/messages/marketplace";
import type { SellerIntakeStatus } from "@/lib/supabase/database";

export function WorkspaceShell({ locale, title, intro, active, admin, catalogSales, sellerIntake, children }: {
  locale: MarketplaceLocale; title: string; intro: string; active: "profile" | "dashboard" | "notifications" | "users" | "sellers" | "products" | "moderation" | "orders" | "adminOrders";
  admin: boolean; catalogSales?: boolean; sellerIntake?: SellerIntakeStatus | null; children: React.ReactNode;
}) {
  const copy = accountDictionaries[locale];
  const sellerCopy = sellerDictionaries[locale];
  const accountPage = active === "profile" || active === "products" || active === "orders";
  return <section className="account-workspace">
    <aside className="workspace-sidebar">
      <div className="workspace-label"><p>{accountPage ? copy.account : copy.admin}</p><span>{copy.workspace}</span></div>
      <nav aria-label={copy.workspaceNavigation}>
        {admin ? <Link href={`/${locale}/admin`} aria-current={active === "dashboard" ? "page" : undefined}><LayoutDashboard aria-hidden="true" />{dashboardDictionaries[locale].navigation}</Link> : null}
        {admin ? <Link href={`/${locale}/admin/notifications`} prefetch={false} aria-current={active === "notifications" ? "page" : undefined}><Bell aria-hidden="true" />{dashboardDictionaries[locale].notifications.title}</Link> : null}
        {admin ? <Link href={`/${locale}/admin/users`} aria-current={active === "users" ? "page" : undefined}><UsersRound aria-hidden="true" />{copy.users}</Link> : null}
        {admin ? <Link href={`/${locale}/admin/sellers`} aria-current={active === "sellers" ? "page" : undefined}><Store aria-hidden="true" />{sellerDictionaries[locale].adminLink}</Link> : null}
        {admin ? <Link href={`/${locale}/admin/listings`} aria-current={active === "moderation" ? "page" : undefined}><Store aria-hidden="true" />{listingDictionaries[locale].adminListings}</Link> : null}
        {admin ? <Link href={`/${locale}/admin/orders`} aria-current={active === "adminOrders" ? "page" : undefined}><Package aria-hidden="true" />{orderDictionaries[locale].adminOrders}</Link> : null}
        <Link href={`/${locale}/account/orders`} aria-current={active === "orders" ? "page" : undefined}><Package aria-hidden="true" />{orderDictionaries[locale].orders}</Link>
        <Link href={`/${locale}/account`} aria-current={active === "profile" ? "page" : undefined}><UserRound aria-hidden="true" />{copy.profile}</Link>
        {sellerIntake?.has_application && <Link href={`/${locale}/seller/apply`} prefetch={false}><Store aria-hidden="true" />
          {sellerCopy.status}
        </Link>}
        {(admin || catalogSales || active === "products") && <Link href={`/${locale}/seller/products`} aria-current={active === "products" ? "page" : undefined}><Store aria-hidden="true" />{listingDictionaries[locale].products}</Link>}
      </nav>
      <Link className="workspace-back" href={`/${locale}/marketplace`}><ArrowLeft aria-hidden="true" />{copy.back}</Link>
    </aside>
    <div className="workspace-content">
      <div className="account-heading"><h1>{title}</h1><p>{intro}</p></div>
      {children}
    </div>
  </section>;
}
