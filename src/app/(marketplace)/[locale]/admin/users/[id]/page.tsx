import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountDenied, AccountUnavailable, accountLocale } from "@/components/account/shell";
import { WorkspaceShell } from "@/components/account/workspace";
import { ActionForm } from "@/components/account/action-form";
import { AdminProfileIdentity } from "@/components/account/profile-identity";
import { requireAdmin } from "@/lib/auth/access";
import { parseAdminPage } from "@/lib/auth/validation";
import { loadSellerIntake } from "@/lib/sellers/intake";
import { sellerPageRange, sellerPageResults } from "@/lib/sellers/pagination";
import { isUuid } from "@/lib/uuid";
import type { AccessAction } from "@/lib/supabase/database";
import { accountDictionaries } from "@/messages/account";
import { accessDictionaries } from "@/messages/admin-access";
import { activityDictionaries } from "@/messages/admin-activity";
import { localeNames } from "@/messages/marketplace";
import { orderDictionaries } from "@/messages/orders";
import { changeUserAccess } from "../actions";

export default async function UserAccessPage({ params, searchParams }: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ signIns?: string | string[] }>;
}) {
  const { id } = await params;
  const locale = await accountLocale(params);
  if (!isUuid(id)) notFound();
  const base = `/${locale}/admin/users`;
  const access = await requireAdmin(locale, `${base}/${id}`);
  if (access.kind === "denied") return <AccountDenied locale={locale} />;
  if (access.kind === "unavailable") return <AccountUnavailable locale={locale} />;
  const page = parseAdminPage((await searchParams).signIns);
  const range = sellerPageRange(page);
  const [profile, account, audit, intake, overview, signIns] = await Promise.all([
    access.client.from("marketplace_profiles").select("display_name, preferred_locale").eq("id", id).maybeSingle(),
    access.client.rpc("marketplace_admin_user_access", { p_user_id: id }).maybeSingle(),
    access.client.from("marketplace_user_access_events").select("id, actor_id, action, reason, created_at").eq("target_id", id).order("id", { ascending: false }).limit(20),
    loadSellerIntake(access.client),
    access.client.rpc("marketplace_admin_user_overview", { p_user_id: id }).maybeSingle(),
    access.client.from("marketplace_sign_in_events").select("id, signed_in_at").eq("user_id", id)
      .order("signed_in_at", { ascending: false }).order("id", { ascending: false }).range(range.from, range.to),
  ]);
  if (profile.error || account.error) return <AccountUnavailable locale={locale} />;
  if (!profile.data || !account.data) notFound();

  const copy = accessDictionaries[locale];
  const activity = activityDictionaries[locale];
  const common = accountDictionaries[locale];
  const feedback = orderDictionaries[locale];
  const { account_role: role, suspended, provider_restricted: restricted, viewer_is_owner: owner, can_manage_roles: manageRoles } = account.data;
  const actions: AccessAction[] = [];
  if (role === "customer") actions.push(suspended ? "unsuspend" : "suspend");
  if (id !== access.user.id && manageRoles) {
    if (role === "customer" && !suspended && !restricted) actions.push("grant_admin");
    if (role === "admin") actions.push("revoke_admin");
  }
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tashkent" });
  const time = (value: string | null) => value ? <time dateTime={value}>{dates.format(new Date(value))}</time> : activity.unknown;
  const facts = overview.error ? null : overview.data;
  const numbers = new Intl.NumberFormat(locale);
  const currency = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const history = sellerPageResults(signIns.data ?? []);
  const historyPage = (n: number) => `${base}/${id}${n === 1 ? "" : `?signIns=${n}`}#sign-in-history`;
  const orders = `/${locale}/admin/orders`;

  return <WorkspaceShell locale={locale} title={profile.data.display_name || common.unnamed} intro={copy.intro} admin active="users" sellerIntake={intake}>
    <Link className="mp-text-link" href={base}>{common.users}</Link>
    <dl className="order-facts order-summary">
      <div><dt>{common.identifier}</dt><dd>{id}</dd></div>
      <div><dt>{copy.role}</dt><dd>{copy[role]}</dd></div>
      <div><dt>{copy.status}</dt><dd>{suspended ? copy.suspended : restricted ? copy.providerRestricted : copy.active}</dd></div>
      <div><dt>{common.preferredLocale}</dt><dd>{localeNames[profile.data.preferred_locale]}</dd></div>
      {facts && <>
        <div><dt>{common.email}</dt><dd>{facts.email ?? activity.unknown}</dd></div>
        <div><dt>{activity.registered}</dt><dd>{time(facts.registered_at)}</dd></div>
        <div><dt>{activity.authConfirmation}</dt><dd>{time(facts.confirmed_at)}</dd></div>
        <div><dt>{activity.lastSignIn}</dt><dd>{time(facts.last_sign_in_at)}</dd></div>
        <div><dt>{activity.mfa}</dt><dd>{facts.mfa_enabled ? activity.enabled : activity.disabled}</dd></div>
      </>}
    </dl>
    {facts ? <section className="order-summary">
      <h2>{activity.purchases}</h2>
      <dl className="order-facts">
        <div><dt>{activity.completedOrders}</dt><dd>{numbers.format(facts.completed_orders)}</dd></div>
        <div><dt>{activity.purchasedUnits}</dt><dd>{numbers.format(facts.purchased_units)}</dd></div>
        <div><dt>{activity.completedTotal}</dt><dd>{currency.format(facts.completed_total_uzs)} UZS</dd></div>
      </dl>
    </section> : <p role="alert">{activity.profileUnavailable}</p>}
    <div className="seller-review-filters">
      <Link className="mp-text-link" href={`${orders}?buyer=${id}`} prefetch={false}>{activity.buyerOrders}</Link>
      <Link className="mp-text-link" href={`${orders}?seller=${id}`} prefetch={false}>{activity.sellerOrders}</Link>
    </div>
    {owner && !manageRoles && role !== "owner" ? <p className="order-note">{copy.fresh}</p> : null}
    {actions.length ? <div className="order-actions">{actions.map(action => <ActionForm key={action}
      action={changeUserAccess.bind(null, locale, id, action, role, suspended)} label={copy[action]} errors={feedback.feedback} pendingLabel={feedback.pending}>
      <label>{copy.reason}<input name="reason" required maxLength={1000} /></label>
      {action === "grant_admin" ? <p className="order-note">{copy.verify}</p> : null}
    </ActionForm>)}</div> : null}
    {access.role === "owner" && id !== access.user.id ? <AdminProfileIdentity client={access.client} locale={locale} subject={id} canRequest={!restricted && !suspended} /> : null}
    <section className="order-summary" id="sign-in-history">
      <h2>{activity.signIns}</h2>
      {signIns.error ? <p role="alert">{activity.signInsUnavailable}</p> : history.rows.length ? <ol className="order-timeline">
        {history.rows.map(event => <li key={event.id}>{time(event.signed_in_at)}</li>)}
      </ol> : <p>{activity.signInsEmpty}</p>}
      {!signIns.error && (page > 1 || history.hasNext) ? <nav className="account-pagination" aria-label={activity.signIns}>
        {page > 1 ? <Link href={historyPage(page - 1)} rel="prev" prefetch={false}>{common.previous}</Link> : <span aria-disabled="true">{common.previous}</span>}
        <span aria-current="page">{common.page} {page}</span>
        {history.hasNext && page < 10000 ? <Link href={historyPage(page + 1)} rel="next" prefetch={false}>{common.next}</Link> : <span aria-disabled="true">{common.next}</span>}
      </nav> : null}
    </section>
    {audit.error ? <p role="alert">{common.usersUnavailable}</p> : audit.data.length ? <section className="order-summary">
      <h2>{copy.history}</h2>
      <ol className="order-timeline">{audit.data.map(event => <li key={event.id}>
        <p><strong>{copy[event.action]}</strong> · {dates.format(new Date(event.created_at))}</p>
        <p>{event.reason}</p>
      </li>)}</ol>
    </section> : null}
  </WorkspaceShell>;
}
