"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/sellers/access";
import { parseListing, type ListingActionState } from "@/lib/sellers/listing";
import { createCs2Listings, saveCs2Variant } from "@/lib/sellers/cs2-writes";
import { saveFashionProduct, type FashionEditVersion } from "@/lib/sellers/fashion-writes";
import { isUuid } from "@/lib/uuid";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";

export async function createListing(locale: MarketplaceLocale, _state: ListingActionState, form: FormData): Promise<ListingActionState> {
  if (!isMarketplaceLocale(locale)) return { error: "unavailable" };
  if (form.get("ecosystem") === "cs2") return createCs2Listings(locale, form);
  if (form.has("fashionPayload")) return saveFashionProduct(locale, form);
  const access = await requireSeller(locale);
  if (access.kind !== "seller") return { error: "unavailable" };
  const { account, scope } = access;
  const item = parseListing(form);
  if (!item) return { error: "invalid" };
  if (scope !== "both" && scope !== item.ecosystem) return { error: "unavailable" };
  try {
    const result = await account.client.from("marketplace_listings").insert({ ...item, seller_id: account.user.id });
    if (result.error) return { error: "unavailable" };
  } catch { return { error: "unavailable" }; }
  revalidatePath(`/${locale}/seller/products`);
  redirect(`/${locale}/seller/products`);
}

export async function updateFashionProduct(locale: MarketplaceLocale, expected: FashionEditVersion,
  _state: ListingActionState, form: FormData): Promise<ListingActionState> {
  if (!isMarketplaceLocale(locale) || !isUuid(expected.productId) || !Number.isFinite(Date.parse(expected.updatedAt))) {
    return { error: "unavailable" };
  }
  return saveFashionProduct(locale, form, expected);
}

export async function updateCs2Listing(locale: MarketplaceLocale, id: string, expectedUpdatedAt: string, _state: ListingActionState, form: FormData): Promise<ListingActionState> {
  if (!isMarketplaceLocale(locale) || !isUuid(id) || typeof expectedUpdatedAt !== "string"
    || !Number.isFinite(Date.parse(expectedUpdatedAt))) return { error: "unavailable" };
  return saveCs2Variant(locale, id, expectedUpdatedAt, form);
}

export async function updateListing(locale: MarketplaceLocale, id: string, expectedUpdatedAt: string, _state: ListingActionState, form: FormData): Promise<ListingActionState> {
  if (!isMarketplaceLocale(locale) || !isUuid(id) || typeof expectedUpdatedAt !== "string"
    || !Number.isFinite(Date.parse(expectedUpdatedAt))) return { error: "unavailable" };
  const access = await requireSeller(locale);
  if (access.kind !== "seller") return { error: "unavailable" };
  const { account, scope } = access;
  const item = parseListing(form);
  if (!item) return { error: "invalid" };
  if (scope !== "both" && scope !== item.ecosystem) return { error: "unavailable" };
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
  const access = await requireSeller(locale);
  if (access.kind !== "seller") redirect(`${destination}?error=unavailable`);
  const { account } = access;
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
