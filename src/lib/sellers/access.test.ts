import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ requireAccount: vi.fn(), app: vi.fn(), grant: vi.fn(), assurance: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccount: mock.requireAccount }));
import { requireSeller } from "./access";

beforeEach(() => {
  vi.clearAllMocks();
  mock.app.mockResolvedValue({ data: { status: "approved", revision: 2, requested_scope: "cs2" }, error: null });
  mock.grant.mockResolvedValue({ data: { application_revision: 2 }, error: null });
  mock.assurance.mockResolvedValue({ data: { currentLevel: "aal2" }, error: null });
  const client = { auth: { mfa: { getAuthenticatorAssuranceLevel: mock.assurance } }, from: (name: string) => ({ select: () => ({ eq: () => ({ maybeSingle: name === "marketplace_seller_applications" ? mock.app : mock.grant }) }) }) };
  mock.requireAccount.mockResolvedValue({ user: { id: "seller" }, client });
});

it("requires a current approved revision and an MFA-verified session", async () => {
  expect((await requireSeller("en")).kind).toBe("seller");
  mock.grant.mockResolvedValueOnce({ data: { application_revision: 1 }, error: null });
  expect((await requireSeller("en")).kind).toBe("denied");
  mock.assurance.mockResolvedValueOnce({ data: { currentLevel: "aal1" }, error: null });
  expect((await requireSeller("en")).kind).toBe("mfa");
  mock.app.mockResolvedValueOnce({ data: null, error: { code: "network" } });
  expect((await requireSeller("en")).kind).toBe("unavailable");
});

it("distinguishes absent seller tables from ordinary service failures", async () => {
  mock.app.mockResolvedValueOnce({ data: null, error: { code: "PGRST205" } });
  expect((await requireSeller("en")).kind).toBe("setup");
  mock.grant.mockResolvedValueOnce({ data: null, error: { code: "42P01" } });
  expect((await requireSeller("en")).kind).toBe("setup");
});
