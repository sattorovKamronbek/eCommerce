"use server";

import { isUuid } from "@/lib/uuid";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAccount, requireAdmin } from "@/lib/auth/access";
import { orderActions, orderPhone, orderQuantity, orderText, parseDirectPayment, type OrderAction } from "@/lib/orders/model";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";
import type { ListingEcosystem } from "@/lib/sellers/public-query";

import type { ActionFormState } from "@/components/account/action-form";

function orderError(code: string): ActionFormState {
  if (code === "40001" || code === "P0002" || code === "23505") return { error: "changed" };
  if (code === "22023") return { error: "invalid" };
  return { error: "failed" };
}

export async function reserveOrder(locale: MarketplaceLocale, ecosystem: ListingEcosystem,
  listingId: string, id: string, quote: string, _state: ActionFormState, form: FormData): Promise<ActionFormState> {
  if (!isMarketplaceLocale(locale) || !isUuid(id) || !isUuid(listingId) || !/^[0-9a-f]{64}$/.test(quote)
    || (ecosystem !== "cs2" && ecosystem !== "fashion")) return { error: "invalid" };
  const quantity = ecosystem === "cs2" ? 1 : orderQuantity(form.get("quantity"));
  const name = ecosystem === "fashion" ? orderText(form.get("name"), 120) : null;
  const phone = ecosystem === "fashion" ? orderPhone(form.get("phone")) : null;
  const address = ecosystem === "fashion" ? orderText(form.get("address"), 500, 5) : null;
  if (!quantity || (ecosystem === "fashion" && (!name || !phone || !address))) return { error: "invalid" };

  const account = await requireAccount(locale, `/${locale}/account/checkout/${ecosystem}/${listingId}`);
  if (!account) return { error: "failed" };
  const result = await account.client.rpc("marketplace_reserve_order", {
    p_id: id, p_listing_id: listingId, p_quote: quote, p_quantity: quantity,
    p_delivery_name: name, p_delivery_phone: phone, p_delivery_address: address,
  });
  if (result.error) return orderError(result.error.code);
  redirect(`/${locale}/account/orders/${id}`);
}

export async function updateOrder(locale: MarketplaceLocale, id: string, version: number, admin: boolean,
  action: OrderAction, _state: ActionFormState, form: FormData): Promise<ActionFormState> {
  if (!isMarketplaceLocale(locale) || !isUuid(id) || !Number.isSafeInteger(version) || !orderActions.includes(action)) return { error: "invalid" };
  const base = `/${locale}/${admin ? "admin" : "account"}/orders`;
  const destination = `${base}/${id}`;
  const reporting = action === "report" || action === "report_late";
  const payment = reporting ? parseDirectPayment(form) : null;
  const reason = orderText(form.get("reason"), 1000);
  if ((reporting && !payment) || (!reporting && action !== "confirm" && !reason)) return { error: "invalid" };

  const access = admin ? await requireAdmin(locale, destination) : await requireAccount(locale, destination);
  if (!access || !("client" in access)) return { error: "failed" };
  const result = await access.client.rpc("marketplace_update_order", {
    p_id: id, p_action: action, p_version: version, p_reason: reason, p_payment_reference: payment?.reference ?? null,
    p_paid_amount_tiyin: payment?.amount ?? null, p_paid_at: payment?.time ?? null,
  });
  if (result.error) return orderError(result.error.code);
  // Keep the acting user's Server Component and versioned forms current.
  revalidatePath(destination);
  redirect(destination);
}
