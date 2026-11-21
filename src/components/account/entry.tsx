import Link from "next/link";
import { AccountShell, AccountUnavailable, AccountNotice, accountLocale } from "./shell";
import { AccountForm } from "./form";
import { accountDictionaries } from "@/messages/account";
import { getAuthConfig } from "@/lib/supabase/config";
import { safeReturnPath } from "@/lib/auth/validation";
import { loginAction, signupAction, recoveryAction, resendConfirmationAction } from "@/app/(marketplace)/[locale]/account/actions";

export type AccountPageProps = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function AccountEntry({ params, searchParams, mode }: AccountPageProps & { mode: "login" | "register" | "forgot" | "resend" }) {
  const locale = await accountLocale(params);
  if (!getAuthConfig()) return <AccountUnavailable locale={locale} />;
  const copy = accountDictionaries[locale];
  const query = await searchParams;
  const next = safeReturnPath(query.next, locale);
  const nextQuery = next === `/${locale}/account` ? "" : `?next=${encodeURIComponent(next)}`;
  const action = { login: loginAction, register: signupAction, forgot: recoveryAction, resend: resendConfirmationAction }[mode].bind(null, locale);
  const title = { login: copy.login, register: copy.register, forgot: copy.forgot, resend: copy.resend }[mode];
  return <AccountShell locale={locale} title={title} intro={mode === "resend" ? copy.resendIntro : copy.intro} presentation={mode === "login" || mode === "register" ? "entry" : "compact"}>
    {query.notice === "invalidLink" || query.notice === "passwordUpdated" ? <AccountNotice locale={locale} message={query.notice} /> : null}
    <AccountForm action={action} kind={mode} copy={copy} next={mode === "login" || mode === "register" ? next : undefined} />
    <nav className="account-links" aria-label={copy.account}>
      {mode !== "login" ? <Link href={`/${locale}/account/login${nextQuery}`}>{copy.loginLink}</Link> : null}
      {mode !== "register" ? <Link href={`/${locale}/account/register${nextQuery}`}>{copy.registerLink}</Link> : null}
      {mode !== "forgot" ? <Link href={`/${locale}/account/forgot-password`}>{copy.forgot}</Link> : null}
      {mode !== "resend" ? <Link href={`/${locale}/account/resend-confirmation`}>{copy.resendLink}</Link> : null}
    </nav>
  </AccountShell>;
}
