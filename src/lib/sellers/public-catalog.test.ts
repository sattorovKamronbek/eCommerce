// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { loadPublicCs2Variants, loadPublicListings } from "./public-catalog";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({
  getAuthConfig: () => ({ url: "https://example.supabase.co", key: "sb_publishable_fixture", origin: "https://example.test" }),
}));

beforeEach(() => {
  vi.stubGlobal("WebSocket", class {
    constructor() { throw new Error("Catalog reads must not connect to Realtime."); }
  });
});
afterEach(() => vi.unstubAllGlobals());

it("reports an unavailable catalog without retrying the visitor's listing request", async () => {
  const fetch = vi.fn(async () => Response.json({ message: "Unavailable" }, {
    status: 503, headers: { "Retry-After": "0" },
  }));
  vi.stubGlobal("fetch", fetch);
  const client = createPublicSupabaseClient()!;

  await expect(loadPublicListings(client, "fashion", { q: "", page: 1, sort: "recent" })).resolves
    .toEqual({ rows: [], hasNext: false, error: true });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("matches category, model and wear as exact CS2 fields without affecting Fashion", async () => {
  const fetch = vi.fn<(request: string | URL) => Promise<Response>>().mockImplementation(async () => Response.json([]));
  vi.stubGlobal("fetch", fetch);
  const client = createPublicSupabaseClient()!;
  const filters = { q: "", page: 2, sort: "price-asc", cs2: { category: "pistol", model: "Desert Eagle", wear: "FT" } } as const;

  await loadPublicListings(client, "cs2", filters, 3);
  await loadPublicListings(client, "fashion", filters, 3);
  const cs2Request = new URL(fetch.mock.calls[0][0]);
  expect(cs2Request.pathname).toBe("/rest/v1/marketplace_public_listings");
  const cs2 = cs2Request.searchParams;
  expect(cs2.get("select")?.split(",")).toEqual(expect.arrayContaining(["id", "cs2_images", "available"]));
  expect(cs2.get("select")?.split(",")).not.toContain("description");
  expect(cs2.get("cs2_category")).toBe("eq.pistol");
  expect(cs2.get("cs2_model")).toBe("eq.Desert Eagle");
  expect(cs2.get("cs2_wear")).toBe("eq.FT");
  expect(cs2.get("offset")).toBe("3");
  const fashionRequest = new URL(fetch.mock.calls[1][0]);
  expect(fashionRequest.pathname).toBe("/rest/v1/marketplace_public_fashion_catalog");
  const fashion = fashionRequest.searchParams;
  expect([...fashion.keys()].some(key => key.startsWith("cs2_"))).toBe(false);
  expect(fashion.get("select")?.split(",")).toContain("fashion_images");
  expect(fashion.get("select")?.split(",")).not.toContain("fashion_size_guide");
});

it("looks up public sibling offers using the same group, model and title", async () => {
  const sibling = { id: "sibling", cs2_wear: "MW", price_tiyin: 5_000_000 };
  const fetch = vi.fn<(request: string | URL) => Promise<Response>>().mockImplementation(async () => Response.json([sibling]));
  vi.stubGlobal("fetch", fetch);
  const client = createPublicSupabaseClient()!;

  await expect(loadPublicCs2Variants(client, {
    id: "current", title: "Redline", cs2_group_key: "group", cs2_model: "AK-47", cs2_wear: "FN",
  })).resolves.toEqual([sibling]);
  const request = new URL(fetch.mock.calls[0][0]);
  expect(request.pathname).toBe("/rest/v1/marketplace_public_listings");
  expect(request.searchParams.get("ecosystem")).toBe("eq.cs2");
  expect(request.searchParams.get("cs2_group_key")).toBe("eq.group");
  expect(request.searchParams.get("cs2_model")).toBe("eq.AK-47");
  expect(request.searchParams.get("title")).toBe("eq.Redline");
  expect(request.searchParams.get("id")).toBe("neq.current");
  expect(request.searchParams.get("cs2_wear")).toBe("neq.NP");

  await expect(loadPublicCs2Variants(client, {
    id: "unpainted", title: "Redline", cs2_group_key: "group", cs2_model: "AK-47", cs2_wear: "NP",
  })).resolves.toEqual([]);
  expect(fetch).toHaveBeenCalledTimes(1);
});
