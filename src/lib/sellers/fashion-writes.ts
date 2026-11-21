import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FashionColor } from "@/lib/supabase/database";
import { isUuid } from "@/lib/uuid";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { requireSeller } from "./access";
import { FASHION_PHOTO_BUCKET, type FashionListingVersion } from "./fashion";
import { parseFashionListing } from "./fashion-input";
import type { ListingActionState } from "./listing";
import { prepareListingPhotos, removeListingPhotos, uploadListingPhotos } from "./listing-photo-writes";

export type FashionEditVersion = { productId: string; updatedAt: string; listings: FashionListingVersion[] };

function finishSave(locale: MarketplaceLocale): never {
  const destination = `/${locale}/seller/products`;
  revalidatePath(destination);
  redirect(destination);
}

export async function saveFashionProduct(locale: MarketplaceLocale, form: FormData, expected?: FashionEditVersion): Promise<ListingActionState> {
  const id = form.get("fashionProductId");
  if (!isUuid(id) || (expected && id !== expected.productId)) return { error: "invalid" };
  const access = await requireSeller(locale);
  if (access.kind !== "seller" || access.scope === "cs2") return { error: "unavailable" };
  const { client, user } = access.account;
  const productId = id.toLowerCase();
  const findProduct = () => client.from("marketplace_fashion_products").select("id, updated_at")
    .eq("id", productId).eq("seller_id", user.id).maybeSingle();

  let pendingPaths: string[] = [];
  try {
    const product = await findProduct();
    if (product.error) return { error: "unavailable" };
    if (expected || !product.data) {
      let existing: FashionColor[] = [];
      if (expected) {
        if (!product.data) return { error: "unavailable" };
        if (product.data.updated_at !== expected.updatedAt) return { error: "changed" };
        const result = await client.from("marketplace_fashion_colors").select("*").eq("product_id", productId);
        if (result.error) return { error: "unavailable" };
        existing = result.data;
      }
      const input = await parseFashionListing(form, existing);
      if (!input) return { error: "invalid" };
      const existingIds = new Set(existing.map(color => color.id));
      const submittedIds = new Set(input.colors.map(color => color.id));
      const idsByName = new Map(existing.filter(color => !submittedIds.has(color.id))
        .map(color => [color.name.toLowerCase(), color.id]));
      const resolvedColors = input.colors.map(color => ({ ...color, id: existingIds.has(color.id)
        ? color.id : idsByName.get(color.name.toLowerCase()) ?? color.id }));
      if (new Set(resolvedColors.map(color => color.id)).size !== resolvedColors.length) return { error: "invalid" };
      const newPhotos = resolvedColors.map(({ id, files }) => prepareListingPhotos(id, files));
      const colors = resolvedColors.map(({ id, name, variants, kept }, index) => ({
        id, name, variants, images: [...kept, ...newPhotos[index].map(photo => photo.name)],
      }));
      const photos = newPhotos.flat();
      pendingPaths = photos.map(photo => photo.path);
      if (!await uploadListingPhotos(client, FASHION_PHOTO_BUCKET, photos)) return { error: "photo" };

      const result = await client.rpc("marketplace_save_fashion_product", {
        p_product_id: productId, p_expected_updated_at: expected?.updatedAt ?? null,
        p_details: input.details, p_colors: colors, p_versions: expected?.listings ?? [],
      }).retry(false).then(result => result, () => null);
      if (result?.data === productId && !result.error) {
        const kept = new Set(colors.flatMap(color => color.images.map(file => `${color.id}/${file}`)));
        const previous = existing.flatMap(color => color.images.map(file => `${color.id}/${file}`));
        await removeListingPhotos(client, FASHION_PHOTO_BUCKET, previous.filter(path => !kept.has(path)));
      } else {
        await removeListingPhotos(client, FASHION_PHOTO_BUCKET, pendingPaths);
        if (expected || !(await findProduct()).data) {
          if (result?.error?.code === "40001") return { error: "changed" };
          if (result?.error?.code === "22023" || result?.error?.code === "23514" || result?.error?.code === "23505") return { error: "invalid" };
          return { error: "unavailable" };
        }
      }
    }
  } catch {
    await removeListingPhotos(client, FASHION_PHOTO_BUCKET, pendingPaths);
    return { error: "unavailable" };
  }
  finishSave(locale);
}
