export const FASHION_MAX_COLORS = 5;
export const FASHION_MAX_SIZES = 12;
export const FASHION_MAX_GUIDE_ROWS = 20;
export const FASHION_MAX_MEASUREMENTS = 160;
export const FASHION_MAX_COLOR_LENGTH = 36;
export const FASHION_MAX_SIZE_LENGTH = 24;
export const FASHION_MAX_DETAIL_LENGTH = 240;
export const FASHION_MAX_BRAND_LENGTH = 80;
export const FASHION_PHOTO_BUCKET = "marketplace-fashion-images";

export type FashionSizeGuideRow = { size: string; measurements: string };
export type FashionListingVersion = { id: string; updated_at: string };

export type FashionFormValues = {
  productId: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  material: string;
  fit: string;
  care: string;
  price: string;
  state: "draft" | "published";
  colors: {
    id: string;
    name: string;
    images: string[];
    sizes: { size: string; quantity: string; price: string }[];
  }[];
  sizeGuide: FashionSizeGuideRow[];
};

export function fashionPhotoHref(colorId: string, filename: string, preview = false) {
  return `/fashion-images/${colorId}/${filename}${preview ? "?preview=1" : ""}`;
}
