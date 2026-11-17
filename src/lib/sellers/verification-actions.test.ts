import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ requireAccount: vi.fn(), requireAdmin: vi.fn(), rpc: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccount: mock.requireAccount, requireAdmin: mock.requireAdmin }));
import { createSellerChallenge, reviewSeller } from "@/app/(marketplace)/[locale]/seller/actions";

const applicant = "00000000-0000-4000-8000-000000000001";
const code = "a".repeat(64);
function form(values: Record<string, string>) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
beforeEach(() => {
  vi.clearAllMocks();
  mock.requireAdmin.mockResolvedValue({ kind: "admin", client: { rpc: mock.rpc } });
  mock.requireAccount.mockResolvedValue({ user: { id: applicant }, client: { rpc: mock.rpc } });
  mock.rpc.mockResolvedValue({ data: null, error: null });
});

it("never approves a seller without the site's one-time account-control code", async () => {
  await expect(reviewSeller("en", form({ applicant, revision: "1", decision: "approved" }))).rejects.toThrow("REDIRECT:/en/admin/sellers?error=unavailable");
  expect(mock.rpc).not.toHaveBeenCalled();
  await expect(reviewSeller("en", form({ applicant, revision: "1", decision: "approved", verificationCode: code, identityVerified: "yes" }))).rejects.toThrow("REDIRECT:/en/admin/sellers");
  expect(mock.rpc).toHaveBeenCalledWith("marketplace_verify_seller", { p_applicant_id: applicant, p_revision: 1, p_code: code });
});

it("returns a challenge only when the protected database function issues one", async () => {
  mock.rpc.mockResolvedValueOnce({ data: code, error: null }).mockResolvedValueOnce({ data: null, error: { message: "private" } });
  expect(await createSellerChallenge("en", {}, form({}))).toEqual({ code });
  expect(await createSellerChallenge("en", {}, form({}))).toEqual({ error: "unavailable" });
});
