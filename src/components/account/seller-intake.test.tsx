import { cleanup, render, screen } from "@testing-library/react";
import { createClient } from "@supabase/supabase-js";
import { afterEach, expect, it, vi } from "vitest";
import type { Database, SellerApplication } from "@/lib/supabase/database";

vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({
  requireAccount: vi.fn(), requireAdmin: vi.fn(), serverClient: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
vi.mock("@/lib/auth/access", () => ({ requireAccount: mock.requireAccount, requireAdmin: mock.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mock.serverClient }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import Account from "@/app/(marketplace)/[locale]/account/page";
import SellerApplicationPage from "@/app/(marketplace)/[locale]/seller/apply/page";
import SellerReviews from "@/app/(marketplace)/[locale]/admin/sellers/page";
import { applyAsSeller } from "@/app/(marketplace)/[locale]/seller/actions";
import { OrdersList } from "@/components/orders/view";
import { SellerAccessNotice } from "./seller-access-notice";

afterEach(() => { cleanup(); vi.clearAllMocks(); });
const userId = "10000000-0000-4000-8000-000000000001";
const params = Promise.resolve({ locale: "en" });
const pending: SellerApplication = {
  applicant_id: userId, applicant_type: "individual", name: "Applicant", contact: "Fixture contact",
  region: "Tashkent", requested_scope: "cs2", registration_details: null, status: "pending",
  revision: 1, created_at: "2026-11-22T00:00:00Z", reviewed_at: null,
};
let nextFixture = 0;

function useIntake(isOpen: boolean, application?: SellerApplication, { rejectedInsert = false, failStatus = false } = {}) {
  const calls: string[] = [];
  const client = createClient<Database>("https://seller-intake.example", "sb_publishable_example", {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: `seller-intake-${nextFixture++}` },
    global: { fetch: async (input, init) => {
      const route = new URL(String(input)).pathname.split("/").at(-1);
      calls.push(`${init?.method ?? "GET"} ${route}`);
      if (route === "marketplace_seller_intake_status") {
        return failStatus ? Response.json({ code: "PGRST202" }, { status: 404 })
          : Response.json([{ is_open: isOpen, has_application: !!application }]);
      }
      if (route === "marketplace_seller_applications") {
        if (init?.method === "POST" && rejectedInsert) return Response.json({ code: "55000" }, { status: 400 });
        return Response.json(application ? [application] : []);
      }
      return Response.json([]);
    } },
  });
  mock.requireAccount.mockResolvedValue({ client, user: { id: userId, email: "test@example.invalid" }, suspended: false });
  mock.requireAdmin.mockResolvedValue({ client, kind: "admin" });
  mock.serverClient.mockResolvedValue(client);
  return calls;
}

it("hides application entry points and redirects a direct visit while intake is closed", async () => {
  useIntake(false);
  render(await Account({ params }));
  expect(screen.queryByRole("link", { name: "Seller application" })).not.toBeInTheDocument();
  render(await SellerAccessNotice({ locale: "en", kind: "denied" }));
  expect(screen.queryByRole("link", { name: "Seller application" })).not.toBeInTheDocument();
  await expect(SellerApplicationPage({ params })).rejects.toThrow("REDIRECT:/en/account");
});

it("shows ordinary users the application only after intake opens", async () => {
  useIntake(true);
  render(await Account({ params }));
  expect(screen.getByRole("link", { name: "Seller application" })).toHaveAttribute("href", "/en/seller/apply");
  render(await SellerApplicationPage({ params }));
  expect(screen.getByRole("button", { name: "Submit application" })).toBeVisible();
});

it("keeps pending status and verification available during a closure", async () => {
  useIntake(false, pending);
  render(await Account({ params }));
  expect(screen.getByRole("link", { name: "Application status" })).toHaveAttribute("href", "/en/seller/apply");
  render(await SellerApplicationPage({ params }));
  expect(screen.getByText("Awaiting review")).toBeVisible();
  expect(screen.getByRole("button", { name: "Generate verification code" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Update and resubmit" })).not.toBeInTheDocument();
});

it("shows an administrator the control for the current intake state", async () => {
  useIntake(false);
  const props = { params, searchParams: Promise.resolve({}) };
  render(await SellerReviews(props));
  expect(screen.getByRole("button", { name: "Open applications" })).toBeVisible();
  cleanup();
  useIntake(true);
  render(await SellerReviews(props));
  expect(screen.getByRole("button", { name: "Close applications" })).toBeVisible();
});

it("blocks a stale application form when intake closes before its database write", async () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ type: "individual", name: "Applicant", region: "Tashkent", contact: "contact", scope: "cs2" })) {
    form.set(key, value);
  }
  const closedCalls = useIntake(false);
  expect(await applyAsSeller("en", {}, form)).toEqual({ error: "closed" });
  expect(closedCalls).not.toContain("POST marketplace_seller_applications");
  const staleCalls = useIntake(true, undefined, { rejectedInsert: true });
  expect(await applyAsSeller("en", {}, form)).toEqual({ error: "closed" });
  expect(staleCalls).toContain("POST marketplace_seller_applications");
});

it("preserves the workspace entry point on order pages while respecting intake", async () => {
  useIntake(true);
  render(await OrdersList({ locale: "en", admin: false, search: {} }));
  expect(screen.getByRole("link", { name: "Seller application" })).toHaveAttribute("href", "/en/seller/apply");
  cleanup();
  useIntake(false, pending);
  render(await OrdersList({ locale: "en", admin: false, search: {} }));
  expect(screen.getByRole("link", { name: "Application status" })).toHaveAttribute("href", "/en/seller/apply");
});

it("hides intake links and controls when the setting cannot be checked", async () => {
  useIntake(false, undefined, { failStatus: true });
  render(await Account({ params }));
  expect(screen.queryByRole("link", { name: "Seller application" })).not.toBeInTheDocument();
  cleanup();
  render(await SellerReviews({ params, searchParams: Promise.resolve({}) }));
  expect(screen.queryByRole("button", { name: "Open applications" })).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Application intake is unavailable.");
});

it("keeps the existing application visible when the intake lookup fails", async () => {
  useIntake(false, pending, { failStatus: true });
  render(await SellerApplicationPage({ params }));
  expect(screen.getByText("Awaiting review")).toBeVisible();
  expect(screen.getByText("Application intake is unavailable.")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Update and resubmit" })).not.toBeInTheDocument();
});
