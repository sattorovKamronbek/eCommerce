"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, requireAdmin } from "@/lib/auth/access";
import { parseSellerApplication, type SellerFormState } from "@/lib/sellers/application";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";

export async function applyAsSeller(locale: MarketplaceLocale, _previous: SellerFormState, form: FormData): Promise<SellerFormState> {
  if (!isMarketplaceLocale(locale)) return { error: "unavailable" };
  const destination = `/${locale}/seller/apply`;
  const account = await requireAccount(locale, destination);
  if (!account) return { error: "unavailable" };
  const application = parseSellerApplication(form);
  if (!application) return { error: "invalid" };
  let failed = false;
  try {
    const existing = await account.client.from("marketplace_seller_applications").select("status").eq("applicant_id", account.user.id).maybeSingle();
    if (existing.error || existing.data?.status === "approved") return { error: "unavailable" };
    const result = existing.data
      ? await account.client.rpc("marketplace_resubmit_seller_application", { p_type: application.applicant_type, p_name: application.name, p_contact: application.contact, p_region: application.region, p_scope: application.requested_scope, p_registration: application.registration_details })
      : await account.client.from("marketplace_seller_applications").insert({ ...application, applicant_id: account.user.id });
    failed = !!result.error;
  } catch { failed = true; }
  if (failed) return { error: "unavailable" };
  revalidatePath(destination);
  redirect(destination);
}

export async function reviewSeller(locale: MarketplaceLocale, form: FormData) {
  if (!isMarketplaceLocale(locale)) return;
  const destination = `/${locale}/admin/sellers`;
  const access = await requireAdmin(locale, destination);
  if (access.kind !== "admin") redirect(`${destination}?error=unavailable`);
  const applicant = form.get("applicant");
  const decision = form.get("decision");
  const revision = form.get("revision");
  if (typeof applicant !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicant) || (decision !== "approved" && decision !== "rejected" && decision !== "reopen") || typeof revision !== "string" || !/^[1-9]\d{0,9}$/.test(revision) || Number(revision) > 2147483647) redirect(`${destination}?error=unavailable`);
  let failed = false;
  try {
    const result = await access.client.rpc("marketplace_review_seller_application", { p_applicant_id: applicant, p_decision: decision, p_revision: Number(revision) });
    failed = !!result.error;
  } catch { failed = true; }
  if (failed) redirect(`${destination}?error=unavailable`);
  revalidatePath(destination);
  redirect(destination);
}
