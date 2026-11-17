import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ requireAdmin: vi.fn(), rpc: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAdmin: mock.requireAdmin }));
import { moderateListing } from "@/app/(marketplace)/[locale]/admin/listings/actions";

const id = "00000000-0000-4000-8000-000000000001";
function form(values: Record<string, string>) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
beforeEach(() => { vi.clearAllMocks(); mock.requireAdmin.mockResolvedValue({ kind: "admin", client: { rpc: mock.rpc } }); mock.rpc.mockResolvedValue({ error: null }); });

it("does not moderate without administrator access and uses the protected RPC for a valid action", async () => {
  mock.requireAdmin.mockResolvedValueOnce({ kind: "denied" });
  await expect(moderateListing("en", form({ id, action: "archive" }))).rejects.toThrow("REDIRECT:/en/admin/listings?error=unavailable");
  expect(mock.rpc).not.toHaveBeenCalled();
  await expect(moderateListing("en", form({ id, action: "archive" }))).rejects.toThrow("REDIRECT:/en/admin/listings");
  expect(mock.rpc).toHaveBeenCalledWith("marketplace_admin_archive_listing", { p_listing_id: id });
});
