import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database, Profile } from "@/lib/supabase/database";
vi.mock("server-only", () => ({}));
import { adminUsersHref, loadAdminProfiles, parseAdminFilters } from "./admin-users";

describe("administrator profile filtering", () => {
  it("bounds untrusted query values and rejects repeated language/page parameters", () => {
    expect(parseAdminFilters({ q: "  Ali  ", language: "uz", page: "2" })).toEqual({ q: "Ali", language: "uz", page: 2 });
    expect(parseAdminFilters({ q: ["Ali", "other"], language: ["uz", "ru"], page: ["2", "3"] })).toEqual({ q: "", language: "", page: 1 });
    expect(parseAdminFilters({ q: "x".repeat(200), language: "admin", page: "999999999" })).toEqual({ q: "x".repeat(80), language: "", page: 1 });
    expect(parseAdminFilters({ q: "Ali\n", language: "en", page: "-1" }).q).toBe("");
  });
  it("preserves literal search and supported language when paging", () => {
    const href = adminUsersHref("ru", { q: "Ali & 50%", language: "uz", page: 2 }, 3);
    const url = new URL(href, "https://app.test");
    expect(url.pathname).toBe("/ru/admin/users");
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: "Ali & 50%", language: "uz", page: "3" });
    expect(adminUsersHref("en", { q: "", language: "", page: 1 }, 1)).toBe("/en/admin/users");
  });
  it("queries literal wildcard characters with deterministic pagination and one-row lookahead", async () => {
    let request: URL | undefined;
    const rows = Array.from({ length: 21 }, (_, i): Profile => ({ id: String(i), display_name: "Profile", preferred_locale: "uz", created_at: "2026-11-12T00:00:00Z", updated_at: "2026-11-12T00:00:00Z" }));
    const client = createClient<Database>("https://example.supabase.co", "sb_publishable_example", {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: async input => { request = new URL(String(input)); return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } }); } },
    });
    const result = await loadAdminProfiles(client, { q: "50%_\\*", language: "uz", page: 2 });
    expect(result.rows).toHaveLength(20);
    expect(result.hasNext).toBe(true);
    expect(result.error).toBe(false);
    expect(request?.searchParams.get("display_name")).toBe(String.raw`imatch.50%_\\\*`);
    expect(request?.searchParams.get("preferred_locale")).toBe("eq.uz");
    expect(request?.searchParams.get("order")).toBe("created_at.desc,id.desc");
    expect(request?.searchParams.get("offset")).toBe("20");
    expect(request?.searchParams.get("limit")).toBe("21");
    expect(request?.searchParams.get("select")).not.toContain("email");
  });
  it("returns an honest unavailable result without rows on database failure", async () => {
    const client = createClient<Database>("https://example.supabase.co", "sb_publishable_example", {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: async () => new Response(JSON.stringify({ code: "42501", message: "private provider detail" }), { status: 403 }) },
    });
    expect(await loadAdminProfiles(client, { q: "", language: "", page: 1 })).toEqual({ rows: [], hasNext: false, error: true });
  });
});
