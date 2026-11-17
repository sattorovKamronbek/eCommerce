"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth/access";
import { parseListing, type ListingActionState } from "@/lib/sellers/listing";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";

const validId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function createListing(locale: MarketplaceLocale, _state: ListingActionState, form: FormData): Promise<ListingActionState> {
  if (!isMarketplaceLocale(locale)) return { error: "unavailable" };
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

export async function updateListing(locale: MarketplaceLocale, id: string, _state: ListingActionState, form: FormData): Promise<ListingActionState> {
  if (!isMarketplaceLocale(locale) || !validId(id)) return { error: "unavailable" };
  const account = await requireAccount(locale, `/${locale}/seller/products`);
  if (!account) return { error: "unavailable" };
  const item = parseListing(form);
  if (!item) return { error: "invalid" };
  try {
    const result = await account.client.from("marketplace_listings").update(item).eq("id", id).eq("seller_id", account.user.id).select("id").maybeSingle();
    if (result.error || !result.data) return { error: "unavailable" };
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
  if (!validId(id)) redirect(`${destination}?error=unavailable`);
  let failed = false;
  try {
    const result = await account.client.from("marketplace_listings").update({ state: "archived" }).eq("id", id).eq("seller_id", account.user.id).select("id").maybeSingle();
    failed = !!result.error || !result.data;
  } catch { failed = true; }
  if (failed) redirect(`${destination}?error=unavailable`);
  revalidatePath(destination);
  redirect(destination);
}
