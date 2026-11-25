import Link from "next/link";
import { AccountUnavailable, SellerSetupRequired, accountLocale } from "@/components/account/shell";
import { SellerAccessNotice } from "@/components/account/seller-access-notice";
import { WorkspaceShell } from "@/components/account/workspace";
import { isSellerSchemaMissing } from "@/lib/sellers/schema";
import { requireSeller } from "@/lib/sellers/access";
import { loadSellerIntake } from "@/lib/sellers/intake";
import { sellerPageRange, sellerPageResults } from "@/lib/sellers/pagination";
import { parseAdminPage } from "@/lib/auth/validation";
import { CS2_WEAR_NAMES } from "@/lib/sellers/cs2";
import { listingDictionaries } from "@/messages/seller-catalog";
import { accountDictionaries } from "@/messages/account";
import { cs2SellerDictionaries } from "@/messages/cs2-seller";
import { orderDictionaries } from "@/messages/orders";
import { archiveListing } from "./actions";

export default async function SellerProducts({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string | string[]; error?: string }>;
}) {
  const locale = await accountLocale(params);
  const copy = listingDictionaries[locale];
  const access = await requireSeller(locale);
  if (access.kind !== "seller") return <SellerAccessNotice locale={locale} kind={access.kind} />;
  const query = await searchParams;
  const page = parseAdminPage(query.page);
  const range = sellerPageRange(page);
  let listings = access.account.client.from("marketplace_listings").select("*").eq("seller_id", access.account.user.id);
  if (access.scope !== "both") listings = listings.eq("ecosystem", access.scope);
  const [result, intake] = await Promise.all([
    listings.order("created_at", { ascending: false }).order("id", { ascending: false }).range(range.from, range.to),
    loadSellerIntake(access.account.client),
  ]);
  if (result.error) return isSellerSchemaMissing(result.error) ? <SellerSetupRequired locale={locale} /> : <AccountUnavailable locale={locale} />;
  const products = sellerPageResults(result.data);
  const cs2ListingIds = new Set(access.scope === "fashion" ? [] : products.rows
    .filter(item => item.ecosystem === "cs2" && item.moderation_status === "allowed" && item.state !== "archived")
    .map(item => item.id));
  const checkoutTerms = cs2ListingIds.size
    ? await access.account.client.from("marketplace_checkout_terms").select("listing_id").in("listing_id", [...cs2ListingIds])
    : null;
  const listingsWithTerms = new Set(checkoutTerms?.data?.map(terms => terms.listing_id));
  const base = `/${locale}/seller/products`;
  const common = accountDictionaries[locale];
  const cs2Copy = cs2SellerDictionaries[locale];
  return <WorkspaceShell locale={locale} title={copy.products} intro={copy.intro} active="products" admin={false} sellerIntake={intake}>
    {query.error ? <p role="alert">{copy.unavailable}</p> : null}
    {checkoutTerms?.error ? <p role="alert">{orderDictionaries[locale].unavailable}</p> : null}
    <p className="seller-catalog-note">{copy.scopeNotice}</p><Link className="mp-text-link" href={`${base}/new`}>{copy.newListing}</Link>
    {products.rows.length ? <div className="seller-reviews">{products.rows.map(item => <article className="seller-review" key={item.id}>
      <h2>{item.title}</h2><p>{copy[item.ecosystem]} · {item.moderation_status === "blocked" ? copy.blocked : copy[item.state]}</p>
      {item.cs2_wear && <p>{CS2_WEAR_NAMES[item.cs2_wear]} ({item.cs2_wear})</p>}
      {item.fashion_product_id && <p>{item.variant}</p>}
      <p>{new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.price_tiyin / 100)} UZS · {copy.quantity}: {item.quantity}</p>
      {checkoutTerms?.data && cs2ListingIds.has(item.id) && !listingsWithTerms.has(item.id) ? <>
        {item.state === "published" ? <p>{cs2Copy.reservationSetupRequired}</p> : null}
        <p><Link className="mp-text-link" href={`${base}/${item.id}#reservation-settings`}>{cs2Copy.reservationSetup}</Link></p>
      </> : null}
      {item.moderation_status === "allowed" ? <><Link className="mp-text-link" href={`${base}/${item.id}`}>{copy.edit}</Link>{item.state !== "archived" ? <form action={archiveListing.bind(null, locale)}><input type="hidden" name="id" value={item.id} /><button>{copy.archive}</button></form> : null}</> : null}
    </article>)}</div> : <p>{copy.empty}</p>}
    <nav className="account-pagination" aria-label={copy.products}>
      {page > 1 ? <Link href={`${base}?page=${page - 1}`} rel="prev">{common.previous}</Link> : <span aria-disabled="true">{common.previous}</span>}
      <span aria-current="page">{common.page} {page}</span>{products.hasNext ? <Link href={`${base}?page=${page + 1}`} rel="next">{common.next}</Link> : <span aria-disabled="true">{common.next}</span>}
    </nav>
  </WorkspaceShell>;
}
