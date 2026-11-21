import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountDenied, AccountUnavailable, accountLocale } from "@/components/account/shell";
import { WorkspaceShell } from "@/components/account/workspace";
import { ActionForm } from "@/components/account/action-form";
import { AdminProfileIdentity } from "@/components/account/profile-identity";
import { requireAdmin } from "@/lib/auth/access";
import { loadSellerIntake } from "@/lib/sellers/intake";
import { isUuid } from "@/lib/uuid";
import type { AccessAction } from "@/lib/supabase/database";
import { accountDictionaries } from "@/messages/account";
import { accessDictionaries } from "@/messages/admin-access";
import { orderDictionaries } from "@/messages/orders";
import { changeUserAccess } from "../actions";

export default async function UserAccessPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const locale = await accountLocale(params);
  if (!isUuid(id)) notFound();
  const base = `/${locale}/admin/users`;
  const access = await requireAdmin(locale, `${base}/${id}`);
  if (access.kind === "denied") return <AccountDenied locale={locale} />;
  if (access.kind === "unavailable") return <AccountUnavailable locale={locale} />;
  const [profile, account, audit, intake] = await Promise.all([
    access.client.from("marketplace_profiles").select("display_name").eq("id", id).maybeSingle(),
    access.client.rpc("marketplace_admin_user_access", { p_user_id: id }).maybeSingle(),
    access.client.from("marketplace_user_access_events").select("id, actor_id, action, reason, created_at").eq("target_id", id).order("id", { ascending: false }).limit(20),
    loadSellerIntake(access.client),
  ]);
  if (profile.error || account.error) return <AccountUnavailable locale={locale} />;
  if (!profile.data || !account.data) notFound();

  const copy = accessDictionaries[locale];
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

  return <WorkspaceShell locale={locale} title={profile.data.display_name || common.unnamed} intro={copy.intro} admin active="users" sellerIntake={intake}>
    <Link className="mp-text-link" href={base}>{common.users}</Link>
    <dl className="order-facts order-summary">
      <div><dt>{common.identifier}</dt><dd>{id}</dd></div>
      <div><dt>{copy.role}</dt><dd>{copy[role]}</dd></div>
      <div><dt>{copy.status}</dt><dd>{suspended ? copy.suspended : restricted ? copy.providerRestricted : copy.active}</dd></div>
    </dl>
    {owner && !manageRoles && role !== "owner" ? <p className="order-note">{copy.fresh}</p> : null}
    {actions.length ? <div className="order-actions">{actions.map(action => <ActionForm key={action}
      action={changeUserAccess.bind(null, locale, id, action, role, suspended)} label={copy[action]} errors={feedback.feedback} pendingLabel={feedback.pending}>
      <label>{copy.reason}<input name="reason" required maxLength={1000} /></label>
      {action === "grant_admin" ? <p className="order-note">{copy.verify}</p> : null}
    </ActionForm>)}</div> : null}
    {access.role === "owner" && id !== access.user.id ? <AdminProfileIdentity client={access.client} locale={locale} subject={id} canRequest={!restricted && !suspended} /> : null}
    {audit.error ? <p role="alert">{common.usersUnavailable}</p> : audit.data.length ? <section className="order-summary">
      <h2>{copy.history}</h2>
      <ol className="order-timeline">{audit.data.map(event => <li key={event.id}>
        <p><strong>{copy[event.action]}</strong> · {dates.format(new Date(event.created_at))}</p>
        <p>{event.reason}</p>
      </li>)}</ol>
    </section> : null}
  </WorkspaceShell>;
}
