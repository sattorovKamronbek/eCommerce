import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig } from "./config";
import type { Database } from "./database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getAuthConfig();
  if (config) {
    const client = createServerClient<Database>(config.url, config.key, {
      // Refresh must preserve the policy used by the server action client.
      cookieOptions: { httpOnly: true, secure: config.origin.startsWith("https:"), sameSite: "lax", path: "/" },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          for (const { name, value } of values) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values) response.cookies.set(name, value, options);
        },
      },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(12000) }) },
    });
    // Refresh only; every private page/action independently verifies access.
    try { await client.auth.getClaims(); } catch { /* Private page reports service failure. */ }
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
