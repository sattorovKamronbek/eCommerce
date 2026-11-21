"use server";

import { isUuid } from "@/lib/uuid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionFormState } from "@/components/account/action-form";
import { requireAdmin } from "@/lib/auth/access";
import { orderText } from "@/lib/orders/model";
import type { AccessAction, AccessRole } from "@/lib/supabase/database";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";

export async function changeUserAccess(locale: MarketplaceLocale, id: string, action: AccessAction, role: AccessRole, suspended: boolean,
  _state: ActionFormState, form: FormData): Promise<ActionFormState> {
  const reason = orderText(form.get("reason"), 1000);
  if (!isMarketplaceLocale(locale) || !isUuid(id) || !reason) return { error: "invalid" };
  const destination = `/${locale}/admin/users/${id}`;
  const access = await requireAdmin(locale, destination);
  if (access.kind !== "admin") return { error: "failed" };
  const result = await access.client.rpc("marketplace_manage_user_access", {
    p_user_id: id, p_action: action, p_reason: reason, p_expected_role: role, p_expected_suspended: suspended,
  });
  if (result.error) return { error: result.error.code === "40001" ? "changed" : "failed" };
  revalidatePath(destination);
  redirect(destination);
}

export async function requestProfileIdentity(locale: MarketplaceLocale, id: string, _state: ActionFormState, _form: FormData): Promise<ActionFormState> {
  void _state;
  void _form;
  if (!isMarketplaceLocale(locale) || !isUuid(id)) return { error: "invalid" };
  const destination = `/${locale}/admin/users/${id}`;
  const access = await requireAdmin(locale, destination);
  if (access.kind !== "admin" || access.role !== "owner") return { error: "failed" };
  const result = await access.client.rpc("marketplace_request_profile_identity", { p_subject_id: id });
  if (result.error) return { error: result.error.code === "23505" ? "changed" : "failed" };
  revalidatePath(destination);
  redirect(destination);
}

export async function reviewProfileIdentity(locale: MarketplaceLocale, id: string, requestId: string,
  _state: ActionFormState, form: FormData): Promise<ActionFormState> {
  if (!isMarketplaceLocale(locale) || !isUuid(id) || !isUuid(requestId)) return { error: "invalid" };
  const decision = form.get("decision");
  if (decision !== "verified" && decision !== "not_verified" && decision !== "cancelled") return { error: "invalid" };
  const code = decision === "cancelled" ? null : orderText(form.get("code"), 36);
  if (decision !== "cancelled" && !isUuid(code)) return { error: "invalid" };
  const destination = `/${locale}/admin/users/${id}`;
  const access = await requireAdmin(locale, destination);
  if (access.kind !== "admin" || access.role !== "owner") return { error: "failed" };
  const result = await access.client.rpc("marketplace_review_profile_identity", {
    p_request_id: requestId, p_subject_id: id, p_decision: decision, p_code: code,
  });
  if (result.error) return { error: result.error.code === "P0002" ? (decision === "cancelled" ? "changed" : "invalid") : "failed" };
  revalidatePath(destination);
  redirect(destination);
}
