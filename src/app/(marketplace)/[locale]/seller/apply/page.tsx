import { AccountShell, AccountUnavailable, SellerSetupRequired, accountLocale } from "@/components/account/shell";
import { isSellerSchemaMissing } from "@/lib/sellers/schema";
import { requireAccount } from "@/lib/auth/access";
import { sellerDictionaries } from "@/messages/seller";
import { listingDictionaries } from "@/messages/seller-catalog";
import { SellerForm } from "@/components/account/seller-form";
import { SellerChallenge } from "@/components/account/seller-challenge";
import Link from "next/link";
import { applyAsSeller, createSellerChallenge } from "../actions";

export default async function SellerApplication({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await accountLocale(params);
  const copy = sellerDictionaries[locale];
  const account = await requireAccount(locale, `/${locale}/seller/apply`);
  if (!account) return <AccountUnavailable locale={locale} />;
  const [application, grant] = await Promise.all([
    account.client.from("marketplace_seller_applications").select("*").eq("applicant_id", account.user.id).maybeSingle(),
    account.client.from("marketplace_seller_grants").select("application_revision").eq("seller_id", account.user.id).maybeSingle(),
  ]);
  if (application.error || grant.error) return isSellerSchemaMissing(application.error) || isSellerSchemaMissing(grant.error) ? <SellerSetupRequired locale={locale} /> : <AccountUnavailable locale={locale} />;
  const verified = application.data?.status === "approved" && application.data.revision === grant.data?.application_revision;
  return <AccountShell locale={locale} title={copy.title} intro={copy.intro}>
    {application.data ? <div className="seller-status"><h2>{copy.status}</h2><p>{copy[application.data.status]}</p>{application.data.status === "approved" ? <p>{verified ? copy.authorizedNote : copy.approvedNote}</p> : null}{verified ? <Link className="mp-text-link" href={`/${locale}/seller/products`}>{listingDictionaries[locale].listingLink}</Link> : null}</div> : null}
    {application.data?.status === "pending" ? <><Link className="mp-text-link" href={`/${locale}/account/security?next=${encodeURIComponent(`/${locale}/seller/apply`)}`}>{copy.securityLink}</Link><SellerChallenge action={createSellerChallenge.bind(null, locale)} copy={copy} /></> : null}
    {application.data?.status !== "approved" ? <SellerForm action={applyAsSeller.bind(null, locale)} copy={copy} application={application.data ?? undefined} /> : null}
  </AccountShell>;
}
