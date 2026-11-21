import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Dashboard from "@/app/(marketplace)/[locale]/admin/page";

const { requireAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAdmin }));
vi.mock("@/lib/sellers/intake", () => ({ loadSellerIntake: async () => null }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("shows an owner dashboard with localized routes to existing workflows", async () => {
  requireAdmin.mockResolvedValue({ kind: "admin", role: "owner" });
  render(await Dashboard({ params: Promise.resolve({ locale: "uz" }) }));
  expect(requireAdmin).toHaveBeenCalledWith("uz", "/uz/admin");
  expect(screen.getByRole("heading", { name: "Sayt egasi paneli" })).toBeVisible();
  const modules = within(screen.getByRole("list"));
  for (const [name, href] of [
    [/Foydalanuvchilar/, "/uz/admin/users"],
    [/Sotuvchi arizalari/, "/uz/admin/sellers?status=pending"],
    [/E’lonlar/, "/uz/admin/listings"],
    [/Buyurtmalar/, "/uz/admin/orders"],
    [/To‘lovni tekshirish/, "/uz/admin/orders?status=reported"],
    [/Nizolar/, "/uz/admin/orders?status=disputed"],
  ] as const) {
    expect(modules.getByRole("link", { name })).toHaveAttribute("href", href);
  }
  expect(screen.getByRole("link", { current: "page" })).toHaveAttribute("href", "/uz/admin");
});

it("shows administrators their own heading and access description", async () => {
  requireAdmin.mockResolvedValue({ kind: "admin", role: "admin" });
  render(await Dashboard({ params: Promise.resolve({ locale: "en" }) }));
  expect(screen.getByRole("heading", { name: "Administration dashboard" })).toBeVisible();
  expect(screen.queryByText(/grant administrator access/i)).not.toBeInTheDocument();
});

it.each([
  ["denied", "Administrator access required"],
  ["unavailable", "Account service unavailable"],
])("keeps dashboard links private when access is %s", async (kind, heading) => {
  requireAdmin.mockResolvedValue({ kind });
  render(await Dashboard({ params: Promise.resolve({ locale: "en" }) }));
  expect(screen.getByRole("heading", { name: heading })).toBeVisible();
  expect(screen.queryByRole("link", { name: /payment review/i })).not.toBeInTheDocument();
});
