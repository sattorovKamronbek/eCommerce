import "server-only";
import type { AuthConfig } from "@/lib/supabase/config";

// This check prevents signup from requesting mail while the project still
// requires confirmation. Settings are not cached across registration attempts.
export async function readSignupSettings(config: AuthConfig): Promise<"ready" | "confirmation-required" | "unavailable"> {
  try {
    const response = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.key }, cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "unavailable";
    const settings = await response.json();
    if (settings?.external?.email !== true || settings?.disable_signup === true) return "unavailable";
    if (settings.mailer_autoconfirm === false) return "confirmation-required";
    return settings.mailer_autoconfirm === true ? "ready" : "unavailable";
  } catch { return "unavailable"; }
}
