import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";

type ListingPhoto = { file: File; name: string; path: string };

export function prepareListingPhotos(id: string, files: File[]): ListingPhoto[] {
  return files.map(file => {
    const name = `${randomUUID()}.webp`;
    return { file, name, path: `${id}/${name}` };
  });
}

export async function removeListingPhotos(client: SupabaseClient<Database>, bucketId: string, paths: string[]) {
  if (!paths.length) return;
  // Storage policies reject removal of attached files, including after an uncertain write response.
  try { await client.storage.from(bucketId).remove(paths); } catch { /* Unattached files remain private. */ }
}

export async function uploadListingPhotos(client: SupabaseClient<Database>, bucketId: string, photos: ListingPhoto[]) {
  if (!photos.length) return true;
  const bucket = client.storage.from(bucketId);
  for (let index = 0; index < photos.length; index += 6) {
    const uploads = await Promise.allSettled(photos.slice(index, index + 6).map(({ path, file }) =>
      bucket.upload(path, file, { contentType: "image/webp", cacheControl: "0", upsert: false })));
    if (uploads.some(upload => upload.status === "rejected" || upload.value.error)) {
      await removeListingPhotos(client, bucketId, photos.slice(0, index + 6).map(photo => photo.path));
      return false;
    }
  }
  return true;
}
