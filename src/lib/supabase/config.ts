export type AuthConfig = { url: string; key: string; origin: string };
type Environment = Partial<Record<
  "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "NEXT_PUBLIC_SUPABASE_ANON_KEY" |
  "APP_ORIGIN" | "VERCEL_ENV" | "VERCEL_PROJECT_PRODUCTION_URL", string
>>;

const versaxProduction = {
  host: "versax-six.vercel.app",
  url: "https://xevzbtivteugbqbmmtyz.supabase.co",
  // The low-privilege publishable key identifies the app. Supabase RLS still applies.
  key: "sb_publishable_3hRrDeqwfGm3a9SrCreskA__zCoVf6H",
};

function isPublicKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  // Explicit legacy-anon support; reject service-role JWTs as well as secret keys.
  try {
    const segments = key.split(".");
    return segments.length === 3 && JSON.parse(Buffer.from(segments[1], "base64url").toString()).role === "anon";
  } catch { return false; }
}

export function readAuthConfig(env: Environment): AuthConfig | null {
  const onVercelProduction = env.VERCEL_ENV === "production";
  const deployment = onVercelProduction && env.VERCEL_PROJECT_PRODUCTION_URL === versaxProduction.host
    ? versaxProduction : undefined;
  const urlValue = env.NEXT_PUBLIC_SUPABASE_URL || deployment?.url;
  const originValue = env.APP_ORIGIN || (deployment && `https://${deployment.host}`);
  if (!urlValue || !originValue) return null;
  try {
    const url = new URL(urlValue);
    const origin = new URL(originValue);
    const defaultKey = deployment && url.origin === deployment.url ? deployment.key : undefined;
    const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultKey;
    if (!key || !isPublicKey(key)) return null;
    if (onVercelProduction && origin.protocol !== "https:") return null;
    const local = (u: URL) => ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
    for (const value of [url, origin]) {
      if (value.username || value.password || value.search || value.hash || value.pathname !== "/") return null;
      if (value.protocol !== "https:" && !(value.protocol === "http:" && local(value))) return null;
    }
    return { url: url.origin, key, origin: origin.origin };
  } catch { return null; }
}

export function getAuthConfig(): AuthConfig | null {
  const env = process.env;
  return readAuthConfig({
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    APP_ORIGIN: env.APP_ORIGIN,
    VERCEL_ENV: env.VERCEL_ENV,
    VERCEL_PROJECT_PRODUCTION_URL: env.VERCEL_PROJECT_PRODUCTION_URL,
  });
}
