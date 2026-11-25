import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Dashboard from "@/app/(marketplace)/[locale]/admin/page";

const { requireAdmin, dashboard } = vi.hoisted(() => ({ requireAdmin: vi.fn(), dashboard: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAdmin }));
vi.mock("@/lib/sellers/intake", () => ({ loadSellerIntake: async () => null }));
const user = { id: "cedf9cf2-6c3c-4d49-9962-26e02b84d1b9" };
const orderQuery = {
  select: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  retry: vi.fn(),
};
const client = { rpc: () => ({ maybeSingle: dashboard }), from: vi.fn().mockReturnValue(orderQuery) };

beforeEach(() => {
  orderQuery.retry.mockResolvedValue({ data: [], error: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("shows an owner dashboard with localized routes to existing workflows", async () => {
  requireAdmin.mockResolvedValue({ kind: "admin", role: "owner", client, user });
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
  const sales = within(screen.getByRole("navigation", { name: "Savdo" }));
  expect(sales.getByRole("link", { name: "CS2 buyurtmalari" })).toHaveAttribute("href", "/uz/admin/orders?ecosystem=cs2");
  expect(sales.getByRole("link", { name: "Kiyim buyurtmalari" })).toHaveAttribute("href", "/uz/admin/orders?ecosystem=fashion");
  expect(screen.getByRole("link", { current: "page" })).toHaveAttribute("href", "/uz/admin");
});

it("shows administrators their own heading and access description", async () => {
  requireAdmin.mockResolvedValue({ kind: "admin", role: "admin", client, user });
  dashboard.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
  render(await Dashboard({ params: Promise.resolve({ locale: "en" }) }));
  expect(screen.getByRole("heading", { name: "Administration dashboard" })).toBeVisible();
  expect(screen.queryByText(/grant administrator access/i)).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Dashboard statistics are unavailable.");
});

it("shows current payment and dispute notifications that the administrator can act on", async () => {
  requireAdmin.mockResolvedValue({ kind: "admin", role: "admin", client, user });
  dashboard.mockResolvedValue({ data: null, error: null });
  orderQuery.retry.mockResolvedValue({ data: [{
    id: "d6bab1f9-517a-4e92-85b2-739baa95ea6f", title: "Clothing payment", ecosystem: "fashion",
    status: "reported", updated_at: "2026-11-25T08:00:00Z",
  }], error: null });
  render(await Dashboard({ params: Promise.resolve({ locale: "en" }) }));
  expect(client.from).toHaveBeenCalledWith("marketplace_orders");
  expect(orderQuery.in).toHaveBeenCalledWith("status", ["reported", "disputed"]);
  expect(orderQuery.neq).toHaveBeenCalledWith("buyer_id", user.id);
  expect(orderQuery.neq).toHaveBeenCalledWith("seller_id", user.id);
  expect(orderQuery.range).toHaveBeenCalledWith(0, 2);
  const notices = within(screen.getByRole("region", { name: "Notifications" }));
  expect(notices.getByText(/Payment reported/)).toBeVisible();
  expect(notices.getByRole("link", { name: "Clothing payment" }))
    .toHaveAttribute("href", "/en/admin/orders/d6bab1f9-517a-4e92-85b2-739baa95ea6f");
  expect(notices.getByRole("link", { name: "All notifications" })).toHaveAttribute("href", "/en/admin/notifications");
});

it.each([
  ["denied", "Administrator access required"],
  ["unavailable", "Account service unavailable"],
])("keeps dashboard links private when access is %s", async (kind, heading) => {
  requireAdmin.mockResolvedValue({ kind });
  render(await Dashboard({ params: Promise.resolve({ locale: "en" }) }));
  expect(screen.getByRole("heading", { name: heading })).toBeVisible();
  expect(screen.queryByRole("link", { name: /payment review/i })).not.toBeInTheDocument();
  expect(client.from).not.toHaveBeenCalled();
});
