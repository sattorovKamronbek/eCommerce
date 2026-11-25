import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ requireAccount: vi.fn(), rpc: vi.fn(), app: vi.fn(), grant: vi.fn(), role: vi.fn(), assurance: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccount: mock.requireAccount }));
import { requireSeller } from "./access";

beforeEach(() => {
  vi.clearAllMocks();
  mock.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
  mock.app.mockResolvedValue({ data: { status: "approved", revision: 2, requested_scope: "cs2" }, error: null });
  mock.grant.mockResolvedValue({ data: { application_revision: 2 }, error: null });
  mock.role.mockResolvedValue({ data: { role: "owner" }, error: null });
  mock.assurance.mockResolvedValue({ data: { currentLevel: "aal2" }, error: null });
  const lookup = { marketplace_seller_applications: mock.app, marketplace_seller_grants: mock.grant, marketplace_user_roles: mock.role };
  const client = { rpc: mock.rpc, auth: { mfa: { getAuthenticatorAssuranceLevel: mock.assurance } }, from: (name: keyof typeof lookup) => ({ select: () => ({ eq: () => ({ maybeSingle: lookup[name] }) }) }) };
  mock.requireAccount.mockResolvedValue({ user: { id: "seller", factors: [{ status: "verified" }] }, client });
});

it("uses the directly assigned scope and honors revocation without falling back to legacy grants", async () => {
  mock.rpc.mockResolvedValueOnce({ data: "fashion", error: null });
  expect(await requireSeller("en")).toMatchObject({ kind: "seller", scope: "fashion" });
  mock.rpc.mockResolvedValueOnce({ data: "none", error: null });
  expect(await requireSeller("en")).toEqual({ kind: "denied" });
  mock.rpc.mockResolvedValueOnce({ data: null, error: { code: "network" } });
  expect(await requireSeller("en")).toEqual({ kind: "unavailable" });
  expect(mock.app).not.toHaveBeenCalled();
  expect(mock.role).not.toHaveBeenCalled();
});

it("requires a currently verified authenticator as well as an AAL2 session", async () => {
  const account = await mock.requireAccount();
  mock.requireAccount.mockResolvedValueOnce({ ...account, user: { id: "seller", factors: [] } });
  expect((await requireSeller("en")).kind).toBe("mfa");
});

it("requires a privileged role even when the caller has an approved legacy seller grant", async () => {
  mock.role.mockResolvedValueOnce({ data: null, error: null });
  expect((await requireSeller("en")).kind).toBe("denied");
  mock.role.mockResolvedValueOnce({ data: { role: "admin" }, error: null });
  expect((await requireSeller("en")).kind).toBe("seller");
  mock.role.mockResolvedValueOnce({ data: null, error: { code: "network" } });
  expect((await requireSeller("en")).kind).toBe("unavailable");
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
