import Link from "next/link";
import { AccountShell, AccountUnavailable, AccountNotice, accountLocale } from "@/components/account/shell";
import { AccountForm } from "@/components/account/form";
import { accountDictionaries } from "@/messages/account";
import { getAuthConfig } from "@/lib/supabase/config";
import { readEmailFlow } from "@/lib/auth/flow";
import { confirmEmailAction } from "../actions";

export default async function ConfirmEmail({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await accountLocale(params); const copy = accountDictionaries[locale];
  if (!getAuthConfig()) return <AccountUnavailable locale={locale} />;
  const flow = await readEmailFlow(locale);
  return <AccountShell locale={locale} title={copy.confirm} intro={copy.confirmIntro}>
    {flow?.type === "signup" ? <AccountForm action={confirmEmailAction.bind(null, locale)} kind="confirm" copy={copy} /> : <AccountNotice locale={locale} message="invalidLink" />}
    <Link className="mp-text-link" href={`/${locale}/account/resend-confirmation`}>{copy.resendLink}</Link>
  </AccountShell>;
}
