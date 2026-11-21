import { AccountDenied, AccountUnavailable, SellerSetupRequired, accountLocale } from "@/components/account/shell";
import Link from "next/link";
import { WorkspaceShell } from "@/components/account/workspace";
import { ActionForm } from "@/components/account/action-form";
import { loadSellerIntake } from "@/lib/sellers/intake";
import { isSellerSchemaMissing } from "@/lib/sellers/schema";
import { requireAdmin } from "@/lib/auth/access";
import { parseAdminPage } from "@/lib/auth/validation";
import { sellerPageRange, sellerPageResults } from "@/lib/sellers/pagination";
import { accountDictionaries } from "@/messages/account";
import { sellerDictionaries } from "@/messages/seller";
import { reviewSeller, updateSellerIntake } from "../../seller/actions";

export default async function SellerReviews({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string; page?: string | string[]; status?: string | string[] }>;
}) {
  const locale = await accountLocale(params);
  const copy = sellerDictionaries[locale];
  const access = await requireAdmin(locale, `/${locale}/admin/sellers`);
  if (access.kind === "unavailable") return <AccountUnavailable locale={locale} />;
  if (access.kind === "denied") return <AccountDenied locale={locale} />;
  const query = await searchParams;
  const status = query.status === "approved" || query.status === "rejected" ? query.status : "pending";
  const page = parseAdminPage(query.page);
  const range = sellerPageRange(page);
  const [applications, intake] = await Promise.all([
    access.client.from("marketplace_seller_applications").select("*").eq("status", status).order("created_at", { ascending: true }).order("applicant_id", { ascending: true }).range(range.from, range.to),
    loadSellerIntake(access.client),
  ]);
  if (applications.error) return isSellerSchemaMissing(applications.error) ? <SellerSetupRequired locale={locale} admin /> : <AccountUnavailable locale={locale} />;
  const result = sellerPageResults(applications.data);
  const accountCopy = accountDictionaries[locale];
  const base = `/${locale}/admin/sellers`;
  return <WorkspaceShell locale={locale} title={copy.adminTitle} intro={copy.adminIntro} active="sellers" admin sellerIntake={intake}>
    {query.error ? <p role="alert">{copy.reviewFailed}</p> : null}
    <p>{copy.adminSecurity} <Link className="mp-text-link" href={`/${locale}/account/security?next=${encodeURIComponent(base)}`}>{copy.securityLink}</Link></p>
    <section className="seller-review" aria-labelledby="seller-intake-title">
      <h2 id="seller-intake-title">{copy.intakeTitle}</h2>
      {intake ? <>
        <p>{intake.is_open ? copy.intakeOpen : copy.intakeClosed}</p>
        <ActionForm action={updateSellerIntake.bind(null, locale)} label={intake.is_open ? copy.closeIntake : copy.openIntake}
          errors={{ invalid: copy.reviewFailed, changed: copy.reviewFailed, failed: copy.reviewFailed }}
          pendingLabel={copy.intakeSaving} savedLabel={copy.intakeSaved}>
          <input type="hidden" name="open" value={intake.is_open ? "false" : "true"} />
        </ActionForm>
      </> : <p role="alert">{copy.intakeUnavailable}</p>}
    </section>
    <nav className="seller-review-filters" aria-label={copy.status}>{(["pending", "approved", "rejected"] as const).map((option) => <Link key={option} href={`${base}?status=${option}`} aria-current={status === option ? "page" : undefined}>{copy[option]}</Link>)}</nav>
    {result.rows.length === 0 ? <p>{copy.empty}</p> : <div className="seller-reviews">{result.rows.map((application) =>
      <article key={application.applicant_id} className="seller-review"><h2>{application.name}</h2>
        <dl><dt>{accountCopy.identifier}</dt><dd>{application.applicant_id}</dd><dt>{copy.type}</dt><dd>{copy[application.applicant_type]}</dd><dt>{copy.contact}</dt><dd>{application.contact}</dd><dt>{copy.region}</dt><dd>{application.region}</dd><dt>{copy.scope}</dt><dd>{copy[application.requested_scope]}</dd>{application.registration_details ? <><dt>{copy.registration}</dt><dd>{application.registration_details}</dd></> : null}</dl>
        <form action={reviewSeller.bind(null, locale)}><input type="hidden" name="applicant" value={application.applicant_id} /><input type="hidden" name="revision" value={application.revision} />{application.status === "pending" ? <><label>{copy.adminCode}<input name="verificationCode" autoComplete="off" spellCheck={false} maxLength={64} /></label><label><input type="checkbox" name="identityVerified" value="yes" />{copy.adminAttestation}</label><button name="decision" value="approved">{copy.approve}</button><button name="decision" value="rejected">{copy.reject}</button></> : <button name="decision" value="reopen">{copy.reopen}</button>}</form>
      </article>)}</div>}
    <nav className="account-pagination" aria-label={copy.adminTitle}>
      {page > 1 ? <Link href={`${base}?status=${status}&page=${page - 1}`} rel="prev">{accountCopy.previous}</Link> : <span aria-disabled="true">{accountCopy.previous}</span>}
      <span aria-current="page">{accountCopy.page} {page}</span>
      {result.hasNext ? <Link href={`${base}?status=${status}&page=${page + 1}`} rel="next">{accountCopy.next}</Link> : <span aria-disabled="true">{accountCopy.next}</span>}
    </nav>
  </WorkspaceShell>;
}
