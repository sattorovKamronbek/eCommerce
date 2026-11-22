import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SellerIntakeStatus } from "@/lib/supabase/database";

export async function loadSellerIntake(client: SupabaseClient<Database>): Promise<SellerIntakeStatus | null> {
  try {
    const { data, error } = await client.rpc("marketplace_seller_intake_status", {}).maybeSingle().retry(false);
    if (error || typeof data?.is_open !== "boolean" || typeof data.has_application !== "boolean") return null;
    return data;
  } catch {
    return null;
  }
}
