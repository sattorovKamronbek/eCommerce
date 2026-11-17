"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/access";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";

export async function moderateListing(locale: MarketplaceLocale, form: FormData) {
  if (!isMarketplaceLocale(locale)) return;
  const destination = `/${locale}/admin/listings`;
  const access = await requireAdmin(locale, destination);
  if (access.kind !== "admin") redirect(`${destination}?error=unavailable`);
  const id = form.get("id"); const action = form.get("action");
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || (action !== "archive" && action !== "restore")) redirect(`${destination}?error=unavailable`);
  let failed = false;
  try {
    const result = action === "archive" ? await access.client.rpc("marketplace_admin_archive_listing", { p_listing_id: id }) : await access.client.rpc("marketplace_admin_restore_listing", { p_listing_id: id });
    failed = !!result.error;
  } catch { failed = true; }
  if (failed) redirect(`${destination}?error=unavailable`);
  revalidatePath(destination);
  redirect(destination);
}
