import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => {
  const auth = { signUp: vi.fn(), resend: vi.fn(), signInWithPassword: vi.fn(), resetPasswordForEmail: vi.fn(), getUser: vi.fn(), verifyOtp: vi.fn(), updateUser: vi.fn(), signOut: vi.fn() };
  return { auth, configured: true, settings: vi.fn(), get: vi.fn(), set: vi.fn(), remove: vi.fn(), from: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) };
});
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mock.get, set: mock.set, delete: mock.remove }) }));
vi.mock("@/lib/supabase/config", () => ({ getAuthConfig: () => mock.configured ? { url: "https://example.supabase.co", key: "sb_publishable_example", origin: "https://app.test" } : null }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: async () => mock.configured ? { auth: mock.auth, from: mock.from } : null }));
vi.mock("@/lib/auth/signup-settings", () => ({ readSignupSettings: mock.settings }));
import { signupAction, resendConfirmationAction, loginAction, recoveryAction, resetPasswordAction, confirmEmailAction, updateProfileAction, logoutAction } from "@/app/(marketplace)/[locale]/account/actions";
const idle = { status: "idle" } as const;
function form(values: Record<string, string>) { const data = new FormData(); Object.entries(values).forEach(([k,v]) => data.set(k,v)); return data; }
const user = { id: "owner-uuid", email_confirmed_at: "2026-11-11T00:00:00Z" };
beforeEach(() => {
  vi.clearAllMocks(); mock.configured = true; mock.settings.mockResolvedValue("ready");
  for (const method of Object.values(mock.auth)) method.mockResolvedValue({ data: { user, session: null }, error: null });
  mock.get.mockReturnValue(undefined);
});
describe("provider-backed server action boundaries", () => {
  it("resends confirmation with a trusted callback and never accepts a submitted redirect", async () => {
    expect(await resendConfirmationAction("uz", idle, form({ email: " Ali@Example.com ", redirectTo: "https://evil.test" }))).toEqual({ status: "success", message: "confirmationRequested" });
    expect(mock.auth.resend).toHaveBeenCalledWith({ type: "signup", email: "ali@example.com", options: { emailRedirectTo: "https://app.test/uz/auth/confirm" } });
    mock.auth.resend.mockResolvedValue({ error: { code: "user_not_found" } });
    expect(await resendConfirmationAction("uz", idle, form({ email: "unknown@example.com" }))).toEqual({ status: "success", message: "confirmationRequested" });
  });
  it("gives identical neutral guidance for unknown addresses, pending SMTP failures and cooldowns", async () => {
    const neutral = { status: "success", message: "confirmationRequested" };
    for (const error of [
      null,
      { code: "user_not_found" },
      { status: 429, code: "over_email_send_rate_limit" },
      { status: 500, message: "Error sending confirmation email: private detail" },
      { status: 503, code: "unexpected_failure" },
    ]) {
      mock.auth.resend.mockResolvedValue({ error });
      expect(await resendConfirmationAction("en", idle, form({ email: "ali@example.com" }))).toEqual(neutral);
    }
    mock.auth.resend.mockRejectedValue(new Error("private transport detail"));
    expect(await resendConfirmationAction("en", idle, form({ email: "ali@example.com" }))).toEqual(neutral);
    mock.auth.resend.mockClear();
    expect((await resendConfirmationAction("en", idle, form({ email: "bad" }))).message).toBe("invalidEmail");
    expect(mock.auth.resend).not.toHaveBeenCalled();
    mock.configured = false;
    expect((await resendConfirmationAction("en", idle, form({ email: "ali@example.com" }))).message).toBe("unavailable");
  });
  it("opens the account only after provider signup returns an authenticated user and session", async () => {
    mock.auth.signUp.mockResolvedValue({ data: { user, session: { user, access_token: "test" } }, error: null });
    await expect(signupAction("uz", idle, form({ email: "Ali@example.com", password: "valid password 123", repeatPassword: "valid password 123", displayName: "Ali", role: "admin", next: "https://evil.test" }))).rejects.toThrow("REDIRECT:/uz/account");
    expect(mock.auth.signUp).toHaveBeenCalledWith({ email: "ali@example.com", password: "valid password 123", options: { data: { display_name: "Ali", preferred_locale: "uz" } } });
    expect(mock.auth.signOut).not.toHaveBeenCalled();
  });
  it("does not submit signup when confirmation is enabled or settings cannot be verified", async () => {
    for (const settings of ["confirmation-required", "unavailable"]) {
      mock.settings.mockResolvedValue(settings);
      const result = await signupAction("en", idle, form({ email: "a@example.com", password: "valid password 123", repeatPassword: "valid password 123", displayName: "Ali" }));
      expect(result).toEqual({ status: "error", message: settings === "confirmation-required" ? "signupSetupRequired" : "unavailable" });
    }
    expect(mock.auth.signUp).not.toHaveBeenCalled();
  });
  it("never claims email delivery or successful signup without a session", async () => {
    const values = { email: "a@example.com", password: "valid password 123", repeatPassword: "valid password 123", displayName: "Ali" };
    for (const error of [null, { code: "user_already_exists" }, { code: "weak_password" }, { status: 429 }, { status: 500 }]) {
      mock.auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error });
      expect(await signupAction("en", idle, form(values))).toEqual({ status: "error", message: "registrationFailed" });
    }
    mock.auth.signUp.mockRejectedValue(new Error("private transport detail"));
    expect(await signupAction("en", idle, form(values))).toEqual({ status: "error", message: "registrationFailed" });
    expect(mock.redirect).not.toHaveBeenCalled();
  });
  it("rejects inconsistent signup sessions", async () => {
    mock.auth.signUp.mockResolvedValue({ data: { user, session: { user: { id: "different-user" } } }, error: null });
    expect((await signupAction("en", idle, form({ email: "a@example.com", password: "valid password 123", repeatPassword: "valid password 123", displayName: "Ali" }))).status).toBe("error");
    expect(mock.redirect).not.toHaveBeenCalled();
  });
  it("rejects invalid signup before calling provider and handles missing config honestly", async () => {
    expect((await signupAction("en", idle, form({ email: "bad" }))).message).toBe("invalidEmail");
    expect(mock.auth.signUp).not.toHaveBeenCalled();
    mock.configured = false;
    expect((await recoveryAction("en", idle, form({ email: "a@example.com" }))).message).toBe("unavailable");
  });
  it("rejects invalid credentials and does not follow an external login return URL", async () => {
    mock.auth.signInWithPassword.mockResolvedValueOnce({ error: { code: "invalid_credentials" } });
    expect((await loginAction("en", idle, form({ email: "ali@example.com", password: "password" }))).message).toBe("invalidCredentials");
    await expect(loginAction("en", idle, form({ email: "ali@example.com", password: "password", next: "//evil.test" }))).rejects.toThrow("REDIRECT:/en/account");
  });
  it("keeps recovery feedback identical for unknown accounts, SMTP failures and per-address cooldowns", async () => {
    for (const error of [null, { code: "user_not_found" }, { code: "over_email_send_rate_limit", status: 429 }, { status: 500, message: "Error sending recovery email: private detail" }, { status: 503 }]) {
      mock.auth.resetPasswordForEmail.mockResolvedValue({ data: null, error });
      expect(await recoveryAction("uz", idle, form({ email: "a@example.com" }))).toEqual({ status: "success", message: "recoverySent" });
    }
  });
  it("never treats an ordinary logged-in session as proof of recovery", async () => {
    expect((await resetPasswordAction("en", idle, form({ password: "long password 123", repeatPassword: "long password 123" }))).message).toBe("invalidLink");
    expect(mock.auth.updateUser).not.toHaveBeenCalled();
    expect(mock.auth.getUser).not.toHaveBeenCalled();
  });
  it("verifies recovery type and token before updating any password", async () => {
    mock.get.mockReturnValue({ value: JSON.stringify({ type: "recovery", token: "a".repeat(64) }) });
    mock.auth.verifyOtp.mockResolvedValueOnce({ error: { code: "otp_expired" } });
    expect((await resetPasswordAction("en", idle, form({ password: "long password 123", repeatPassword: "long password 123" }))).message).toBe("invalidLink");
    expect(mock.auth.updateUser).not.toHaveBeenCalled();
    await expect(resetPasswordAction("en", idle, form({ password: "long password 123", repeatPassword: "long password 123" }))).rejects.toThrow("REDIRECT:/en/account/login?notice=passwordUpdated");
    expect(mock.auth.verifyOtp).toHaveBeenLastCalledWith({ token_hash: "a".repeat(64), type: "recovery" });
    expect(mock.auth.updateUser).toHaveBeenCalledWith({ password: "long password 123" });
  });
  it("confirms signup only with a staged signup token", async () => {
    mock.get.mockReturnValue({ value: JSON.stringify({ type: "recovery", token: "a".repeat(64) }) });
    expect((await confirmEmailAction("en", idle, form({}))).message).toBe("invalidLink");
    expect(mock.auth.verifyOtp).not.toHaveBeenCalled();
    mock.get.mockReturnValue({ value: JSON.stringify({ type: "signup", token: "a".repeat(64) }) });
    await expect(confirmEmailAction("en", idle, form({}))).rejects.toThrow("REDIRECT:/en/account");
    expect(mock.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "a".repeat(64), type: "signup" });
  });
  it("updates only verified user's allowed profile fields, ignoring submitted UUID and role", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: user.id }, error: null });
    const eq = vi.fn(() => ({ select: () => ({ maybeSingle }) }));
    const update = vi.fn(() => ({ eq })); mock.from.mockReturnValue({ update });
    expect(await updateProfileAction("en", idle, form({ displayName: "New Name", preferredLocale: "ru", id: "other-user", role: "admin" }))).toEqual({ status: "success", message: "saved" });
    expect(update).toHaveBeenCalledWith({ display_name: "New Name", preferred_locale: "ru" });
    expect(eq).toHaveBeenCalledWith("id", user.id);
    mock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mock.from.mockClear();
    expect((await updateProfileAction("en", idle, form({ displayName: "New Name", preferredLocale: "ru" }))).message).toBe("invalidCredentials");
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("reports provider transport failures without exposing provider errors", async () => {
    mock.auth.resetPasswordForEmail.mockRejectedValue(new Error("sensitive provider details"));
    expect(await recoveryAction("en", idle, form({ email: "a@example.com" }))).toEqual({ status: "success", message: "recoverySent" });
    mock.auth.signOut.mockResolvedValue({ error: { message: "unavailable" } });
    expect((await logoutAction("en", idle, form({}))).message).toBe("unavailable");
  });
  it("acknowledges recovery attempts neutrally while reporting login service failures", async () => {
    for (const error of [{ name: "AuthRetryableFetchError", status: 0 }, { code: "over_request_rate_limit", status: 429 }, { code: "unexpected_failure", status: 503 }]) {
      mock.auth.resetPasswordForEmail.mockResolvedValue({ error });
      expect((await recoveryAction("en", idle, form({ email: "a@example.com" }))).message).toBe("recoverySent");
      mock.auth.signInWithPassword.mockResolvedValue({ error });
      expect((await loginAction("en", idle, form({ email: "a@example.com", password: "password" }))).message).toBe("unavailable");
    }
  });
  it("retains staged tokens during retryable confirmation and recovery failures", async () => {
    for (const type of ["signup", "recovery"] as const) {
      mock.get.mockReturnValue({ value: JSON.stringify({ type, token: "a".repeat(64) }) });
      mock.auth.verifyOtp.mockResolvedValue({ error: { name: "AuthRetryableFetchError", status: 0 } });
      mock.set.mockClear();
      const result = type === "signup" ? await confirmEmailAction("en", idle, form({})) : await resetPasswordAction("en", idle, form({ password: "long password 123", repeatPassword: "long password 123" }));
      expect(result.message).toBe("unavailable");
      expect(mock.set).not.toHaveBeenCalled();
    }
  });
  it("reports password-change partial success with a signout retry rather than redirecting with full success", async () => {
    mock.get.mockReturnValue({ value: JSON.stringify({ type: "recovery", token: "a".repeat(64) }) });
    mock.auth.signOut.mockResolvedValue({ error: { status: 503 } });
    expect(await resetPasswordAction("en", idle, form({ password: "long password 123", repeatPassword: "long password 123" }))).toEqual({ status: "success", message: "passwordUpdatedSignoutFailed" });
    expect(mock.redirect).not.toHaveBeenCalled();
  });
});
