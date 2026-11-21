import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ requireAccount: vi.fn(), insert: vi.fn(), from: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccount: mock.requireAccount }));
import { createListing, updateListing } from "@/app/(marketplace)/[locale]/seller/products/actions";

const seller = "00000000-0000-4000-8000-000000000001";
function form(values: Record<string, string>) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
const valid = { ecosystem: "cs2", title: "Rifle", description: "Details", category: "", variant: "", price: "10.50", quantity: "1", state: "draft", seller_id: "another-user" };
beforeEach(() => {
  vi.clearAllMocks();
  mock.requireAccount.mockResolvedValue({ user: { id: seller }, client: { from: mock.from } });
  mock.from.mockReturnValue({ insert: mock.insert });
  mock.insert.mockResolvedValue({ error: null });
});

it("creates listings only for the authenticated seller and computes exact money on the server", async () => {
  await expect(createListing("en", {}, form(valid))).rejects.toThrow("REDIRECT:/en/seller/products");
  expect(mock.from).toHaveBeenCalledWith("marketplace_listings");
  expect(mock.insert).toHaveBeenCalledWith({ seller_id: seller, ecosystem: "cs2", title: "Rifle", description: "Details", category: "", variant: "", price_tiyin: 1050, quantity: 1, state: "draft" });
});

it("rejects invalid item details before reaching the database", async () => {
  expect(await createListing("en", {}, form({ ...valid, price: "1e6" }))).toEqual({ error: "invalid" });
  expect(mock.from).not.toHaveBeenCalled();
});

it("rejects seller edits based on a listing fetched before an inventory change", async () => {
  const id = "10000000-0000-4000-8000-000000000001";
  const updatedAt = "2026-11-21T08:00:00.124502+00:00";
  const select = vi.fn().mockReturnValue({ maybeSingle: async () => ({ data: null, error: null }) });
  const filters = { eq: vi.fn(), select };
  filters.eq.mockReturnValue(filters);
  mock.from.mockReturnValue({ update: vi.fn().mockReturnValue(filters) });
  expect(await updateListing("en", id, updatedAt, {}, form(valid))).toEqual({ error: "changed" });
  expect(filters.eq).toHaveBeenCalledWith("updated_at", updatedAt);
  expect(mock.redirect).not.toHaveBeenCalled();
});
