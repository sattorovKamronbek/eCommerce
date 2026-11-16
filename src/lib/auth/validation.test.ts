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
});
