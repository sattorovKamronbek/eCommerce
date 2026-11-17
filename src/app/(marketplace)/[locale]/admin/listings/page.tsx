import Link from "next/link";
import { AccountDenied, AccountShell, AccountUnavailable, accountLocale } from "@/components/account/shell";
import { WorkspaceShell } from "@/components/account/workspace";
import { requireAdmin } from "@/lib/auth/access";
import { parseAdminPage } from "@/lib/auth/validation";
import { sellerPageRange, sellerPageResults } from "@/lib/sellers/pagination";
import { listingDictionaries } from "@/messages/seller-catalog";
import { accountDictionaries } from "@/messages/account";
import { moderateListing } from "./actions";

export default async function AdminListings({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string | string[]; error?: string }>;
}) {
  const locale = await accountLocale(params); const copy = listingDictionaries[locale];
  const destination = `/${locale}/admin/listings`;
  const access = await requireAdmin(locale, destination);
  if (access.kind === "unavailable") return <AccountUnavailable locale={locale} />;
  if (access.kind === "denied") return <AccountDenied locale={locale} />;
  const assurance = await access.client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error) return <AccountUnavailable locale={locale} />;
  if (assurance.data.currentLevel !== "aal2") return <AccountShell locale={locale} title={copy.adminListings} intro={copy.adminMfa}><Link className="mp-text-link" href={`/${locale}/account/security?next=${encodeURIComponent(destination)}`}>{copy.verify}</Link></AccountShell>;
  const query = await searchParams; const page = parseAdminPage(query.page); const range = sellerPageRange(page);
  const result = await access.client.from("marketplace_listings").select("*").order("created_at", { ascending: false }).order("id", { ascending: false }).range(range.from, range.to);
  if (result.error) return <AccountUnavailable locale={locale} />;
  const listings = sellerPageResults(result.data); const common = accountDictionaries[locale];
  return <WorkspaceShell locale={locale} title={copy.adminListings} intro={copy.adminIntro} active="moderation" admin>
    {query.error ? <p role="alert">{copy.unavailable}</p> : null}
    {listings.rows.length ? <div className="seller-reviews">{listings.rows.map(item => <article className="seller-review" key={item.id}>
      <h2>{item.title}</h2><p>{copy.sellerId}: {item.seller_id}</p><p>{copy[item.ecosystem]} · {item.moderation_status === "blocked" ? copy.blocked : copy[item.state]}</p>
      <p className="real-description">{item.description}</p>
      <form action={moderateListing.bind(null, locale)}><input type="hidden" name="id" value={item.id} /><button name="action" value={item.moderation_status === "blocked" ? "restore" : "archive"}>{item.moderation_status === "blocked" ? copy.restore : copy.archive}</button></form>
    </article>)}</div> : <p>{copy.empty}</p>}
    <nav className="account-pagination" aria-label={copy.adminListings}>{page > 1 ? <Link href={`${destination}?page=${page - 1}`} rel="prev">{common.previous}</Link> : <span aria-disabled="true">{common.previous}</span>}<span aria-current="page">{common.page} {page}</span>{listings.hasNext ? <Link href={`${destination}?page=${page + 1}`} rel="next">{common.next}</Link> : <span aria-disabled="true">{common.next}</span>}</nav>
  </WorkspaceShell>;
}
