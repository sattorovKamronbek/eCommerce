import Link from "next/link";
import { ArrowRight, CircleCheck, ClipboardList, Package, ReceiptText, TriangleAlert, UsersRound } from "lucide-react";
import { AdminOrderNotifications, loadAdminOrderNotifications } from "@/components/account/admin-order-notifications";
import { AccountUnavailable, AccountDenied, accountLocale } from "@/components/account/shell";
import { WorkspaceShell } from "@/components/account/workspace";
import { requireAdmin } from "@/lib/auth/access";
import { loadSellerIntake } from "@/lib/sellers/intake";
import { dashboardDictionaries } from "@/messages/admin-dashboard";

const sections = [
  { key: "users", path: "/users", icon: UsersRound },
  { key: "listings", path: "/listings", icon: Package },
  { key: "orders", path: "/orders", icon: ClipboardList },
  { key: "payments", path: "/orders?status=reported", icon: ReceiptText },
  { key: "disputes", path: "/orders?status=disputed", icon: TriangleAlert },
  { key: "completed", path: "/orders?status=completed", icon: CircleCheck },
] as const;

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await accountLocale(params);
  const base = `/${locale}/admin`;
  const access = await requireAdmin(locale, base);
  if (access.kind === "unavailable") return <AccountUnavailable locale={locale} />;
  if (access.kind === "denied") return <AccountDenied locale={locale} />;

  const copy = dashboardDictionaries[locale];
  const owner = access.role === "owner";
  const [intake, overview, notifications] = await Promise.all([
    loadSellerIntake(access.client),
    access.client.rpc("marketplace_admin_dashboard", {}).maybeSingle(),
    loadAdminOrderNotifications(access.client, access.user.id, { from: 0, to: 2 }),
  ]);
  const statistics = overview.error ? null : overview.data;
  const numbers = new Intl.NumberFormat(locale);

  return <WorkspaceShell locale={locale} title={owner ? copy.ownerTitle : copy.adminTitle} intro={copy.intro} active="dashboard" admin sellerIntake={intake}>
    <section className="order-summary" aria-labelledby="admin-notifications-title">
      <h2 id="admin-notifications-title">{copy.notifications.title}</h2>
      <AdminOrderNotifications locale={locale} orders={notifications.data} />
      <Link className="mp-text-link" href={`${base}/notifications`} prefetch={false}>{copy.notifications.all}</Link>
    </section>
    <section className="order-summary">
      <h2 id="admin-sales-title">{copy.sales}</h2>
      <nav className="seller-review-filters" aria-labelledby="admin-sales-title">
        <Link href={`${base}/orders?ecosystem=cs2`} prefetch={false}>{copy.cs2Orders}</Link>
        <Link href={`${base}/orders?ecosystem=fashion`} prefetch={false}>{copy.fashionOrders}</Link>
      </nav>
      {statistics ? <dl className="order-facts">
        <div><dt>{copy.cs2Reservations}</dt><dd>{statistics.cs2_reservations ? copy.open : copy.closed}</dd></div>
        <div><dt>{copy.fashionReservations}</dt><dd>{statistics.fashion_reservations ? copy.open : copy.closed}</dd></div>
      </dl> : <p role="alert">{copy.unavailable}</p>}
    </section>
    <ul className="admin-dashboard" role="list">
      {sections.map(({ key, path, icon: Icon }) => <li key={key}>
        <Link href={`${base}${path}`} prefetch={false} className="admin-dashboard-link">
          <Icon aria-hidden="true" className="admin-dashboard-icon" />
          <h2>{copy[key].title}</h2>
          {statistics ? <strong className="admin-dashboard-count">{numbers.format(statistics[key])}</strong> : null}
          <p>{key === "users" && owner ? copy.ownerUsers : copy[key].description}</p>
          <ArrowRight aria-hidden="true" className="admin-dashboard-arrow" />
        </Link>
      </li>)}
    </ul>
  </WorkspaceShell>;
}
