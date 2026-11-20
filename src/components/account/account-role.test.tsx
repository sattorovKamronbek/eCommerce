import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ requireAccount: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccount: mocks.requireAccount }));
import Account from "@/app/(marketplace)/[locale]/account/page";
afterEach(cleanup);

it("does not label a user as customer when their role lookup failed", async () => {
  const client = createClient<Database>("https://example.supabase.co", "sb_publishable_example", {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: "test-role-error" },
    global: { fetch: async input => String(input).includes("marketplace_user_roles")
      ? new Response(JSON.stringify({ code: "42501", message: "private details" }), { status: 400, headers: { "Content-Type": "application/json" } })
      : new Response(JSON.stringify({ id: "user", display_name: "Ali", preferred_locale: "en", created_at: "2026-01-01", updated_at: "2026-01-01" }), { status: 200, headers: { "Content-Type": "application/json" } }) },
  });
  mocks.requireAccount.mockResolvedValue({ client, user: { id: "user", email: "user@example.test" } });
  render(await Account({ params: Promise.resolve({ locale: "en" }) }));
  expect(screen.getByText("Account role could not be checked.")).toBeVisible();
  expect(screen.queryByText("Customer")).not.toBeInTheDocument();
  expect(screen.queryByText("private details")).not.toBeInTheDocument();
});
