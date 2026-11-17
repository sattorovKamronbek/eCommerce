import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => {
  const mfa = { listFactors: vi.fn(), getAuthenticatorAssuranceLevel: vi.fn(), enroll: vi.fn(), challengeAndVerify: vi.fn(), unenroll: vi.fn() };
  return { mfa, getUser: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) };
});
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: async () => ({ auth: { getUser: mock.getUser, mfa: mock.mfa } }) }));
import { beginMfaSetup, verifyMfaCode, removeUnverifiedMfa } from "@/app/(marketplace)/[locale]/account/security/actions";

const factor = "00000000-0000-4000-8000-000000000001";
function form(values: Record<string, string>) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
beforeEach(() => {
  vi.clearAllMocks();
  mock.getUser.mockResolvedValue({ data: { user: { id: "account", email_confirmed_at: "now" } }, error: null });
  mock.mfa.listFactors.mockResolvedValue({ data: { all: [], totp: [] }, error: null });
  mock.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal1", nextLevel: "aal1" }, error: null });
});

describe("provider-backed MFA actions", () => {
  it("requires a verified provider user before creating a factor", async () => {
    mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await beginMfaSetup("en", {}, form({}))).toEqual({ error: "unavailable" });
    expect(mock.mfa.enroll).not.toHaveBeenCalled();
  });
  it("does not enroll a second factor from an unverified session", async () => {
    mock.mfa.listFactors.mockResolvedValue({ data: { all: [{ id: factor, status: "verified", factor_type: "totp" }], totp: [{ id: factor }] }, error: null });
    expect(await beginMfaSetup("en", {}, form({}))).toEqual({ error: "stepUpRequired" });
    expect(mock.mfa.enroll).not.toHaveBeenCalled();
  });
  it("returns setup material only after a successful provider enrollment", async () => {
    mock.mfa.enroll.mockResolvedValue({ data: { id: factor, type: "totp", totp: { qr_code: "data:image/svg+xml;utf-8,<svg></svg>", secret: "TESTSECRET", uri: "otpauth://test" } }, error: null });
    expect(await beginMfaSetup("en", {}, form({}))).toEqual({ setup: { factorId: factor, qr: "data:image/svg+xml;utf-8,<svg></svg>", secret: "TESTSECRET" } });
    mock.mfa.enroll.mockResolvedValue({ data: null, error: { message: "private provider error" } });
    expect(await beginMfaSetup("en", {}, form({}))).toEqual({ error: "unavailable" });
  });
  it("accepts realistic provider SVG payload sizes", async () => {
    const qr = "data:image/svg+xml;utf-8,<svg>" + "<rect width='1' height='1' fill='white'/>".repeat(1500) + "</svg>";
    mock.mfa.enroll.mockResolvedValue({ data: { id: factor, type: "totp", totp: { qr_code: qr, secret: "TESTSECRET" } }, error: null });
    expect((await beginMfaSetup("en", {}, form({}))).setup?.qr).toBe(qr);
  });
  it("verifies only a factor belonging to the current account and never follows an external return URL", async () => {
    mock.mfa.listFactors.mockResolvedValue({ data: { all: [{ id: factor, status: "verified", factor_type: "totp" }], totp: [{ id: factor }] }, error: null });
    expect(await verifyMfaCode("en", {}, form({ factorId: "00000000-0000-4000-8000-000000000002", code: "123456" }))).toEqual({ error: "invalid" });
    expect(mock.mfa.challengeAndVerify).not.toHaveBeenCalled();
    mock.mfa.challengeAndVerify.mockResolvedValue({ data: { access_token: "provider-session" }, error: null });
    mock.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal2", nextLevel: "aal2" }, error: null });
    await expect(verifyMfaCode("en", {}, form({ factorId: factor, code: "123456", next: "//evil.test" }))).rejects.toThrow("REDIRECT:/en/account");
    expect(mock.mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: factor, code: "123456" });
  });
  it("never removes an already verified factor through unfinished-setup cleanup", async () => {
    mock.mfa.listFactors.mockResolvedValue({ data: { all: [{ id: factor, status: "verified", factor_type: "totp" }], totp: [{ id: factor }] }, error: null });
    expect(await removeUnverifiedMfa("en", {}, form({ factorId: factor }))).toEqual({ error: "invalid" });
    expect(mock.mfa.unenroll).not.toHaveBeenCalled();
  });
  it("permits recovery of an unfinished first setup and honors provider refusal", async () => {
    mock.mfa.listFactors.mockResolvedValue({ data: { all: [{ id: factor, status: "unverified", factor_type: "totp" }], totp: [] }, error: null });
    expect(await beginMfaSetup("en", {}, form({}))).toEqual({ error: "pendingSetup" });
    mock.mfa.unenroll.mockResolvedValueOnce({ error: { message: "factor was verified" } }).mockResolvedValueOnce({ error: null });
    expect(await removeUnverifiedMfa("en", {}, form({ factorId: factor }))).toEqual({ error: "unavailable" });
    await expect(removeUnverifiedMfa("en", {}, form({ factorId: factor }))).rejects.toThrow("REDIRECT:/en/account/security");
  });
});
