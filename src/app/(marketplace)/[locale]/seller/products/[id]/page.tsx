import { notFound } from "next/navigation";
import { AccountShell, AccountUnavailable, SellerSetupRequired, accountLocale } from "@/components/account/shell";
import { SellerAccessNotice } from "@/components/account/seller-access-notice";
import { ActionForm } from "@/components/account/action-form";
import { orderDictionaries } from "@/messages/orders";
import { ListingForm } from "@/components/account/listing-form";
import { loadFashionDraft } from "@/lib/sellers/fashion-draft";
import { isSellerSchemaMissing } from "@/lib/sellers/schema";
import { requireSeller } from "@/lib/sellers/access";
import { fashionSellerDictionaries } from "@/messages/fashion-seller";
import { listingDictionaries } from "@/messages/seller-catalog";
import { updateCs2Listing, updateFashionProduct, updateListing } from "../actions";
import { saveCheckoutTerms, saveFashionCheckoutTerms } from "../checkout-actions";

export default async function EditListing({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const all = await params; const locale = await accountLocale(Promise.resolve(all)); const copy = listingDictionaries[locale];
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(all.id)) notFound();
  const access = await requireSeller(locale);
  if (access.kind !== "seller") return <SellerAccessNotice locale={locale} kind={access.kind} />;
  const listing = await access.account.client.from("marketplace_listings").select("*").eq("id", all.id).eq("seller_id", access.account.user.id).maybeSingle();
  if (listing.error) return isSellerSchemaMissing(listing.error) ? <SellerSetupRequired locale={locale} /> : <AccountUnavailable locale={locale} />;
  if (!listing.data || listing.data.moderation_status === "blocked") notFound();
  const item = listing.data;
  const fashion = item.fashion_product_id ? await loadFashionDraft(access.account.client, item) : null;
  if (item.fashion_product_id && !fashion) return <AccountUnavailable locale={locale} />;
  const update = item.cs2_group_id ? updateCs2Listing : updateListing;
  const save = fashion ? updateFashionProduct.bind(null, locale, fashion.version) : update.bind(null, locale, item.id, item.updated_at);
  const orders = orderDictionaries[locale];
  const termsListing = fashion ? fashion.termsListing : item.state !== "archived" ? item.id : undefined;
  const terms = termsListing
    ? await access.account.client.from("marketplace_checkout_terms").select("*").eq("listing_id", termsListing).maybeSingle()
    : null;
  const saveTerms = fashion ? saveFashionCheckoutTerms.bind(null, locale, item.id, fashion.version.productId)
    : saveCheckoutTerms.bind(null, locale, item.id, item.ecosystem);
  return <AccountShell locale={locale} title={copy.edit} intro={copy.intro}>
    <ListingForm key={fashion?.key ?? item.updated_at} action={save} copy={copy} locale={locale}
      scope={access.scope} listing={item} fashion={fashion?.form} />
    {terms ? <section className="order-summary" id={item.ecosystem === "cs2" ? "reservation-settings" : undefined}>
      <h2>{orders.terms}</h2>
      {terms.error ? <p role="alert">{orders.unavailable}</p> : <>
        <p>{orders.termsIntro}</p>
        {fashion && <p>{fashionSellerDictionaries[locale].groupTermsIntro}</p>}
        <ActionForm action={saveTerms}
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
