// @vitest-environment node
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import PublicListing from "@/app/(marketplace)/[locale]/listings/[ecosystem]/[id]/page";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({
  getAuthConfig: () => ({ url: "https://example.supabase.co", key: "sb_publishable_fixture", origin: "https://example.test" }),
}));

const productId = "ec1ae7c8-8b84-4cc9-88a2-b09c6e91be1e";
const blackId = "33967855-712a-4090-a9c3-1fe23558c825";
const whiteId = "32d45646-725e-4d21-aabf-1301ecac4dc1";
const blackMId = "15077f01-4b90-4e83-8f18-c8be72e7ed41";
const blackLId = "15077f01-4b90-4e83-8f18-c8be72e7ed42";
const whiteMId = "15077f01-4b90-4e83-8f18-c8be72e7ed43";
const whiteLId = "15077f01-4b90-4e83-8f18-c8be72e7ed44";
const blackImages = ["8c5db3fd-6802-4db3-8443-e689bfac77fc.webp", "bf79f190-8a79-4f7b-8fb5-c0244fd68556.webp"];
const whiteImages = ["e27e7dc4-9ad2-41f7-95e4-100da9f67e93.webp"];
const product = {
  ecosystem: "fashion",
  title: "Cotton Polo",
  description: "A cotton polo with a ribbed collar.",
  category: "Polo shirts",
  cs2_images: [],
  fashion_product_id: productId,
  fashion_brand: "North Branch",
  fashion_material: "100% cotton",
  fashion_fit: "Regular",
  fashion_care: "Wash cold",
  fashion_size_guide: [{ size: "M", measurements: "Chest 98" }, { size: "L", measurements: "Chest 104" }],
};
const variants = [
  { ...product, id: blackMId, fashion_color_id: blackId, fashion_color: "Black", fashion_size: "M", fashion_images: blackImages, available: true, price_tiyin: 12000000 },
  { ...product, id: blackLId, fashion_color_id: blackId, fashion_color: "Black", fashion_size: "L", fashion_images: blackImages, available: true, price_tiyin: 13000000 },
  { ...product, id: whiteMId, fashion_color_id: whiteId, fashion_color: "White", fashion_size: "M", fashion_images: whiteImages, available: true, price_tiyin: 17000000 },
  { ...product, id: whiteLId, fashion_color_id: whiteId, fashion_color: "White", fashion_size: "L", fashion_images: whiteImages, available: false, price_tiyin: 18000000 },
];

function renderMarkup(element: ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    output.setEncoding("utf8");
    let html = "";
    output.on("data", (chunk) => { html += chunk; });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(element, { onAllReady() { stream.pipe(output); }, onError: reject });
  });
}

async function renderListing(id: string) {
  return renderMarkup(await PublicListing({
    params: Promise.resolve({ locale: "en", ecosystem: "fashion", id }),
    searchParams: Promise.resolve({ q: "polo", sort: "price-asc", from: "search" }),
  }));
}

function installCatalogFixture() {
  vi.stubGlobal("WebSocket", class {
    constructor() { throw new Error("Catalog reads must not connect to Realtime."); }
  });
  const fetch = vi.fn(async (input: string | URL) => {
    const url = new URL(input);
    const selectedId = url.searchParams.get("id");
    if (url.pathname.endsWith("/marketplace_checkout_offers")) {
      const listingId = url.searchParams.get("listing_id");
      // Force the page to enforce public availability even if a quote was still returned.
      return Response.json([{ listing_id: listingId?.slice(3) }]);
    }
    const groupFilter = url.searchParams.get("fashion_product_id");
    if (groupFilter === `eq.${productId}`) {
      return Response.json(variants.filter(({ id }) => selectedId !== `neq.${id}`));
    }
    return Response.json(variants.filter(({ id }) => selectedId === `eq.${id}`));
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

it("links to the available color alternative, retains search context and reserves the current size", async () => {
  installCatalogFixture();

  const html = await renderListing(blackLId);

  expect(html).toContain(`/fashion-images/${blackId}/${blackImages[0]}`);
  expect(html).toContain(`/fashion-images/${blackId}/${blackImages[1]}`);
  expect(html).not.toContain(`/fashion-images/${whiteId}`);
  expect(html).toContain(`/en/listings/fashion/${whiteMId}?q=polo&amp;sort=price-asc&amp;from=search`);
  expect(html).not.toContain(`/en/listings/fashion/${whiteLId}`);
  expect(html).toContain(`/en/account/checkout/fashion/${blackLId}`);
  expect(html).toContain("/en/search?q=polo&amp;sort=price-asc");
  for (const text of ["North Branch", "100% cotton", "Regular", "Wash cold", "Chest 104", "cm"]) {
    expect(html).toContain(text);
  }
});

it("shows the selected out-of-stock size and color with no checkout query", async () => {
  const fetch = installCatalogFixture();

  const html = await renderListing(whiteLId);

  expect(html).toContain(`/fashion-images/${whiteId}/${whiteImages[0]}`);
  expect(html).toContain(`/en/listings/fashion/${blackLId}?q=polo&amp;sort=price-asc&amp;from=search`);
  expect(html).toContain("Seller reports out of stock");
  expect(html).not.toContain("/account/checkout/fashion/");
  expect(fetch.mock.calls.some(([url]) => url.toString().includes("marketplace_checkout_offers"))).toBe(false);
});
