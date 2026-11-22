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

function useIntake(isOpen: boolean, application?: SellerApplication, { failStatus = false } = {}) {
  const client = createClient<Database>("https://seller-intake.example", "sb_publishable_example", {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: `seller-intake-${nextFixture++}` },
    global: { fetch: async (input) => {
      const route = new URL(String(input)).pathname.split("/").at(-1);
      if (route === "marketplace_seller_intake_status") {
        return failStatus ? Response.json({ code: "PGRST202" }, { status: 404 })
          : Response.json([{ is_open: isOpen, has_application: !!application }]);
      }
      if (route === "marketplace_seller_applications") {
        return Response.json(application ? [application] : []);
      }
      return Response.json([]);
    } },
  });
  mock.requireAccount.mockResolvedValue({ client, user: { id: userId, email: "test@example.invalid" }, suspended: false });
  mock.requireAdmin.mockResolvedValue({ client, kind: "admin" });
  mock.serverClient.mockResolvedValue(client);
}

it("hides application entry points and redirects a direct visit while intake is closed", async () => {
  useIntake(false);
  render(await Account({ params }));
  expect(screen.queryByRole("link", { name: "Seller application" })).not.toBeInTheDocument();
  render(await SellerAccessNotice({ locale: "en", kind: "denied" }));
  expect(screen.queryByRole("link", { name: "Seller application" })).not.toBeInTheDocument();
  await expect(SellerApplicationPage({ params })).rejects.toThrow("REDIRECT:/en/account");
});

it("keeps new applications unavailable even against a previously open backend", async () => {
  useIntake(true);
  render(await Account({ params }));
  expect(screen.queryByRole("link", { name: "Seller application" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "My listings" })).not.toBeInTheDocument();
  await expect(SellerApplicationPage({ params })).rejects.toThrow("REDIRECT:/en/account");
});

it("shows an applicant their own status without onboarding actions", async () => {
  useIntake(true, pending);
  render(await Account({ params }));
  expect(screen.getByRole("link", { name: "Application status" })).toHaveAttribute("href", "/en/seller/apply");
  render(await SellerApplicationPage({ params }));
  expect(screen.getByText("Awaiting review")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Generate verification code" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Update and resubmit" })).not.toBeInTheDocument();
});

it("shows administrators application history without intake or approval controls", async () => {
  useIntake(true, pending);
  const props = { params, searchParams: Promise.resolve({}) };
  render(await SellerReviews(props));
  expect(screen.getByRole("heading", { name: "Seller application history" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Applicant" })).toBeVisible();
  expect(screen.queryByRole("button", { name: /open applications|close applications|approve|reject/i })).not.toBeInTheDocument();
});

it("preserves the workspace entry point on order pages while respecting intake", async () => {
  useIntake(true);
  render(await OrdersList({ locale: "en", admin: false, search: {} }));
  expect(screen.queryByRole("link", { name: "Seller application" })).not.toBeInTheDocument();
  cleanup();
  useIntake(false, pending);
  render(await OrdersList({ locale: "en", admin: false, search: {} }));
  expect(screen.getByRole("link", { name: "Application status" })).toHaveAttribute("href", "/en/seller/apply");
});

it("hides the account history shortcut when application presence cannot be checked", async () => {
  useIntake(false, undefined, { failStatus: true });
  render(await Account({ params }));
  expect(screen.queryByRole("link", { name: "Seller application" })).not.toBeInTheDocument();
});

it("keeps the existing application visible when the intake lookup fails", async () => {
  useIntake(false, pending, { failStatus: true });
  render(await SellerApplicationPage({ params }));
  expect(screen.getByText("Awaiting review")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Update and resubmit" })).not.toBeInTheDocument();
});
