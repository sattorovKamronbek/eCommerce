import { cleanup, render, screen, within } from "@testing-library/react";
import { createClient } from "@supabase/supabase-js";
import { afterEach, expect, it, vi } from "vitest";
import SellerProducts from "@/app/(marketplace)/[locale]/seller/products/page";
import EditListing from "@/app/(marketplace)/[locale]/seller/products/[id]/page";
import type { Database, SellerListing } from "@/lib/supabase/database";

vi.mock("server-only", () => ({}));
const { requireSeller } = vi.hoisted(() => ({ requireSeller: vi.fn() }));
vi.mock("@/lib/sellers/access", () => ({ requireSeller }));
vi.mock("@/components/account/listing-form", () => ({ ListingForm: () => null }));

afterEach(cleanup);

const sellerId = "10000000-0000-4000-8000-000000000000";
const fixture: SellerListing = {
  id: "20000000-0000-4000-8000-000000000001",
  seller_id: sellerId, seller_revision: 1, ecosystem: "cs2", title: "CS2 setup missing",
  description: "", category: "rifles", variant: "FN", price_tiyin: 100_000, quantity: 1,
  state: "published", moderation_status: "allowed", created_at: "2026-11-21", updated_at: "2026-11-21",
  cs2_group_id: null, cs2_category: null, cs2_model: null, cs2_wear: null,
  cs2_images: [], cs2_group_primary: true,
};
const configured = { ...fixture, id: "20000000-0000-4000-8000-000000000002", title: "CS2 configured" };
const fashion: SellerListing = { ...fixture, id: "20000000-0000-4000-8000-000000000003", title: "Fashion listing", ecosystem: "fashion" };
const archived: SellerListing = { ...fixture, id: "20000000-0000-4000-8000-000000000004", title: "Archived CS2", state: "archived" };
const draft: SellerListing = { ...fixture, id: "20000000-0000-4000-8000-000000000005", title: "Draft CS2", state: "draft" };
const blocked: SellerListing = { ...fixture, id: "20000000-0000-4000-8000-000000000006", title: "Blocked CS2", moderation_status: "blocked" };
const params = Promise.resolve({ locale: "en" });
let clientNumber = 0;

function useSeller({ edit = false, termsStatus = 200 } = {}) {
  const termsQueries: URLSearchParams[] = [];
  const client = createClient<Database>("https://seller-products.example", "sb_publishable_example", {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: `seller-products-${clientNumber++}` },
    global: { fetch: async input => {
      const url = new URL(String(input));
      const isTerms = url.pathname.endsWith("/marketplace_checkout_terms");
      if (isTerms) termsQueries.push(url.searchParams);
      const terms = termsStatus === 200 ? (edit ? [] : [{ listing_id: configured.id }]) : { code: "PGRST205" };
      const products = edit ? [fixture] : [fixture, configured, fashion, archived, draft, blocked];
      return Response.json(isTerms ? terms : products, { status: isTerms ? termsStatus : 200 });
    } },
  });
  requireSeller.mockResolvedValue({ kind: "seller", account: { client, user: { id: sellerId } }, scope: "both" });
  return termsQueries;
}

function product(title: string) {
  const article = screen.getByRole("heading", { name: title }).closest("article");
  if (!article) throw new Error("Expected a seller listing article");
  return within(article);
}

it("points published CS2 variants with missing terms to their reservation form", async () => {
  const termsQueries = useSeller();
  render(await SellerProducts({ params, searchParams: Promise.resolve({}) }));

  const missing = product(fixture.title);
  expect(missing.getByText("CS2 skins · Published")).toBeVisible();
  expect(missing.getByText(/buyers can’t reserve this variant yet/i)).toBeVisible();
  expect(missing.getByRole("link", { name: "Set up reservations" })).toHaveAttribute("href", `/en/seller/products/${fixture.id}#reservation-settings`);
  expect(product(draft.title).getByRole("link", { name: "Set up reservations" })).toBeVisible();
  expect(product(draft.title).queryByText(/buyers can’t reserve/i)).not.toBeInTheDocument();
  for (const item of [configured, fashion, archived, blocked]) {
    expect(product(item.title).queryByRole("link", { name: "Set up reservations" })).not.toBeInTheDocument();
  }
  expect(termsQueries).toHaveLength(1);
  expect(termsQueries[0].get("select")).toBe("listing_id");
  expect(termsQueries[0].get("listing_id")).toBe(`in.(${fixture.id},${configured.id},${draft.id})`);
});

it("keeps seller listings visible when reservation terms cannot be checked", async () => {
  useSeller({ termsStatus: 404 });
  render(await SellerProducts({ params, searchParams: Promise.resolve({}) }));

  expect(product(fixture.title).getByText("CS2 skins · Published")).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent("Order services are currently unavailable.");
  expect(screen.queryByRole("link", { name: "Set up reservations" })).not.toBeInTheDocument();
});

it("puts the existing seller contact and asset ID fields at the reservation settings anchor", async () => {
  useSeller({ edit: true });
  render(await EditListing({ params: Promise.resolve({ locale: "en", id: fixture.id }) }));

  const section = screen.getByRole("heading", { name: "Direct payment settings" }).closest("section");
  expect(section).toHaveAttribute("id", "reservation-settings");
  expect(screen.getByLabelText("Seller’s payment contact")).toBeRequired();
  expect(screen.getByLabelText("Seller-provided CS2 asset ID")).toBeRequired();
});
