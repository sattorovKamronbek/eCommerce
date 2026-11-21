import Link from "next/link";
import { isUuid } from "@/lib/uuid";
import { notFound } from "next/navigation";
import { updateOrder } from "@/app/(marketplace)/[locale]/account/orders/actions";
import { AccountDenied, AccountUnavailable } from "@/components/account/shell";
import { WorkspaceShell } from "@/components/account/workspace";
import { requireAccount, requireAdmin } from "@/lib/auth/access";
import { parseAdminPage } from "@/lib/auth/validation";
import { formatTiyin, orderStatuses, type OrderAction, type OrderRole, type OrderStatus } from "@/lib/orders/model";
import { sellerPageRange, sellerPageResults } from "@/lib/sellers/pagination";
import { loadSellerIntake } from "@/lib/sellers/intake";
import type { DirectOrder, DirectOrderEvent } from "@/lib/supabase/database";
import { accountDictionaries } from "@/messages/account";
import { listingDictionaries } from "@/messages/seller-catalog";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { orderDictionaries, type OrderMessages } from "@/messages/orders";
import { ActionForm } from "@/components/account/action-form";

const orderBase = (locale: MarketplaceLocale, admin: boolean) => `/${locale}/${admin ? "admin" : "account"}/orders`;
const ownOrdersFilter = (userId: string) => `buyer_id.eq.${userId},seller_id.eq.${userId}`;

async function loadAccess(locale: MarketplaceLocale, url: string, admin: boolean) {
  if (admin) return requireAdmin(locale, url);
  return requireAccount(locale, url);
}

function OrderPagination({ locale, page, search, base, hasNext, label }: {
  locale: MarketplaceLocale; page: number; search: URLSearchParams; base: string; hasNext: boolean; label: string;
}) {
  const copy = accountDictionaries[locale];
  const href = (n: number) => {
    const query = new URLSearchParams(search);
    if (n > 1) query.set("page", String(n));
    return `${base}${query.size ? `?${query}` : ""}`;
  };
  if (page === 1 && !hasNext) return null;
  return <nav className="account-pagination" aria-label={label}>
    {page > 1 ? <Link href={href(page - 1)} rel="prev">{copy.previous}</Link> : <span aria-disabled="true">{copy.previous}</span>}
    <span aria-current="page">{copy.page} {page}</span>
    {hasNext ? <Link href={href(page + 1)} rel="next">{copy.next}</Link> : <span aria-disabled="true">{copy.next}</span>}
  </nav>;
}

export async function OrdersList({ locale, admin, search }: {
  locale: MarketplaceLocale; admin: boolean; search: Record<string, string | string[] | undefined>;
}) {
  const base = orderBase(locale, admin);
  const access = await loadAccess(locale, base, admin);
  if (access && "kind" in access && access.kind === "denied") return <AccountDenied locale={locale} />;
  if (!access || !("client" in access)) return <AccountUnavailable locale={locale} />;
  const copy = orderDictionaries[locale];
  const category = listingDictionaries[locale];
  const page = parseAdminPage(search.page);
  const range = sellerPageRange(page);
  const status = typeof search.status === "string" && orderStatuses.includes(search.status as OrderStatus) ? search.status as OrderStatus : "";
  let query = access.client.from("marketplace_orders").select("id, title, ecosystem, buyer_id, status, total_tiyin, created_at")
    .order("created_at", { ascending: false }).order("id", { ascending: false }).range(range.from, range.to);
  if (!admin) query = query.or(ownOrdersFilter(access.user.id));
  if (status) query = query.eq("status", status);
  const [result, intake] = await Promise.all([query, loadSellerIntake(access.client)]);
  const orders = sellerPageResults(result.data ?? []);
  return <WorkspaceShell locale={locale} title={admin ? copy.adminOrders : copy.orders}
    intro={admin ? copy.adminIntro : copy.orderIntro} active={admin ? "adminOrders" : "orders"} admin={admin} sellerIntake={intake}>
    {result.error ? <p role="alert">{copy.unavailable}</p> : <>
      <form action={base} method="get" className="real-filters">
        <label>{copy.filter}<select name="status" defaultValue={status}>
          <option value="">{copy.allStatuses}</option>
          {orderStatuses.map(value => <option key={value} value={value}>{copy.statuses[value]}</option>)}
        </select></label>
        <button>{copy.filter}</button>
      </form>
      {orders.rows.length ? <div className="seller-reviews">
        {orders.rows.map(order => <article className="seller-review" key={order.id}>
          <h2><Link href={`${base}/${order.id}`}>{order.title}</Link></h2>
          <p>{category[order.ecosystem]} · {copy.statuses[order.status]}{admin ? "" : ` · ${order.buyer_id === access.user.id ? copy.buyer : copy.seller}`}</p>
          <p>{formatTiyin(order.total_tiyin, locale)} · {dateTime(order.created_at, locale)}</p>
        </article>)}
      </div> : <p>{copy.empty}</p>}
      <OrderPagination locale={locale} page={page} base={base} search={new URLSearchParams(status ? { status } : {})}
        hasNext={orders.hasNext} label={admin ? copy.adminOrders : copy.orders} />
    </>}
  </WorkspaceShell>;
}

const dateTime = (date: string, locale: MarketplaceLocale) => new Intl.DateTimeFormat(locale, {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tashkent",
}).format(new Date(date));

function reservationExpired(order: DirectOrder) {
  return (order.status === "reserved" || order.status === "cancelled")
    && Date.parse(order.expires_at) <= Date.now() && !order.payment_reference;
}

function availableActions(order: DirectOrder, role: OrderRole): OrderAction[] {
  const { status } = order;
  if (role === "admin") {
    if (status === "reported") return ["approve", "reject"];
    if (status === "disputed") {
      if (order.stock_state === "held") return ["resume", "cancel_release", "cancel_keep"];
      return order.stock_state === "released" ? ["cancel_keep"] : ["resume", "cancel_keep"];
    }
    return [];
  }
  if (status === "reserved") return reservationExpired(order) ? ["report_late"] : ["report"];
  if (status === "cancelled" && order.stock_state === "released" && !order.payment_reference) return ["report_late"];
  if (status === "approved" && (role === "buyer" ? !order.buyer_confirmed_at : !order.seller_confirmed_at)) return ["confirm", "dispute"];
  if (status === "reported" || status === "approved" || status === "completed") return ["dispute"];
  return [];
}

function OrderActionForm({ order, action, copy, locale, admin }: {
  order: DirectOrder; action: OrderAction; copy: OrderMessages; locale: MarketplaceLocale; admin: boolean;
}) {
  return <ActionForm action={updateOrder.bind(null, locale, order.id, order.version, admin, action)}
    label={copy.actions[action]} errors={copy.feedback} pendingLabel={copy.pending}>
    {action === "report" || action === "report_late" ? <>
      <h3>{copy.reportHeading}</h3>
      <label>{copy.reference}<input name="reference" required maxLength={120} /></label>
      <label>{copy.paidAmount}<input name="amount" type="text" inputMode="decimal" required maxLength={17} /></label>
      <label>{copy.paidAt}<input name="paidAt" type="datetime-local" required /></label>
    </> : action !== "confirm" ? <>
      <label>{copy.reason}<input name="reason" required maxLength={1000} /></label>
      <p className="order-note">{copy.reasonNote}</p>
    </> : null}
  </ActionForm>;
}

function OrderDetails({ order, locale, copy }: { order: DirectOrder; locale: MarketplaceLocale; copy: OrderMessages }) {
  const listing = listingDictionaries[locale];
  const expired = reservationExpired(order);
  const paymentTime = order.reported_paid_at ? dateTime(order.reported_paid_at, locale) : null;
  const approvalTime = order.payment_approved_at ? dateTime(order.payment_approved_at, locale) : null;
  const confirmation = (date: string | null) => date ? `${copy.present} · ${dateTime(date, locale)}` : copy.waiting;
  return <>
    <section className="order-summary">
      <p>{listing[order.ecosystem]} · {expired ? copy.actions.expired : copy.statuses[order.status]}</p>
      <p className="real-description">{order.description}</p>
      {order.category || order.variant ? <p>{[order.category, order.variant].filter(Boolean).join(" · ")}</p> : null}
      <dl className="order-facts">
        <div><dt>{copy.unitPrice}</dt><dd>{formatTiyin(order.unit_price_tiyin, locale)}</dd></div>
        <div><dt>{copy.quantity}</dt><dd>{order.quantity}</dd></div>
        {order.ecosystem === "fashion" ? <div><dt>{copy.shipping}</dt><dd>{formatTiyin(order.shipping_tiyin, locale)}</dd></div> : null}
        <div><dt>{copy.total}</dt><dd><strong>{formatTiyin(order.total_tiyin, locale)}</strong></dd></div>
        {order.cs2_asset_id ? <div><dt>{copy.assetId}</dt><dd>{order.cs2_asset_id}</dd></div> : null}
      </dl>
    </section>
    <section className="order-summary">
      <h2>{copy.payment}</h2>
      {expired ? <p role="status">{copy.expiredNotice}</p> : order.status === "reserved" ? <p className="order-note">{copy.directNote}</p> : null}
      <dl className="order-facts">
        {!expired ? <div><dt>{copy.sellerContact}</dt><dd><a href={`tel:${order.seller_phone}`}>{order.seller_phone}</a></dd></div> : null}
        {order.status === "reserved" && !expired ? <div><dt>{copy.deadline}</dt><dd>{dateTime(order.expires_at, locale)}</dd></div> : null}
        {order.payment_reference ? <div><dt>{copy.reference}</dt><dd>{order.payment_reference}</dd></div> : null}
        {order.reported_amount_tiyin ? <div><dt>{copy.paidAmount}</dt><dd>{formatTiyin(order.reported_amount_tiyin, locale)}</dd></div> : null}
        {paymentTime ? <div><dt>{copy.paidAt}</dt><dd>{paymentTime}</dd></div> : null}
        {order.reported_by ? <div><dt>{copy.reportedBy}</dt><dd>{order.reported_by === order.buyer_id ? copy.buyer : copy.seller}</dd></div> : null}
        {approvalTime ? <div><dt>{copy.reviewAt}</dt><dd>{approvalTime}</dd></div> : null}
      </dl>
      {order.reported_amount_tiyin && order.reported_amount_tiyin !== order.total_tiyin ? <p role="note">{copy.mismatch}</p> : null}
    </section>
    {order.ecosystem === "fashion" ? <section className="order-summary">
      <h2>{copy.delivery}</h2>
      <dl className="order-facts">
        <div><dt>{copy.name}</dt><dd>{order.delivery_name}</dd></div>
        <div><dt>{copy.phone}</dt><dd>{order.delivery_phone}</dd></div>
        <div><dt>{copy.address}</dt><dd>{order.delivery_address}</dd></div>
      </dl>
    </section> : null}
    <section className="order-summary">
      <h2>{copy.confirmations}</h2>
      <dl className="order-facts">
        <div><dt>{copy.seller}</dt><dd>{confirmation(order.seller_confirmed_at)}</dd></div>
        <div><dt>{copy.buyer}</dt><dd>{confirmation(order.buyer_confirmed_at)}</dd></div>
      </dl>
    </section>
  </>;
}

function OrderHistory({ events, locale, copy }: { events: DirectOrderEvent[]; locale: MarketplaceLocale; copy: OrderMessages }) {
  return <section className="order-summary">
    <h2>{copy.timeline}</h2>
    <ol className="order-timeline">
      {events.map(event => <li key={event.id}>
        <p><strong>{copy.actions[event.action]}</strong> · {copy[event.actor_role]} · {dateTime(event.created_at, locale)}</p>
        {event.reason ? <p>{event.reason}</p> : null}
      </li>)}
    </ol>
  </section>;
}

export async function OrderDetail({ locale, admin, id, search }: {
  locale: MarketplaceLocale; admin: boolean; id: string; search: Record<string, string | string[] | undefined>;
}) {
  if (!isUuid(id)) notFound();
  const base = orderBase(locale, admin);
  const destination = `${base}/${id}`;
  const access = await loadAccess(locale, destination, admin);
  if (access && "kind" in access && access.kind === "denied") return <AccountDenied locale={locale} />;
  if (!access || !("client" in access)) return <AccountUnavailable locale={locale} />;
  const copy = orderDictionaries[locale];
  let query = access.client.from("marketplace_orders").select("*").eq("id", id);
  if (!admin) query = query.or(ownOrdersFilter(access.user.id));
  const page = parseAdminPage(search.page);
  const range = sellerPageRange(page);
  const [result, log, intake] = await Promise.all([
    query.maybeSingle(),
    access.client.from("marketplace_order_events").select("*").eq("order_id", id)
      .order("id", { ascending: false }).range(range.from, range.to),
    loadSellerIntake(access.client),
  ]);
  if (result.error) return <AccountUnavailable locale={locale} />;
  if (!result.data) notFound();

  const order = result.data;
  const viewer = order.buyer_id === access.user.id ? "buyer" : order.seller_id === access.user.id ? "seller" : "admin";
  const actions = admin && viewer !== "admin" ? [] : availableActions(order, viewer);
  const history = sellerPageResults(log.data ?? []);

  return <WorkspaceShell locale={locale} title={order.title} intro={order.id} active={admin ? "adminOrders" : "orders"} admin={admin} sellerIntake={intake}>
    <Link className="mp-text-link" href={base}>{copy.back}</Link>
    <OrderDetails order={order} locale={locale} copy={copy} />
    {order.status === "disputed" || (order.status === "cancelled" && order.payment_reference) ? <p className="order-note">{copy.noRefund}</p> : null}
    {actions.length ? <div className="order-actions">{actions.map(action => <OrderActionForm key={action} order={order}
      action={action} copy={copy} locale={locale} admin={admin} />)}</div> : null}
    {log.error ? <p role="alert">{copy.unavailable}</p> : <>
      <OrderHistory events={history.rows} locale={locale} copy={copy} />
      <OrderPagination locale={locale} page={page} base={destination} search={new URLSearchParams()} hasNext={history.hasNext} label={copy.timeline} />
    </>}
  </WorkspaceShell>;
}
