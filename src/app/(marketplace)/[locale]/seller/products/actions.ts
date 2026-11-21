"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth/access";
import { parseListing, type ListingActionState } from "@/lib/sellers/listing";
import { createCs2Listings, saveCs2Variant } from "@/lib/sellers/cs2-writes";
import { isUuid } from "@/lib/uuid";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";

export async function createListing(locale: MarketplaceLocale, _state: ListingActionState, form: FormData): Promise<ListingActionState> {
  if (!isMarketplaceLocale(locale)) return { error: "unavailable" };
  if (form.get("ecosystem") === "cs2") return createCs2Listings(locale, form);
  const account = await requireAccount(locale, `/${locale}/seller/products`);
  if (!account) return { error: "unavailable" };
  const item = parseListing(form);
  if (!item) return { error: "invalid" };
  try {
    const result = await account.client.from("marketplace_listings").insert({ ...item, seller_id: account.user.id });
    if (result.error) return { error: "unavailable" };
  } catch { return { error: "unavailable" }; }
  revalidatePath(`/${locale}/seller/products`);
  redirect(`/${locale}/seller/products`);
}

export async function updateCs2Listing(locale: MarketplaceLocale, id: string, expectedUpdatedAt: string, _state: ListingActionState, form: FormData): Promise<ListingActionState> {
  if (!isMarketplaceLocale(locale) || !isUuid(id) || typeof expectedUpdatedAt !== "string"
    || !Number.isFinite(Date.parse(expectedUpdatedAt))) return { error: "unavailable" };
  return saveCs2Variant(locale, id, expectedUpdatedAt, form);
}

export async function updateListing(locale: MarketplaceLocale, id: string, expectedUpdatedAt: string, _state: ListingActionState, form: FormData): Promise<ListingActionState> {
  if (!isMarketplaceLocale(locale) || !isUuid(id) || typeof expectedUpdatedAt !== "string"
    || !Number.isFinite(Date.parse(expectedUpdatedAt))) return { error: "unavailable" };
  const account = await requireAccount(locale, `/${locale}/seller/products`);
  if (!account) return { error: "unavailable" };
  const item = parseListing(form);
  if (!item) return { error: "invalid" };
  try {
    const result = await account.client.from("marketplace_listings").update(item).eq("id", id).eq("seller_id", account.user.id)
      .eq("updated_at", expectedUpdatedAt).select("id").maybeSingle();
    if (result.error) return { error: "unavailable" };
    if (!result.data) return { error: "changed" };
  } catch { return { error: "unavailable" }; }
  revalidatePath(`/${locale}/seller/products`);
  redirect(`/${locale}/seller/products`);
}

export async function archiveListing(locale: MarketplaceLocale, form: FormData) {
  if (!isMarketplaceLocale(locale)) return;
  const destination = `/${locale}/seller/products`;
  const account = await requireAccount(locale, destination);
  if (!account) redirect(`${destination}?error=unavailable`);
  const id = form.get("id");
  if (!isUuid(id)) redirect(`${destination}?error=unavailable`);
  let failed = false;
  try {
    const result = await account.client.from("marketplace_listings").update({ state: "archived" }).eq("id", id).eq("seller_id", account.user.id).select("id").maybeSingle();
    failed = !!result.error || !result.data;
  } catch { failed = true; }
  if (failed) redirect(`${destination}?error=unavailable`);
  revalidatePath(destination);
  redirect(destination);
}
