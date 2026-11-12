import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthConfig } from "./config";
import type { Database } from "./database";

export async function createServerSupabaseClient(writeCookies = false) {
  const config = getAuthConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        if (writeCookies) for (const { name, value, options } of values) store.set(name, value, options);
      },
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(12000) }) },
  });
}
