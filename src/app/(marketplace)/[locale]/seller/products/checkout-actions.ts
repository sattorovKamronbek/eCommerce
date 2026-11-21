"use server";

import { isUuid } from "@/lib/uuid";
import { revalidatePath } from "next/cache";
import type { ActionFormState } from "@/components/account/action-form";
import { orderPhone, orderText } from "@/lib/orders/model";
import { requireSeller } from "@/lib/sellers/access";
import { parseUzsTiyin } from "@/lib/sellers/listing";
import type { ListingEcosystem } from "@/lib/sellers/public-query";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";

export async function saveCheckoutTerms(locale: MarketplaceLocale, id: string, ecosystem: ListingEcosystem,
  _state: ActionFormState, form: FormData): Promise<ActionFormState> {
  if (!isMarketplaceLocale(locale) || !isUuid(id) || (ecosystem !== "fashion" && ecosystem !== "cs2")) return { error: "invalid" };
  const phone = orderPhone(form.get("phone"));
  const asset = ecosystem === "cs2" ? orderText(form.get("asset"), 20) : null;
  const shippingText = orderText(form.get("shipping"), 17);
  const shipping = ecosystem === "cs2" || (shippingText && /^0(?:\.0{1,2})?$/.test(shippingText)) ? 0 : parseUzsTiyin(shippingText);
  if (!phone || shipping === null || (ecosystem === "cs2" && (!asset || !/^[1-9]\d{0,19}$/.test(asset)))) return { error: "invalid" };

  const access = await requireSeller(locale);
  if (access.kind !== "seller") return { error: "failed" };
  const result = await access.account.client.rpc("marketplace_set_checkout_terms", {
    p_listing_id: id, p_seller_phone: phone, p_shipping_tiyin: shipping, p_cs2_asset_id: asset,
  });
  if (result.error) {
    if (result.error.code === "23505" || result.error.code === "23514" || result.error.code === "22023") return { error: "invalid" };
    return { error: "failed" };
  }
  revalidatePath(`/${locale}/seller/products/${id}`);
  return { saved: true };
}
