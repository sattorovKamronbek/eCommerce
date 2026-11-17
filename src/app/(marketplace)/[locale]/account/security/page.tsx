import { AccountShell, AccountUnavailable, accountLocale } from "@/components/account/shell";
import { AccountForm } from "@/components/account/form";
import { accountDictionaries } from "@/messages/account";
import { logoutAction } from "../actions";
import { MfaPanel } from "@/components/account/mfa-panel";
import { requireAccount } from "@/lib/auth/access";
import { safeReturnPath } from "@/lib/auth/validation";
import { mfaDictionaries } from "@/messages/mfa";
import { beginMfaSetup, removeUnverifiedMfa, verifyMfaCode } from "./actions";

export default async function AccountSecurity({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }>;
}) {
  const locale = await accountLocale(params);
  const copy = mfaDictionaries[locale];
  const account = await requireAccount(locale, `/${locale}/account/security`, { allowMfaPending: true });
  const signOut = <div className="profile-signout"><AccountForm action={logoutAction.bind(null, locale)} kind="logout" copy={accountDictionaries[locale]} /></div>;
  if (!account) return <><AccountUnavailable locale={locale} />{signOut}</>;
  const result = await Promise.all([
    account.client.auth.mfa.listFactors(), account.client.auth.mfa.getAuthenticatorAssuranceLevel(), searchParams,
  ]).catch(() => null);
  if (!result) return <><AccountUnavailable locale={locale} />{signOut}</>;
  const [factors, assurance, query] = result;
  if (factors.error || assurance.error) return <><AccountUnavailable locale={locale} />{signOut}</>;
  const totp = factors.data.all.filter(factor => factor.factor_type === "totp");
  return <AccountShell locale={locale} title={copy.title} intro={copy.intro}>
    {signOut}
    <MfaPanel copy={copy} currentLevel={assurance.data.currentLevel} verifiedFactors={totp.filter(factor => factor.status === "verified").map(({ id }) => ({ id }))} unverifiedFactors={totp.filter(factor => factor.status === "unverified").map(({ id }) => ({ id }))} next={safeReturnPath(query.next, locale)} begin={beginMfaSetup.bind(null, locale)} verify={verifyMfaCode.bind(null, locale)} remove={removeUnverifiedMfa.bind(null, locale)} />
  </AccountShell>;
}
