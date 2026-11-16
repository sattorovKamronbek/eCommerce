import { AccountShell, AccountUnavailable, accountLocale } from "@/components/account/shell";
import { requireAccount } from "@/lib/auth/access";
import { sellerDictionaries } from "@/messages/seller";
import { SellerForm } from "@/components/account/seller-form";
import { applyAsSeller } from "../actions";

export default async function SellerApplication({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await accountLocale(params);
  const copy = sellerDictionaries[locale];
  const account = await requireAccount(locale, `/${locale}/seller/apply`);
  if (!account) return <AccountUnavailable locale={locale} />;
  const application = await account.client.from("marketplace_seller_applications").select("*").eq("applicant_id", account.user.id).maybeSingle();
  if (application.error) return <AccountUnavailable locale={locale} />;
  return <AccountShell locale={locale} title={copy.title} intro={copy.intro}>
    {application.data ? <div className="seller-status"><h2>{copy.status}</h2><p>{copy[application.data.status]}</p>{application.data.status === "approved" ? <p>{copy.approvedNote}</p> : null}</div> : null}
    {application.data?.status !== "approved" ? <SellerForm action={applyAsSeller.bind(null, locale)} copy={copy} application={application.data ?? undefined} /> : null}
  </AccountShell>;
}
