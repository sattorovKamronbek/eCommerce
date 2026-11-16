// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({
  origin: "https://app.test",
  values: new Map<string, string>(),
  writes: [] as { name: string; value: string; options: { httpOnly?: boolean; secure?: boolean; sameSite?: string; maxAge?: number } }[],
}));
vi.mock("./config", () => ({ getAuthConfig: () => ({ url: "https://example.supabase.co", key: "sb_publishable_example", origin: fixture.origin }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  getAll: () => Array.from(fixture.values, ([name, value]) => ({ name, value })),
  set: (name: string, value: string, options: (typeof fixture.writes)[number]["options"]) => {
    fixture.writes.push({ name, value, options });
    if (options.maxAge === 0) fixture.values.delete(name);
    else fixture.values.set(name, value);
  },
}) }));

import { createServerSupabaseClient } from "./server";
import { updateSession } from "./proxy";

// Synthetic provider responses exercise the real installed SSR cookie adapter.
// They are not real credentials and never reach an external service.
const user = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email: "fixture@example.invalid", email_confirmed_at: "2026-11-11T00:00:00Z", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, identities: [], created_at: "2026-11-11T00:00:00Z" };
function session(expiresIn: number) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return { access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", role: "authenticated", iat: now, exp: now + expiresIn })}.${"a".repeat(43)}`, refresh_token: "synthetic-refresh-token", token_type: "bearer", expires_in: expiresIn, expires_at: now + expiresIn, user };
}

beforeEach(() => {
  fixture.origin = "https://app.test"; fixture.values.clear(); fixture.writes.length = 0;
  // Node 20 lacks an enabled WebSocket global. Auth never uses Realtime; fail
  // immediately if these tests accidentally try to create a socket.
  vi.stubGlobal("WebSocket", class { constructor() { throw new Error("Realtime is outside this auth test."); } });
});
afterEach(() => { vi.unstubAllGlobals(); });

it.each(["https://app.test", "http://localhost:3000"])("writes HttpOnly sessions and matches Secure to the trusted origin %s", async origin => {
  fixture.origin = origin;
  vi.stubGlobal("fetch", async () => Response.json(session(3600)));
  const client = await createServerSupabaseClient(true);
  expect((await client!.auth.signInWithPassword({ email: user.email, password: "synthetic password" })).error).toBeNull();
  const written = fixture.writes.filter(cookie => cookie.name.startsWith("sb-example-auth-token") && cookie.value);
  expect(written.length).toBeGreaterThan(0);
  for (const cookie of written) {
    expect(cookie.options.httpOnly).toBe(true);
    expect(cookie.options.secure).toBe(origin.startsWith("https:"));
    expect(cookie.options.sameSite).toBe("lax");
  }
});

it("retains session protection when the proxy refreshes an expired session", async () => {
  const requests: string[] = [];
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const url = String(input);
    requests.push(url);
    if (url.includes("grant_type=password")) return Response.json(session(-3600));
    if (url.includes("grant_type=refresh_token")) return Response.json(session(3600));
    if (url.endsWith("/user")) return Response.json(user);
    return Response.json({}, { status: 404 });
  });
  const client = await createServerSupabaseClient(true);
  expect((await client!.auth.signInWithPassword({ email: user.email, password: "synthetic password" })).error).toBeNull();
  const request = new NextRequest("https://app.test/en/account", { headers: { cookie: Array.from(fixture.values, ([name, value]) => `${name}=${value}`).join("; ") } });
  const response = await updateSession(request);
  expect(requests.some(url => url.includes("grant_type=refresh_token"))).toBe(true);
  const written = response.cookies.getAll().filter(cookie => cookie.name.startsWith("sb-example-auth-token") && cookie.value);
  expect(written.length).toBeGreaterThan(0);
  for (const cookie of written) {
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.secure).toBe(true);
    expect(cookie.sameSite).toBe("lax");
  }
  expect(response.headers.get("cache-control")).toContain("no-store");
});
