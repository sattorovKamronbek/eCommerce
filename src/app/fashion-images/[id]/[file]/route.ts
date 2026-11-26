import { isCs2PhotoName } from "@/lib/sellers/cs2";
import { FASHION_PHOTO_BUCKET } from "@/lib/sellers/fashion";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;
  if (!isUuid(id) || !isCs2PhotoName(file)) return new Response(null, { status: 404, headers });
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const client = preview ? await createServerSupabaseClient() : createPublicSupabaseClient();
  if (!client) return new Response(null, { status: 404, headers });
  // Private Storage policies enforce seller preview and public listing visibility.
  try {
    const { data, error } = await client.storage.from(FASHION_PHOTO_BUCKET).download(`${id}/${file}`).asStream();
    if (!error && data) return new Response(data, { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch { /* A missing or unavailable private object has no public response body. */ }
  return new Response(null, { status: 404, headers });
}
