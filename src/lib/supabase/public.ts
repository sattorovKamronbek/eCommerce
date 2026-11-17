import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getAuthConfig } from "./config";
import type { Database } from "./database";

// Public reads must never consume or refresh a visitor's auth session.
export function createPublicSupabaseClient() {
  const config = getAuthConfig();
  if (!config) return null;
  return createClient<Database>(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(12000) }) },
  });
}
