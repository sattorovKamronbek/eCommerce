import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mock = vi.hoisted(() => ({ account: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccount: mock.account }));
vi.mock("@/components/account/shell", () => ({
  accountLocale: async () => "en",
  AccountShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  AccountUnavailable: () => <p>Unavailable</p>,
}));
vi.mock("@/components/account/form", () => ({ AccountForm: () => <button>Sign out</button> }));
vi.mock("@/components/account/mfa-panel", () => ({ MfaPanel: () => <div>MFA challenge</div> }));
vi.mock("@/app/(marketplace)/[locale]/account/actions", () => ({ logoutAction: vi.fn() }));
vi.mock("@/app/(marketplace)/[locale]/account/security/actions", () => ({ beginMfaSetup: vi.fn(), removeUnverifiedMfa: vi.fn(), verifyMfaCode: vi.fn() }));
import AccountSecurity from "@/app/(marketplace)/[locale]/account/security/page";

it("uses the verified account factors and keeps sign-out available if assurance lookup fails", async () => {
  const mfa = { listFactors: vi.fn(), getAuthenticatorAssuranceLevel: vi.fn() };
  mock.account.mockResolvedValue({ user: { factors: [] }, client: { auth: { mfa } } });
  mfa.listFactors.mockResolvedValue({ data: null, error: { message: "offline" } });
  mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal1" }, error: null });
  const props = { params: Promise.resolve({ locale: "en" }), searchParams: Promise.resolve({}) };
  expect(renderToStaticMarkup(await AccountSecurity(props))).toContain("MFA challenge");
  expect(mfa.listFactors).not.toHaveBeenCalled();
  mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: null, error: { message: "offline" } });
  const unavailable = renderToStaticMarkup(await AccountSecurity(props));
  expect(unavailable).toContain("Unavailable");
  expect(unavailable).toContain("Sign out");
});
