import { notFound } from "next/navigation";
import { AccountShell, AccountUnavailable, SellerSetupRequired, accountLocale } from "@/components/account/shell";
import { SellerAccessNotice } from "@/components/account/seller-access-notice";
import { ListingForm } from "@/components/account/listing-form";
import { isSellerSchemaMissing } from "@/lib/sellers/schema";
import { requireSeller } from "@/lib/sellers/access";
import { listingDictionaries } from "@/messages/seller-catalog";
import { updateListing } from "../actions";

export default async function EditListing({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const all = await params; const locale = await accountLocale(Promise.resolve(all)); const copy = listingDictionaries[locale];
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(all.id)) notFound();
  const access = await requireSeller(locale);
  if (access.kind !== "seller") return <SellerAccessNotice locale={locale} kind={access.kind} />;
  const listing = await access.account.client.from("marketplace_listings").select("*").eq("id", all.id).eq("seller_id", access.account.user.id).maybeSingle();
  if (listing.error) return isSellerSchemaMissing(listing.error) ? <SellerSetupRequired locale={locale} /> : <AccountUnavailable locale={locale} />;
  if (!listing.data || listing.data.moderation_status === "blocked") notFound();
  return <AccountShell locale={locale} title={copy.edit} intro={copy.intro}><ListingForm action={updateListing.bind(null, locale, all.id)} copy={copy} scope={access.scope} listing={listing.data} /></AccountShell>;
}
