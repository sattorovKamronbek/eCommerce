import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatOrderDateTime } from "@/lib/orders/model";
import type { Database, DirectOrder } from "@/lib/supabase/database";
import { dashboardDictionaries } from "@/messages/admin-dashboard";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { orderDictionaries } from "@/messages/orders";
import { listingDictionaries } from "@/messages/seller-catalog";

type OrderNotification = Pick<DirectOrder, "id" | "title" | "ecosystem" | "status" | "updated_at">;

export function loadAdminOrderNotifications(client: SupabaseClient<Database>, viewerId: string, range: { from: number; to: number }) {
  // The order workflow assigns review to an administrator outside the transaction.
  return client.from("marketplace_orders")
    .select("id, title, ecosystem, status, updated_at")
    .in("status", ["reported", "disputed"])
    .neq("buyer_id", viewerId).neq("seller_id", viewerId)
    .order("updated_at", { ascending: false }).order("id", { ascending: false })
    .range(range.from, range.to).retry(false);
}

export function AdminOrderNotifications({ locale, orders }: { locale: MarketplaceLocale; orders: OrderNotification[] | null }) {
  const copy = dashboardDictionaries[locale].notifications;
  if (!orders) return <p role="alert">{copy.unavailable}</p>;
  if (!orders.length) return <p>{copy.empty}</p>;

  const listings = listingDictionaries[locale];
  const statuses = orderDictionaries[locale].statuses;
  return <ul className="seller-reviews admin-order-notifications" role="list">
    {orders.map(order => <li className="seller-review" key={order.id}>
      <Link className="mp-text-link" href={`/${locale}/admin/orders/${order.id}`} prefetch={false}>{order.title}</Link>
      <p>{listings[order.ecosystem]} · {statuses[order.status]} · <time dateTime={order.updated_at}>{formatOrderDateTime(order.updated_at, locale)}</time></p>
    </li>)}
  </ul>;
}
