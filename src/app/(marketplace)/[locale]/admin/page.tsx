import { redirect } from "next/navigation";
import { AccountUnavailable, AccountDenied, accountLocale } from "@/components/account/shell";
import { requireAdmin } from "@/lib/auth/access";

export default async function Admin({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await accountLocale(params);
  const access = await requireAdmin(locale);
  if (access.kind === "unavailable") return <AccountUnavailable locale={locale} />;
  if (access.kind === "denied") return <AccountDenied locale={locale} />;
  redirect(`/${locale}/admin/users`);
}
