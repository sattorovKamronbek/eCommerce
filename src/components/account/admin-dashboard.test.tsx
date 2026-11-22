import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Dashboard from "@/app/(marketplace)/[locale]/admin/page";

const { requireAdmin, dashboard } = vi.hoisted(() => ({ requireAdmin: vi.fn(), dashboard: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAdmin }));
vi.mock("@/lib/sellers/intake", () => ({ loadSellerIntake: async () => null }));
const client = { rpc: () => ({ maybeSingle: dashboard }) };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("shows an owner dashboard with localized routes to existing workflows", async () => {
  requireAdmin.mockResolvedValue({ kind: "admin", role: "owner", client });
  dashboard.mockResolvedValue({ data: {
    users: 6, sellers: 12, listings: 18, orders: 25, payments: 7, disputes: 3, completed: 10,
    cs2_reservations: true, fashion_reservations: false,
  } });
  render(await Dashboard({ params: Promise.resolve({ locale: "uz" }) }));
  expect(requireAdmin).toHaveBeenCalledWith("uz", "/uz/admin");
  expect(screen.getByRole("heading", { name: "Sayt egasi paneli" })).toBeVisible();
  const modules = within(screen.getByRole("list"));
  for (const [name, href] of [
    [/Foydalanuvchilar/, "/uz/admin/users"],
    [/E’lonlar/, "/uz/admin/listings"],
    [/Buyurtmalar/, "/uz/admin/orders"],
    [/To‘lovni tekshirish/, "/uz/admin/orders?status=reported"],
    [/Nizolar/, "/uz/admin/orders?status=disputed"],
    [/Yakunlangan buyurtmalar/, "/uz/admin/orders?status=completed"],
  ] as const) {
    expect(modules.getByRole("link", { name })).toHaveAttribute("href", href);
  }
  expect(within(modules.getByRole("link", { name: /To‘lovni tekshirish/ })).getByText("7")).toBeVisible();
  expect(modules.queryByRole("link", { name: /arizalari/i })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sotuvchilik arizalari tarixi" })).toHaveAttribute("href", "/uz/admin/sellers");
  expect(screen.getByText("CS2 bandlovlari")).toBeVisible();
  expect(screen.getByText("Kiyim bandlovlari")).toBeVisible();
  expect(screen.getByRole("link", { current: "page" })).toHaveAttribute("href", "/uz/admin");
});

it("shows administrators their own heading and access description", async () => {
  requireAdmin.mockResolvedValue({ kind: "admin", role: "admin", client });
  dashboard.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
  render(await Dashboard({ params: Promise.resolve({ locale: "en" }) }));
  expect(screen.getByRole("heading", { name: "Administration dashboard" })).toBeVisible();
  expect(screen.queryByText(/grant administrator access/i)).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Dashboard statistics are unavailable.");
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
