import { CS2_PHOTO_BUCKET, isCs2PhotoName } from "@/lib/sellers/cs2";
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

  // Storage RLS distinguishes attached public photos from a seller's previews.
  try {
    const { data, error } = await client.storage.from(CS2_PHOTO_BUCKET).download(`${id}/${file}`).asStream();
    if (!error && data) return new Response(data, { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch { /* The private object could not be fetched. */ }
  return new Response(null, { status: 404, headers });
}
