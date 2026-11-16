export type AuthConfig = { url: string; key: string; origin: string };
type Environment = Partial<Record<"NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "APP_ORIGIN", string>>;

function isPublicKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  // Explicit legacy-anon support; reject service-role JWTs as well as secret keys.
  try {
    const segments = key.split(".");
    return segments.length === 3 && JSON.parse(Buffer.from(segments[1], "base64url").toString()).role === "anon";
  } catch { return false; }
}

export function readAuthConfig(env: Environment): AuthConfig | null {
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!key || !isPublicKey(key) || !env.APP_ORIGIN || !env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    const origin = new URL(env.APP_ORIGIN);
    const local = (u: URL) => ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
    for (const value of [url, origin]) {
      if (value.username || value.password || value.search || value.hash || value.pathname !== "/") return null;
      if (value.protocol !== "https:" && !(value.protocol === "http:" && local(value))) return null;
    }
    return { url: url.origin, key, origin: origin.origin };
  } catch { return null; }
}

export function getAuthConfig(): AuthConfig | null {
  return readAuthConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    APP_ORIGIN: process.env.APP_ORIGIN,
  });
}
