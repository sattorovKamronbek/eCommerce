// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const config = vi.hoisted(() => ({ available: true }));
vi.mock("@/lib/supabase/config", () => ({ getAuthConfig: () => config.available ? { origin: "https://app.test" } : null }));
import { GET } from "@/app/(marketplace)/[locale]/auth/confirm/route";
beforeEach(() => { config.available = true; });

it("stages a recovery token without trusting Host or an external next URL", async () => {
  const response = await GET(new NextRequest(`https://evil.test/en/auth/confirm?token_hash=${"a".repeat(64)}&type=recovery&next=https://evil.test`), { params: Promise.resolve({ locale: "en" }) });
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("https://app.test/en/account/reset-password");
  const cookie = response.cookies.get("mp-email-flow-en");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.secure).toBe(true);
  expect(cookie?.maxAge).toBe(600);
  expect(cookie?.path).toBe("/en/account");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
});
it("sends missing-configuration links to the localized unavailable experience instead of a blank page", async () => {
  config.available = false;
  const response = await GET(new NextRequest("https://evil.test/en/auth/confirm"), { params: Promise.resolve({ locale: "en" }) });
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("/en/account/login");
});
it("rejects duplicate parameters, unsupported flows and invalid locales", async () => {
  for (const query of [`type=signup&type=recovery&token_hash=${"a".repeat(64)}`, `type=invite&token_hash=${"a".repeat(64)}`, "type=signup&token_hash=bad"]) {
    const response = await GET(new NextRequest(`https://app.test/en/auth/confirm?${query}`), { params: Promise.resolve({ locale: "en" }) });
    expect(response.headers.get("location")).toBe("https://app.test/en/account/login?notice=invalidLink");
    expect(response.cookies.get("mp-email-flow-en")?.maxAge).toBe(0);
  }
  expect((await GET(new NextRequest("https://app.test/de/auth/confirm"), { params: Promise.resolve({ locale: "de" }) })).status).toBe(404);
});
