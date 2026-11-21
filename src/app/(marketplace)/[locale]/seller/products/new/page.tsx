import { AccountShell, accountLocale } from "@/components/account/shell";
import { SellerAccessNotice } from "@/components/account/seller-access-notice";
import { ListingForm } from "@/components/account/listing-form";
import { requireSeller } from "@/lib/sellers/access";
import { listingDictionaries } from "@/messages/seller-catalog";
import { createListing } from "../actions";

export default async function NewListing({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await accountLocale(params); const copy = listingDictionaries[locale];
  const access = await requireSeller(locale);
  if (access.kind !== "seller") return <SellerAccessNotice locale={locale} kind={access.kind} />;
  return <AccountShell locale={locale} title={copy.newListing} intro={copy.intro}>
    <ListingForm action={createListing.bind(null, locale)} copy={copy} locale={locale} scope={access.scope} submissionId={crypto.randomUUID()} />
  </AccountShell>;
}
