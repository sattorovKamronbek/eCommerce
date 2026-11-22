import { AccountShell, AccountUnavailable, SellerSetupRequired, accountLocale } from "@/components/account/shell";
import { isSellerSchemaMissing } from "@/lib/sellers/schema";
import { requireAccount } from "@/lib/auth/access";
import { sellerDictionaries } from "@/messages/seller";
import { redirect } from "next/navigation";

export default async function SellerApplication({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await accountLocale(params);
  const copy = sellerDictionaries[locale];
  const account = await requireAccount(locale, `/${locale}/seller/apply`);
  if (!account) return <AccountUnavailable locale={locale} />;
  const application = await account.client.from("marketplace_seller_applications").select("status")
    .eq("applicant_id", account.user.id).maybeSingle();
  if (application.error) return isSellerSchemaMissing(application.error) ? <SellerSetupRequired locale={locale} /> : <AccountUnavailable locale={locale} />;
  if (!application.data) redirect(`/${locale}/account`);
  return <AccountShell locale={locale} title={copy.status} intro={copy.historyIntro}>
    <div className="seller-status"><p>{copy[application.data.status]}</p></div>
  </AccountShell>;
}
