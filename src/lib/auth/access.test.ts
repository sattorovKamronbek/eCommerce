import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ available: true, getUser: vi.fn(), assurance: vi.fn(), maybeSingle: vi.fn(), from: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: async () => mock.available ? { auth: { getUser: mock.getUser, mfa: { getAuthenticatorAssuranceLevel: mock.assurance } }, from: mock.from } : null }));
import { requireAccount, requireAdmin } from "./access";
beforeEach(() => {
  mock.available = true;
  vi.clearAllMocks();
  mock.getUser.mockResolvedValue({ data: { user: { id: "verified-user", email_confirmed_at: "2026-11-11", factors: [{ status: "verified" }] } }, error: null });
  mock.assurance.mockResolvedValue({ data: { currentLevel: "aal2" }, error: null });
  const query = { select: () => query, eq: () => query, maybeSingle: mock.maybeSingle };
  mock.from.mockReturnValue(query);
  mock.maybeSingle.mockResolvedValue({ data: null, error: null });
});
it("requires provider-verified identity even on direct admin requests", async () => {
  mock.getUser.mockResolvedValue({ data: { user: null }, error: { name: "AuthSessionMissingError" } });
  await expect(requireAdmin("en", "/en/admin/users")).rejects.toThrow("REDIRECT:/en/account/login?next=%2Fen%2Fadmin%2Fusers");
  expect(mock.from).not.toHaveBeenCalled();
});
it("fails closed without configuration or on provider/database errors", async () => {
  mock.available = false; expect(await requireAccount("en")).toBeNull();
  mock.available = true; mock.getUser.mockRejectedValueOnce(new Error("offline"));
  expect(await requireAdmin("en")).toEqual({ kind: "unavailable" });
  mock.maybeSingle.mockResolvedValue({ data: null, error: { code: "PGRST205" } });
  expect(await requireAdmin("en")).toEqual({ kind: "unavailable" });
});
it("reads current admin assignments on every request and denies a revoked role", async () => {
  mock.maybeSingle.mockResolvedValueOnce({ data: { role: "admin" }, error: null });
  expect((await requireAdmin("en")).kind).toBe("admin");
  expect((await requireAdmin("en")).kind).toBe("denied");
  expect(mock.maybeSingle).toHaveBeenCalledTimes(2);
});
it("allows an explicitly assigned owner to access administrator pages", async () => {
  let onlyAdmin = false;
  const query = { select: () => query, eq: (column: string, value: string) => { if (column === "role" && value === "admin") onlyAdmin = true; return query; }, maybeSingle: async () => ({ data: onlyAdmin ? null : { role: "owner" }, error: null }) };
  mock.from.mockReturnValue(query);
  expect((await requireAdmin("en")).kind).toBe("admin");
});

it("requires MFA for enrolled users while allowing access to the security page", async () => {
  mock.getUser.mockResolvedValue({ data: { user: { id: "verified-user", email_confirmed_at: "now", factors: [{ status: "verified" }] } }, error: null });
  mock.assurance.mockResolvedValue({ data: { currentLevel: "aal1" }, error: null });
  await expect(requireAccount("en", "/en/account")).rejects.toThrow("REDIRECT:/en/account/security?next=%2Fen%2Faccount");
  expect(await requireAccount("en", "/en/account/security", { allowMfaPending: true })).not.toBeNull();
});
it("requires admins to step up even before they enroll MFA", async () => {
  mock.maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
  mock.getUser.mockResolvedValue({ data: { user: { id: "verified-user", email_confirmed_at: "now", factors: [] } }, error: null });
  mock.assurance.mockResolvedValue({ data: { currentLevel: "aal1" }, error: null });
  await expect(requireAdmin("en", "/en/admin/users")).rejects.toThrow("REDIRECT:/en/account/security?next=%2Fen%2Fadmin%2Fusers");
});
