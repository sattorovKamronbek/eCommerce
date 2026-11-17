"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/auth/validation";
import type { MfaActionState } from "@/lib/auth/mfa";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";

const validId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function clientForVerifiedUser() {
  const client = await createServerSupabaseClient(true);
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  return !error && data.user?.email_confirmed_at ? client : null;
}

export async function beginMfaSetup(locale: MarketplaceLocale, _state: MfaActionState, _form: FormData): Promise<MfaActionState> {
  if (!isMarketplaceLocale(locale)) return { error: "unavailable" };
  try {
    const client = await clientForVerifiedUser();
    if (!client) return { error: "unavailable" };
    const [factors, assurance] = await Promise.all([client.auth.mfa.listFactors(), client.auth.mfa.getAuthenticatorAssuranceLevel()]);
    if (factors.error || assurance.error) return { error: "unavailable" };
    if (factors.data.all.some(factor => factor.status === "verified") && assurance.data.currentLevel !== "aal2") return { error: "stepUpRequired" };
    if (factors.data.all.some(factor => factor.status === "unverified")) return { error: "pendingSetup" };
    const result = await client.auth.mfa.enroll({ factorType: "totp" });
    const setup = result.data;
    if (result.error || !setup || setup.type !== "totp" || !validId(setup.id) || !setup.totp.qr_code.startsWith("data:image/svg+xml;utf-8,") || setup.totp.qr_code.length > 1000000 || !/^[A-Z2-7]{8,128}$/.test(setup.totp.secret)) return { error: "unavailable" };
    return { setup: { factorId: setup.id, qr: setup.totp.qr_code, secret: setup.totp.secret } };
  } catch { return { error: "unavailable" }; }
}

export async function verifyMfaCode(locale: MarketplaceLocale, _state: MfaActionState, form: FormData): Promise<MfaActionState> {
  if (!isMarketplaceLocale(locale)) return { error: "unavailable" };
  const factorId = form.get("factorId");
  const code = form.get("code");
  if (!validId(factorId) || typeof code !== "string" || !/^\d{6}$/.test(code)) return { error: "invalid" };
  try {
    const client = await clientForVerifiedUser();
    if (!client) return { error: "unavailable" };
    const factors = await client.auth.mfa.listFactors();
    if (factors.error || !factors.data.all.some(factor => factor.id === factorId && factor.factor_type === "totp")) return { error: "invalid" };
    const result = await client.auth.mfa.challengeAndVerify({ factorId, code });
    if (result.error || !result.data) return { error: "invalid" };
    const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error || assurance.data.currentLevel !== "aal2") return { error: "unavailable" };
  } catch { return { error: "unavailable" }; }
  revalidatePath(`/${locale}/account/security`);
  redirect(safeReturnPath(form.get("next"), locale));
}

export async function removeUnverifiedMfa(locale: MarketplaceLocale, _state: MfaActionState, form: FormData): Promise<MfaActionState> {
  if (!isMarketplaceLocale(locale)) return { error: "unavailable" };
  const factorId = form.get("factorId");
  if (!validId(factorId)) return { error: "invalid" };
  try {
    const client = await clientForVerifiedUser();
    if (!client) return { error: "unavailable" };
    const factors = await client.auth.mfa.listFactors();
    if (factors.error || !factors.data.all.some(factor => factor.id === factorId && factor.status === "unverified")) return { error: "invalid" };
    const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) return { error: "unavailable" };
    if (factors.data.all.some(factor => factor.status === "verified") && assurance.data.currentLevel !== "aal2") return { error: "stepUpRequired" };
    const result = await client.auth.mfa.unenroll({ factorId });
    if (result.error) return { error: "unavailable" };
  } catch { return { error: "unavailable" }; }
  revalidatePath(`/${locale}/account/security`);
  redirect(`/${locale}/account/security`);
}
