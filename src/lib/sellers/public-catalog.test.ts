// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { loadPublicListings } from "./public-catalog";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({
  getAuthConfig: () => ({ url: "https://example.supabase.co", key: "sb_publishable_fixture", origin: "https://example.test" }),
}));

afterEach(() => vi.unstubAllGlobals());

it("reports an unavailable catalog without retrying the visitor's listing request", async () => {
  const fetch = vi.fn(async () => Response.json({ message: "Unavailable" }, {
    status: 503, headers: { "Retry-After": "0" },
  }));
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("WebSocket", class {
    constructor() { throw new Error("Catalog reads must not connect to Realtime."); }
  });
  const client = createPublicSupabaseClient()!;

  await expect(loadPublicListings(client, "fashion", { q: "", page: 1, sort: "recent" })).resolves
    .toEqual({ rows: [], hasNext: false, error: true });
  expect(fetch).toHaveBeenCalledTimes(1);
});
