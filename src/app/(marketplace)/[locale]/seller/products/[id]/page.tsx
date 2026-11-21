import { notFound } from "next/navigation";
import { AccountShell, AccountUnavailable, SellerSetupRequired, accountLocale } from "@/components/account/shell";
import { SellerAccessNotice } from "@/components/account/seller-access-notice";
import { ActionForm } from "@/components/account/action-form";
import { orderDictionaries } from "@/messages/orders";
import { ListingForm } from "@/components/account/listing-form";
import { isSellerSchemaMissing } from "@/lib/sellers/schema";
import { requireSeller } from "@/lib/sellers/access";
import { listingDictionaries } from "@/messages/seller-catalog";
import { updateCs2Listing, updateListing } from "../actions";
import { saveCheckoutTerms } from "../checkout-actions";

export default async function EditListing({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const all = await params; const locale = await accountLocale(Promise.resolve(all)); const copy = listingDictionaries[locale];
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(all.id)) notFound();
  const access = await requireSeller(locale);
  if (access.kind !== "seller") return <SellerAccessNotice locale={locale} kind={access.kind} />;
  const listing = await access.account.client.from("marketplace_listings").select("*").eq("id", all.id).eq("seller_id", access.account.user.id).maybeSingle();
  if (listing.error) return isSellerSchemaMissing(listing.error) ? <SellerSetupRequired locale={locale} /> : <AccountUnavailable locale={locale} />;
  if (!listing.data || listing.data.moderation_status === "blocked") notFound();
  const item = listing.data;
  const update = item.cs2_group_id ? updateCs2Listing : updateListing;
  const orders = orderDictionaries[locale];
  const terms = await access.account.client.from("marketplace_checkout_terms").select("*").eq("listing_id", item.id).maybeSingle();
  return <AccountShell locale={locale} title={copy.edit} intro={copy.intro}>
    <ListingForm key={item.updated_at} action={update.bind(null, locale, item.id, item.updated_at)} copy={copy} locale={locale} scope={access.scope} listing={item} />
    {item.state !== "archived" ? <section className="order-summary">
      <h2>{orders.terms}</h2>
      {terms.error ? <p role="alert">{orders.unavailable}</p> : <>
        <p>{orders.termsIntro}</p>
        <ActionForm action={saveCheckoutTerms.bind(null, locale, item.id, item.ecosystem)}
          label={orders.saveTerms} errors={orders.feedback} pendingLabel={orders.pending} savedLabel={orders.saved}>
          <label>{orders.sellerContact}<input name="phone" type="tel" required maxLength={16} placeholder="+998901234567" defaultValue={terms.data?.seller_phone} /></label>
          {item.ecosystem === "fashion" ? <label>{orders.feeInput}<input name="shipping" inputMode="decimal" required maxLength={17}
            defaultValue={terms.data ? (terms.data.shipping_tiyin / 100).toFixed(2) : "0"} /></label> : <>
            <label>{orders.assetId}<input name="asset" inputMode="numeric" required maxLength={20} defaultValue={terms.data?.cs2_asset_id ?? undefined} readOnly={!!terms.data?.cs2_asset_id} /></label>
            <p className="order-note">{orders.assetNote}</p>
          </>}
        </ActionForm>
      </>}
    </section> : null}
  </AccountShell>;
}
