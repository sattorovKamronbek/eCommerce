import { describe, expect, it } from "vitest";
import { parseEmail, parseDisplayName, validPassword, safeReturnPath, parseAdminPage, validFlowToken } from "./validation";
import { readAuthConfig } from "@/lib/supabase/config";

describe("account input boundaries", () => {
  it("validates email, names, locale-independent password constraints and token hashes", () => {
    expect(parseEmail("  Person@Example.com  ")).toBe("person@example.com");
    expect(parseEmail("broken@ ")).toBeNull();
    expect(parseEmail(new File([], "x"))).toBeNull();
    expect(parseDisplayName("  Ali  ")).toBe("Ali");
    expect(parseDisplayName("a\nadmin")).toBeNull();
    expect(parseDisplayName("x".repeat(81))).toBeNull();
    expect(validPassword("long password with spaces")).toBe(true);
    expect(validPassword("short")).toBe(false);
    expect(validPassword("a".repeat(129))).toBe(false);
    expect(validFlowToken("a".repeat(64))).toBe(true);
    expect(validFlowToken("../secret")).toBe(false);
  });
  it("allows only exact local account/admin destinations", () => {
    expect(safeReturnPath("/en/admin/users", "en")).toBe("/en/admin/users");
    expect(safeReturnPath("/en/seller/apply", "en")).toBe("/en/seller/apply");
    expect(safeReturnPath("/en/admin/sellers", "en")).toBe("/en/admin/sellers");
    expect(safeReturnPath("/en/account/security", "en")).toBe("/en/account/security");
    expect(safeReturnPath("/en/seller/products", "en")).toBe("/en/seller/products");
    for (const value of ["https://evil.test", "//evil.test", "/\\evil.test", "/en/admin/../auth/confirm", "/en/account?next=https://evil.test", "/%2fen/admin", "/en/admin%2fusers", "/ru/admin", "/en/admin/users\n"]) {
      expect(safeReturnPath(value, "en")).toBe("/en/account");
    }
  });
  it("bounds pagination without accepting partial, duplicate or huge values", () => {
    expect(parseAdminPage(undefined)).toBe(1);
    expect(parseAdminPage("2")).toBe(2);
    for (const value of ["0", "-1", "1x", "1.5", "10001", ["2", "3"]]) expect(parseAdminPage(value)).toBe(1);
  });
});

describe("public Supabase configuration", () => {
  const base = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example", APP_ORIGIN: "http://localhost:3000" };
  it("requires a trusted origin and valid public credentials", () => {
    expect(readAuthConfig(base)?.origin).toBe("http://localhost:3000");
    expect(readAuthConfig({ ...base, APP_ORIGIN: undefined })).toBeNull();
    expect(readAuthConfig({ ...base, APP_ORIGIN: "https://example.test/path" })).toBeNull();
    expect(readAuthConfig({ ...base, APP_ORIGIN: "http://untrusted.test" })).toBeNull();
    expect(readAuthConfig({ ...base, NEXT_PUBLIC_SUPABASE_URL: "https://user:pass@example.supabase.co" })).toBeNull();
    expect(readAuthConfig({ ...base, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_do_not_expose" })).toBeNull();
    expect(readAuthConfig({ ...base, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" })).toBeNull();
  });

  const versaxDeployment = { VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "versax-six.vercel.app" } as const;

  it("connects the VERSAX production deployment to the dedicated project with no dashboard overrides", () => {
    expect(readAuthConfig(versaxDeployment)).toEqual({
      origin: "https://versax-six.vercel.app",
      url: "https://xevzbtivteugbqbmmtyz.supabase.co",
      key: expect.stringMatching(/^sb_publishable_/),
    });
  });

  it("uses explicit configuration and limits the production defaults to VERSAX", () => {
    const explicit = { ...base, APP_ORIGIN: "https://market.example.test" };
    expect(readAuthConfig({ ...versaxDeployment, ...explicit })).toEqual({
      origin: explicit.APP_ORIGIN,
      url: base.NEXT_PUBLIC_SUPABASE_URL,
      key: base.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    expect(readAuthConfig({ ...versaxDeployment, VERCEL_ENV: "preview" })).toBeNull();
    expect(readAuthConfig({ ...versaxDeployment, VERCEL_PROJECT_PRODUCTION_URL: "another-site.vercel.app" })).toBeNull();
    expect(readAuthConfig({ ...versaxDeployment, NEXT_PUBLIC_SUPABASE_URL: "https://another-project.supabase.co" })).toBeNull();
    expect(readAuthConfig({ ...versaxDeployment, APP_ORIGIN: "http://localhost:3000" })).toBeNull();
    expect(readAuthConfig({ ...versaxDeployment, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_invalid" })).toBeNull();
  });
});

it("preserves a valid order or checkout destination through authentication", () => {
  const id = "12345678-1234-4000-8000-123456789abc";
  for (const path of ["/en/account/orders", `/en/account/orders/${id}`, `/en/admin/orders/${id}`, `/en/account/checkout/fashion/${id}`]) {
    expect(safeReturnPath(path, "en")).toBe(path);
  }
  for (const path of [`/uz/account/checkout/cs2/${id}`, `/en/account/checkout/other/${id}`, "/en/account/orders/../security", `/en/admin/orders/${id}?next=//example.com`]) {
    expect(safeReturnPath(path, "en")).toBe("/en/account");
  }
});
