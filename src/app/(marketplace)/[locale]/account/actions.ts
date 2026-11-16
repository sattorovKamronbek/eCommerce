"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readSignupSettings } from "@/lib/auth/signup-settings";
import { getAuthConfig } from "@/lib/supabase/config";
import { isMarketplaceLocale, type MarketplaceLocale } from "@/messages/marketplace";
import type { AccountFeedback } from "@/messages/account";
import type { AccountField, AccountState } from "@/lib/auth/state";
import { parseDisplayName, parseEmail, safeReturnPath, validPassword } from "@/lib/auth/validation";
import { clearEmailFlow, readEmailFlow } from "@/lib/auth/flow";

const fail = (message: AccountFeedback, field?: AccountField): AccountState => ({ status: "error", message, ...(field ? { fields: { [field]: true } } : {}) });
const success = (message: AccountFeedback): AccountState => ({ status: "success", message });

export async function resendConfirmationAction(locale: MarketplaceLocale, _previous: AccountState, form: FormData): Promise<AccountState> {
  if (!isMarketplaceLocale(locale)) return fail("unavailable");
  const email = parseEmail(form.get("email"));
  if (!email) return fail("invalidEmail", "email");
  const config = getAuthConfig();
  const client = await createServerSupabaseClient(true);
  if (!config || !client) return fail("unavailable");
  try {
    await client.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${config.origin}/${locale}/auth/confirm` } });
  } catch {
    // Supabase Auth logs retain operator diagnostics. Never expose addresses,
    // tokens or provider payloads here, including on transport failures.
  }
  // Unknown/confirmed addresses return 200 before SMTP; pending accounts can
  // return SMTP/cooldown errors. Keep these outcomes indistinguishable. This
  // acknowledges the attempt and explicitly makes no delivery promise.
  return success("confirmationRequested");
}

export async function signupAction(locale: MarketplaceLocale, _previous: AccountState, form: FormData): Promise<AccountState> {
  if (!isMarketplaceLocale(locale)) return fail("unavailable");
  const email = parseEmail(form.get("email"));
  const name = parseDisplayName(form.get("displayName"));
  const password = form.get("password");
  if (!email) return fail("invalidEmail", "email");
  if (!name) return fail("invalidName", "displayName");
  if (!validPassword(password)) return fail("invalidPassword", "password");
  if (password !== form.get("repeatPassword")) return fail("passwordMismatch", "repeatPassword");
  const config = getAuthConfig();
  const client = await createServerSupabaseClient(true);
  if (!config || !client) return fail("unavailable");
  const settings = await readSignupSettings(config);
  if (settings !== "ready") return fail(settings === "confirmation-required" ? "signupSetupRequired" : "unavailable");
  try {
    const result = await client.auth.signUp({ email, password, options: {
      data: { display_name: name, preferred_locale: locale },
    } });
    const { user, session } = result.data;
    // Only Supabase can issue the session. Auto-confirmation is not mailbox proof
    // and never grants any role; privileges remain tied to explicit UUID grants.
    if (result.error || !session || !user?.email_confirmed_at || session.user.id !== user.id) {
      if (session) await client.auth.signOut({ scope: "local" });
      return fail("registrationFailed");
    }
  } catch { return fail("registrationFailed"); }
  revalidatePath(`/${locale}/account`);
  redirect(`/${locale}/account`);
}

export async function loginAction(locale: MarketplaceLocale, _previous: AccountState, form: FormData): Promise<AccountState> {
  if (!isMarketplaceLocale(locale)) return fail("unavailable");
  const email = parseEmail(form.get("email")); const password = form.get("password");
  if (!email) return fail("invalidEmail", "email");
  if (typeof password !== "string" || !password || password.length > 128) return fail("invalidCredentials");
  const client = await createServerSupabaseClient(true);
  if (!client) return fail("unavailable");
  try {
    const result = await client.auth.signInWithPassword({ email, password });
    if (result.error) return fail(["invalid_credentials", "email_not_confirmed", "user_banned"].includes(result.error.code ?? "") ? "invalidCredentials" : "unavailable");
    if (!result.data.user) return fail("unavailable");
    if (!result.data.user.email_confirmed_at) { await client.auth.signOut({ scope: "local" }); return fail("confirmRequired"); }
  } catch { return fail("unavailable"); }
  revalidatePath(`/${locale}/account`);
  redirect(safeReturnPath(form.get("next"), locale));
}

export async function recoveryAction(locale: MarketplaceLocale, _previous: AccountState, form: FormData): Promise<AccountState> {
  if (!isMarketplaceLocale(locale)) return fail("unavailable");
  const email = parseEmail(form.get("email"));
  if (!email) return fail("invalidEmail", "email");
  const config = getAuthConfig(); const client = await createServerSupabaseClient(true);
  if (!config || !client) return fail("unavailable");
  try {
    await client.auth.resetPasswordForEmail(email, { redirectTo: `${config.origin}/${locale}/auth/confirm` });
  } catch { /* Keep transport and address-dependent delivery failures neutral. */ }
  return success("recoverySent");
}

export async function confirmEmailAction(locale: MarketplaceLocale, _previous: AccountState, _form: FormData): Promise<AccountState> {
  void _previous; void _form;
  if (!isMarketplaceLocale(locale)) return fail("unavailable");
  const client = await createServerSupabaseClient(true);
  if (!client) return fail("unavailable");
  const flow = await readEmailFlow(locale);
  if (flow?.type !== "signup") return fail("invalidLink");
  try {
    const result = await client.auth.verifyOtp({ token_hash: flow.token, type: "signup" });
    if (result.error && !["otp_expired", "invalid_token"].includes(result.error.code ?? "")) return fail("unavailable");
    await clearEmailFlow(locale);
    if (result.error || !result.data.user?.email_confirmed_at) return fail("invalidLink");
  } catch { return fail("unavailable"); }
  revalidatePath(`/${locale}/account`);
  redirect(`/${locale}/account`);
}

export async function resetPasswordAction(locale: MarketplaceLocale, _previous: AccountState, form: FormData): Promise<AccountState> {
  if (!isMarketplaceLocale(locale)) return fail("unavailable");
  const password = form.get("password");
  if (!validPassword(password)) return fail("invalidPassword", "password");
  if (password !== form.get("repeatPassword")) return fail("passwordMismatch", "repeatPassword");
  const client = await createServerSupabaseClient(true);
  if (!client) return fail("unavailable");
  const flow = await readEmailFlow(locale);
  if (flow?.type !== "recovery") return fail("invalidLink");
  try {
    // Only the provider's recovery OTP can authorize this action, not a regular session.
    const verified = await client.auth.verifyOtp({ token_hash: flow.token, type: "recovery" });
    if (verified.error && !["otp_expired", "invalid_token"].includes(verified.error.code ?? "")) return fail("unavailable");
    await clearEmailFlow(locale);
    if (verified.error || !verified.data.user?.email_confirmed_at) return fail("invalidLink");
    const updated = await client.auth.updateUser({ password });
    if (updated.error) { await client.auth.signOut({ scope: "local" }); return fail("resetRejected"); }
    try {
      const signedOut = await client.auth.signOut({ scope: "global" });
      if (signedOut.error) return success("passwordUpdatedSignoutFailed");
    } catch { return success("passwordUpdatedSignoutFailed"); }
  } catch { return fail("unavailable"); }
  revalidatePath(`/${locale}/account`);
  redirect(`/${locale}/account/login?notice=passwordUpdated`);
}

export async function updateProfileAction(locale: MarketplaceLocale, _previous: AccountState, form: FormData): Promise<AccountState> {
  if (!isMarketplaceLocale(locale)) return fail("unavailable");
  const name = parseDisplayName(form.get("displayName"));
  const preferredLocale = form.get("preferredLocale");
  if (!name) return fail("invalidName", "displayName");
  if (typeof preferredLocale !== "string" || !isMarketplaceLocale(preferredLocale)) return fail("invalidLocale", "preferredLocale");
  const client = await createServerSupabaseClient(true);
  if (!client) return fail("unavailable");
  try {
    const identity = await client.auth.getUser();
    if (identity.error || !identity.data.user?.email_confirmed_at) return fail("invalidCredentials");
    const result = await client.from("marketplace_profiles").update({ display_name: name, preferred_locale: preferredLocale })
      .eq("id", identity.data.user.id).select("id").maybeSingle();
    if (result.error || !result.data) return fail("profileError");
  } catch { return fail("profileError"); }
  revalidatePath(`/${locale}/account`);
  return success("saved");
}

export async function logoutAction(locale: MarketplaceLocale, _previous: AccountState, _form: FormData): Promise<AccountState> {
  void _previous; void _form;
  if (!isMarketplaceLocale(locale)) return fail("unavailable");
  const client = await createServerSupabaseClient(true);
  if (!client) return fail("unavailable");
  try {
    const result = await client.auth.signOut({ scope: "local" });
    if (result.error) return fail("unavailable");
    await clearEmailFlow(locale);
  } catch { return fail("unavailable"); }
  revalidatePath(`/${locale}/account`);
  redirect(`/${locale}/account/login`);
}
