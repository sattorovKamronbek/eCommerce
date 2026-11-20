import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAdmin: mock.requireAdmin }));
import SellerReviews from "@/app/(marketplace)/[locale]/admin/sellers/page";

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
const props = { params: Promise.resolve({ locale: "en" }), searchParams: Promise.resolve({}) };
let clientNumber = 0;
function clientWithError(status: number, code: string) {
  return createClient<Database>("https://example.supabase.co", "sb_publishable_example", {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: `test-${code}-${clientNumber++}` },
    global: { fetch: async () => new Response(JSON.stringify({ code, message: "private provider details" }), { status, headers: { "Content-Type": "application/json" } }) },
  });
}
it("explains missing seller setup instead of reporting an account outage", async () => {
  mock.requireAdmin.mockResolvedValue({ kind: "admin", client: clientWithError(404, "PGRST205") });
  render(await SellerReviews(props));
  expect(screen.getByRole("heading", { name: "Seller service is not configured" })).toBeVisible();
  expect(screen.getByText("Complete the seller database setup for this project, then try again.")).toBeVisible();
  expect(screen.queryByText(/private provider details/)).not.toBeInTheDocument();
});
it("keeps unrelated database failures generic", async () => {
  mock.requireAdmin.mockResolvedValue({ kind: "admin", client: clientWithError(400, "22023") });
  render(await SellerReviews(props));
  expect(screen.getByRole("heading", { name: "Account service unavailable" })).toBeVisible();
});

it("also explains missing listing moderation setup", async () => {
  const client = clientWithError(404, "PGRST205");
  vi.spyOn(client.auth.mfa, "getAuthenticatorAssuranceLevel").mockResolvedValue({ data: { currentLevel: "aal2", nextLevel: "aal2", currentAuthenticationMethods: [] }, error: null });
  mock.requireAdmin.mockResolvedValue({ kind: "admin", client });
  const { default: AdminListings } = await import("@/app/(marketplace)/[locale]/admin/listings/page");
  render(await AdminListings(props));
  expect(screen.getByRole("heading", { name: "Seller service is not configured" })).toBeVisible();
});
