import "server-only";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { requireSeller } from "./access";
import { CS2_PHOTO_BUCKET } from "./cs2";
import { parseCs2Creation, parseCs2Edit } from "./cs2-input";
import type { ListingActionState } from "./listing";
import { prepareListingPhotos, removeListingPhotos, uploadListingPhotos } from "./listing-photo-writes";

const removePhotos = (client: SupabaseClient<Database>, paths: string[]) => removeListingPhotos(client, CS2_PHOTO_BUCKET, paths);
const uploadPhotos = (client: SupabaseClient<Database>, photos: ReturnType<typeof prepareListingPhotos>) =>
  uploadListingPhotos(client, CS2_PHOTO_BUCKET, photos);

function finishSave(locale: MarketplaceLocale): never {
  const destination = `/${locale}/seller/products`;
  revalidatePath(destination);
  revalidatePath(`${destination}/new`);
  redirect(destination);
}

export async function createCs2Listings(locale: MarketplaceLocale, form: FormData): Promise<ListingActionState> {
  const access = await requireSeller(locale);
  if (access.kind !== "seller" || access.scope === "fashion") return { error: "unavailable" };
  const input = await parseCs2Creation(form);
  if (!input) return { error: "invalid" };
  const { client, user } = access.account;
  const listings = client.from("marketplace_listings");
  const findPreviousSave = () => listings.select("id").eq("seller_id", user.id)
    .eq("cs2_group_id", input.group).eq("cs2_group_primary", true).limit(1).maybeSingle();
  const variants = input.variants.map(variant => {
    const id = randomUUID();
    return { ...variant, id, photos: prepareListingPhotos(id, variant.files) };
  });
  const photos = variants.flatMap(variant => variant.photos);
  try {
    const previous = await findPreviousSave();
    if (previous.error) return { error: "unavailable" };
    if (!previous.data) {
      if (!await uploadPhotos(client, photos)) return { error: "photo" };
      const rows = variants.map(({ id, price, wear, photos }, index) => ({
        id, seller_id: user.id, ecosystem: "cs2", title: input.title, description: input.description,
        category: input.category, variant: wear, price_tiyin: price, quantity: 1, state: input.state,
        cs2_group_id: input.group, cs2_category: input.category, cs2_model: input.model, cs2_wear: wear,
        cs2_images: photos.map(photo => photo.name), cs2_group_primary: index === 0,
      } as const));
      const saved = await listings.insert(rows).then(result => !result.error, () => false);
      if (!saved) {
        await removePhotos(client, photos.map(photo => photo.path));
        if (!(await findPreviousSave()).data) return { error: "unavailable" };
      }
    }
  } catch {
    await removePhotos(client, photos.map(photo => photo.path));
    return { error: "unavailable" };
  }
  finishSave(locale);
}

export async function saveCs2Variant(locale: MarketplaceLocale, id: string, expectedUpdatedAt: string, form: FormData): Promise<ListingActionState> {
  const access = await requireSeller(locale);
  if (access.kind !== "seller" || access.scope === "fashion") return { error: "unavailable" };
  const { client, user } = access.account;
  const listings = client.from("marketplace_listings");
  const readVariant = () => listings.select("cs2_group_id, cs2_wear, cs2_images, updated_at, description, quantity, state, price_tiyin")
    .eq("id", id).eq("seller_id", user.id).eq("moderation_status", "allowed").maybeSingle();
  let pendingPhotos: ReturnType<typeof prepareListingPhotos> = [];
  try {
    const existing = await readVariant();
    if (existing.error || !existing.data?.cs2_group_id || !existing.data.cs2_wear) return { error: "unavailable" };
    if (existing.data.updated_at !== expectedUpdatedAt) return { error: "changed" };
    const input = await parseCs2Edit(form, existing.data.cs2_wear, existing.data.cs2_images);
    if (!input) return { error: "invalid" };
    pendingPhotos = prepareListingPhotos(id, input.files);
    if (!await uploadPhotos(client, pendingPhotos)) return { error: "photo" };
    const changes = {
      description: input.description, state: input.state, price_tiyin: input.price, quantity: input.quantity,
      cs2_images: [...input.kept, ...pendingPhotos.map(photo => photo.name)],
    };
    const saved = await listings.update(changes).eq("id", id).eq("seller_id", user.id)
      .eq("updated_at", expectedUpdatedAt).select("id").maybeSingle().then(result => result, () => null);
    if (saved && !saved.error && !saved.data) {
      await removePhotos(client, pendingPhotos.map(photo => photo.path));
      return { error: "changed" };
    }
    if (!saved?.data) {
      const { data: current } = await readVariant();
      const confirmed = current?.description === changes.description && current.state === changes.state
        && current.price_tiyin === changes.price_tiyin && current.quantity === changes.quantity
        && current.cs2_images.length === changes.cs2_images.length
        && current.cs2_images.every((name, index) => name === changes.cs2_images[index]);
      if (!confirmed) {
        await removePhotos(client, pendingPhotos.map(photo => photo.path));
        return { error: "unavailable" };
      }
    }
    await removePhotos(client, existing.data.cs2_images.filter(photo => !input.kept.includes(photo)).map(photo => `${id}/${photo}`));
  } catch {
    await removePhotos(client, pendingPhotos.map(photo => photo.path));
    return { error: "unavailable" };
  }
  finishSave(locale);
}
