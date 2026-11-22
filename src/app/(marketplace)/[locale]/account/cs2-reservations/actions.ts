"use server";

import { revalidatePath } from "next/cache";
import type { ActionFormState } from "@/components/account/action-form";
import { requireAccount } from "@/lib/auth/access";
import { orderPhone, orderText } from "@/lib/orders/model";
import { isUuid } from "@/lib/uuid";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";

export async function saveCs2ReservationSettings(locale: MarketplaceLocale, id: string, revision: string | null,
  _state: ActionFormState, form: FormData): Promise<ActionFormState> {
  if (!isMarketplaceLocale(locale) || !isUuid(id) || (revision !== null && !isUuid(revision))) return { error: "invalid" };
  const phone = orderPhone(form.get("phone"));
  const asset = orderText(form.get("asset"), 20);
  if (!phone || !asset || !/^[1-9]\d{0,19}$/.test(asset)) return { error: "invalid" };

  const path = `/${locale}/account/cs2-reservations`;
  const account = await requireAccount(locale, path);
  if (!account) return { error: "failed" };
  const result = await account.client.rpc("marketplace_save_cs2_reservation_settings", {
    p_listing_id: id, p_expected_revision: revision, p_seller_phone: phone, p_cs2_asset_id: asset,
  });
  if (result.error) {
    if (result.error.code === "40001" || result.error.code === "23514") return { error: "changed" };
    if (result.error.code === "22023" || result.error.code === "23505") return { error: "invalid" };
    return { error: "failed" };
  }
  revalidatePath(path);
  return { saved: true };
}
