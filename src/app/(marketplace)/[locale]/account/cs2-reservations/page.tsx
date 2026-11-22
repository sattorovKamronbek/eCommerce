import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/account/action-form";
import { AccountDenied, AccountShell, AccountUnavailable, accountLocale } from "@/components/account/shell";
import { requireAccount } from "@/lib/auth/access";
import { parseAdminPage } from "@/lib/auth/validation";
import { sellerPageRange, sellerPageResults } from "@/lib/sellers/pagination";
import { accountDictionaries } from "@/messages/account";
import { cs2SellerDictionaries } from "@/messages/cs2-seller";
import { orderDictionaries } from "@/messages/orders";
import { saveCs2ReservationSettings } from "./actions";

export default async function Cs2ReservationSettings({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const locale = await accountLocale(params);
  const path = `/${locale}/account/cs2-reservations`;
  const account = await requireAccount(locale, path);
  if (!account) return <AccountUnavailable locale={locale} />;
  const page = parseAdminPage((await searchParams).page);
  const range = sellerPageRange(page);
  const result = await account.client.rpc("marketplace_cs2_reservation_settings")
    .order("title").order("variant").order("listing_id").range(range.from, range.to);
  if (result.error) return <AccountUnavailable locale={locale} />;
  const { rows, hasNext } = sellerPageResults(result.data);
  if (!rows.length && page > 1) redirect(path);
  if (!rows.length) return <AccountDenied locale={locale} />;

  const copy = cs2SellerDictionaries[locale];
  const orders = orderDictionaries[locale];
  const common = accountDictionaries[locale];
  return <AccountShell locale={locale} title={copy.reservationSettings} intro={orders.termsIntro}>
    <Link className="mp-text-link" href={`/${locale}/account`}>{common.accountLink}</Link>
    <div className="seller-reviews">{rows.map(item => {
      const heading = `reservation-${item.listing_id}`;
      return <article className="seller-review" key={item.listing_id} aria-labelledby={heading}>
        <h2 id={heading}>{item.title}{item.variant ? ` · ${item.variant}` : ""}</h2>
        {!item.revision && <p>{copy.reservationSetupRequired}</p>}
        <ActionForm action={saveCs2ReservationSettings.bind(null, locale, item.listing_id, item.revision)}
          label={orders.saveTerms} errors={orders.feedback} pendingLabel={orders.pending} savedLabel={orders.saved}>
          <label key={`phone-${item.revision}`}>{orders.sellerContact}<input name="phone" type="tel" required maxLength={16}
            defaultValue={item.seller_phone ?? undefined} /></label>
          <label key={`asset-${item.revision}`}>{copy.steamAssetId}<input name="asset" inputMode="numeric" required maxLength={20}
            pattern="[1-9][0-9]{0,19}" readOnly={!item.asset_editable} defaultValue={item.cs2_asset_id ?? undefined} /></label>
          {!item.asset_editable && <p className="order-note">{copy.assetLocked}</p>}
        </ActionForm>
      </article>;
    })}</div>
    {(page > 1 || hasNext) && <nav className="account-pagination" aria-label={copy.reservationSettings}>
      {page > 1 && <Link href={`${path}?page=${page - 1}`} rel="prev">{common.previous}</Link>}
      <span aria-current="page">{common.page} {page}</span>
      {hasNext && <Link href={`${path}?page=${page + 1}`} rel="next">{common.next}</Link>}
    </nav>}
  </AccountShell>;
}
