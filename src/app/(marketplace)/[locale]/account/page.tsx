import Link from "next/link";
import { KeyRound, UserRound } from "lucide-react";
import { AccountUnavailable, accountLocale } from "@/components/account/shell";
import { WorkspaceShell } from "@/components/account/workspace";
import { AccountForm } from "@/components/account/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { accountDictionaries } from "@/messages/account";
import { requireAccount } from "@/lib/auth/access";
import { logoutAction, updateProfileAction } from "./actions";

export default async function Account({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await accountLocale(params); const copy = accountDictionaries[locale];
  const account = await requireAccount(locale);
  if (!account) return <AccountUnavailable locale={locale} />;
  const [profile, role] = await Promise.all([
    account.client.from("marketplace_profiles").select("id, display_name, preferred_locale, created_at, updated_at").eq("id", account.user.id).maybeSingle(),
    account.client.from("marketplace_user_roles").select("role").eq("user_id", account.user.id).eq("role", "admin").maybeSingle(),
  ]);
  const admin = !!role.data && !role.error;
  return <WorkspaceShell locale={locale} title={copy.profile} intro={copy.profileIntro} active="profile" admin={admin}>
    <section className="profile-summary" aria-label={copy.identity}>
      <div className="profile-avatar"><UserRound aria-hidden="true" /></div>
      <div><p className="profile-name">{profile.data?.display_name || copy.unnamed}</p><p className="account-email">{account.user.email}</p></div>
      <dl><div><dt>{copy.accountType}</dt><dd>{admin ? copy.administrator : copy.customer}</dd></div></dl>
    </section>
    <section className="profile-section">
      <div className="profile-section-heading"><h2>{copy.personalDetails}</h2><p>{copy.emailNote}</p></div>
      {profile.data && !profile.error ? <AccountForm action={updateProfileAction.bind(null, locale)} kind="profile" copy={copy} profile={profile.data} /> : <Alert><AlertDescription>{copy.profileUnavailable}</AlertDescription></Alert>}
    </section>
    <section className="profile-section profile-access">
      <div className="profile-section-heading"><h2><KeyRound aria-hidden="true" />{copy.security}</h2><p>{copy.securityIntro}</p></div>
      <Link className="mp-text-link" href={`/${locale}/account/forgot-password`}>{copy.forgot}</Link>
    </section>
    <div className="profile-signout"><AccountForm action={logoutAction.bind(null, locale)} kind="logout" copy={copy} /></div>
  </WorkspaceShell>;
}
