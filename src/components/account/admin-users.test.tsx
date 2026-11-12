import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database, Profile } from "@/lib/supabase/database";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAdmin: mock.requireAdmin }));
import AdminUsers from "@/app/(marketplace)/[locale]/admin/users/page";

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
const props = { params: Promise.resolve({ locale: "en" }), searchParams: Promise.resolve({ q: "Ali", language: "uz", page: "2" }) };

it("denies a customer's direct users request before querying profiles", async () => {
  mock.requireAdmin.mockResolvedValue({ kind: "denied" });
  render(await AdminUsers(props));
  expect(mock.requireAdmin).toHaveBeenCalledWith("en", "/en/admin/users");
  expect(screen.getByRole("heading", { name: "Administrator access required" })).toBeVisible();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
});

it("renders authorized SDK profile results and preserves both filters in pagination", async () => {
  const rows = Array.from({ length: 21 }, (_, i): Profile => ({ id: `test-fixture-${i}`, display_name: `Ali ${i}`, preferred_locale: "uz", created_at: "2026-11-12T00:00:00Z", updated_at: "2026-11-12T00:00:00Z" }));
  const client = createClient<Database>("https://example.supabase.co", "sb_publishable_example", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async () => new Response(JSON.stringify(rows), { status: 200 }) },
  });
  mock.requireAdmin.mockResolvedValue({ kind: "admin", client });
  render(await AdminUsers(props));
  expect(screen.getByLabelText("Search by name")).toHaveValue("Ali");
  expect(screen.getByLabelText("Preferred language")).toHaveValue("uz");
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(21);
  expect(screen.getByText("Ali 19")).toBeVisible();
  expect(screen.queryByText("Ali 20")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/en/admin/users?q=Ali&language=uz&page=3");
  expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "/en/admin/users?q=Ali&language=uz");
  expect(screen.queryByRole("button", { name: /delete|ban|role/i })).not.toBeInTheDocument();
});

it("offers a clear reset when an authorized search has no profiles", async () => {
  const client = createClient<Database>("https://example.supabase.co", "sb_publishable_example", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async () => new Response("[]", { status: 200 }) },
  });
  mock.requireAdmin.mockResolvedValue({ kind: "admin", client });
  render(await AdminUsers(props));
  expect(screen.getByRole("heading", { name: "No matching profiles" })).toBeVisible();
  for (const link of screen.getAllByRole("link", { name: "Clear filters" })) expect(link).toHaveAttribute("href", "/en/admin/users");
  expect(screen.queryByRole("link", { name: "Next page" })).not.toBeInTheDocument();
});
