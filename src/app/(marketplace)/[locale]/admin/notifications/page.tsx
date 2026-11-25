import { AdminOrderNotifications, loadAdminOrderNotifications } from "@/components/account/admin-order-notifications";
import { AccountDenied, AccountUnavailable, accountLocale } from "@/components/account/shell";
import { WorkspaceShell } from "@/components/account/workspace";
import { OrderPagination } from "@/components/orders/pagination";
import { requireAdmin } from "@/lib/auth/access";
import { parseAdminPage } from "@/lib/auth/validation";
import { loadSellerIntake } from "@/lib/sellers/intake";
import { sellerPageRange, sellerPageResults } from "@/lib/sellers/pagination";
import { dashboardDictionaries } from "@/messages/admin-dashboard";

export default async function AdminNotifications({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const locale = await accountLocale(params);
  const base = `/${locale}/admin/notifications`;
  const access = await requireAdmin(locale, base);
  if (access.kind === "unavailable") return <AccountUnavailable locale={locale} />;
  if (access.kind === "denied") return <AccountDenied locale={locale} />;

  const page = parseAdminPage((await searchParams).page);
  const [result, intake] = await Promise.all([
    loadAdminOrderNotifications(access.client, access.user.id, sellerPageRange(page)),
    loadSellerIntake(access.client),
  ]);
  const orders = sellerPageResults(result.data ?? []);
  const copy = dashboardDictionaries[locale].notifications;
  return <WorkspaceShell locale={locale} title={copy.title} intro={copy.intro} active="notifications" admin sellerIntake={intake}>
    <AdminOrderNotifications locale={locale} orders={result.error ? null : orders.rows} />
    {!result.error && <OrderPagination locale={locale} page={page} base={base} hasNext={orders.hasNext && page < 10000} label={copy.title} />}
  </WorkspaceShell>;
}
