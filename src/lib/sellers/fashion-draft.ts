import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SellerListing } from "@/lib/supabase/database";
import type { FashionFormValues } from "./fashion";
import type { FashionEditVersion } from "./fashion-writes";

const formatPrice = (tiyin: number) => `${Math.floor(tiyin / 100)}.${String(tiyin % 100).padStart(2, "0")}`;

export async function loadFashionDraft(client: SupabaseClient<Database>, listing: SellerListing) {
  const productId = listing.fashion_product_id;
  if (!productId) return null;
  const draft = await client.rpc("marketplace_fashion_draft", { p_product_id: productId });
  if (draft.error || !draft.data) return null;
  const { product, colors: savedColors, listings } = draft.data;
  const selected = listings.find(variant => variant.id === listing.id);
  if (!selected || selected.moderation_status === "blocked") return null;

  const editable = listings.filter(variant => variant.moderation_status === "allowed" && variant.state !== "archived");
  const editing = editable.length ? editable : [selected];
  const colors = savedColors.flatMap(color => {
    const sizes = editing.flatMap(variant => variant.fashion_color_id === color.id && variant.fashion_size ? [{
      size: variant.fashion_size,
      quantity: String(variant.quantity),
      price: variant.fashion_price_override ? formatPrice(variant.price_tiyin) : "",
    }] : []);
    return sizes.length ? [{ id: color.id, name: color.name, images: color.images, sizes }] : [];
  });
  if (!colors.length) return null;
  const offeredSizes = new Set(colors.flatMap(color => color.sizes.map(variant => variant.size)));
  const form: FashionFormValues = {
    productId, title: product.title, description: product.description, category: product.category,
    brand: product.brand, material: product.material, fit: product.fit, care: product.care,
    price: formatPrice(product.price_tiyin), state: editable.length ? product.state : "draft", colors,
    sizeGuide: product.size_guide.filter(row => offeredSizes.has(row.size)),
  };
  const version: FashionEditVersion = {
    productId, updatedAt: product.updated_at,
    listings: listings.map(({ id, updated_at }) => ({ id, updated_at })),
  };
  const termsListing = editable.find(row => row.id === listing.id)?.id ?? editable[0]?.id;
  const key = [version.updatedAt, ...version.listings.map(row => `${row.id}:${row.updated_at}`)].join("|");
  return { form, version, termsListing, key };
}
