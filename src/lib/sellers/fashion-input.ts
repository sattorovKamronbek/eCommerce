import type { FashionColor, FashionProductDetails } from "@/lib/supabase/database";
import { isUuid } from "@/lib/uuid";
import { CS2_MAX_PHOTOS, isCs2PhotoName } from "./cs2";
import {
  FASHION_MAX_BRAND_LENGTH, FASHION_MAX_COLOR_LENGTH, FASHION_MAX_COLORS, FASHION_MAX_DETAIL_LENGTH,
  FASHION_MAX_GUIDE_ROWS, FASHION_MAX_MEASUREMENTS, FASHION_MAX_SIZE_LENGTH, FASHION_MAX_SIZES,
} from "./fashion";
import { listingText, parseUzsTiyin } from "./listing";
import { validateListingPhoto } from "./listing-photo-input";

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function readSize(value: unknown) {
  if (typeof value !== "string") return null;
  const size = listingText(value, FASHION_MAX_SIZE_LENGTH)?.toUpperCase();
  return size ? listingText(size, FASHION_MAX_SIZE_LENGTH) : null;
}

function readVariants(rows: unknown) {
  if (!Array.isArray(rows) || !rows.length || rows.length > FASHION_MAX_SIZES) return null;
  const variants = [];
  const seen = new Set<string>();
  for (const row of rows as unknown[]) {
    if (!record(row) || typeof row.quantity !== "string" || !/^(0|[1-9]\d{0,6})$/.test(row.quantity)) return null;
    const size = readSize(row.size);
    const quantity = Number(row.quantity);
    const price = parseUzsTiyin(row.price);
    if (!size || seen.has(size) || quantity > 1_000_000 || (row.price !== "" && price === null)) return null;
    seen.add(size);
    variants.push({ size, quantity, price_tiyin: price });
  }
  return variants;
}

async function readColor(value: unknown, form: FormData, existing: FashionColor[]) {
  if (!record(value) || !isUuid(value.id) || typeof value.name !== "string") return null;
  const id = value.id.toLowerCase();
  const name = listingText(value.name, FASHION_MAX_COLOR_LENGTH);
  const variants = readVariants(value.sizes);
  if (!name || !variants) return null;
  const keepEntries = form.getAll(`fashionKeep-${id}`);
  const photoEntries = form.getAll(`fashionPhoto-${id}`);
  const kept = keepEntries.filter(isCs2PhotoName);
  const files = photoEntries.filter((entry): entry is File => typeof entry !== "string");
  const currentImages = existing.find(color => color.id === id)?.images ?? [];
  if (kept.length !== keepEntries.length || files.length !== photoEntries.length
    || kept.length + files.length > CS2_MAX_PHOTOS || new Set(kept).size !== kept.length
    || kept.some(filename => !currentImages.includes(filename))) return null;
  for (const file of files) {
    if (!await validateListingPhoto(file)) return null;
  }
  return { id, name, variants, kept, files };
}

function readSizeGuide(value: unknown, offeredSizes: Set<string>) {
  if (!Array.isArray(value) || value.length > FASHION_MAX_GUIDE_ROWS) return null;
  const sizeGuide = [];
  const seen = new Set<string>();
  for (const row of value as unknown[]) {
    if (!record(row) || typeof row.measurements !== "string") return null;
    const size = readSize(row.size);
    const measurements = listingText(row.measurements, FASHION_MAX_MEASUREMENTS);
    if (!size || !offeredSizes.has(size) || seen.has(size) || !measurements) return null;
    seen.add(size);
    sizeGuide.push({ size, measurements });
  }
  return sizeGuide;
}

export async function parseFashionListing(form: FormData, existing: FashionColor[] = []) {
  const productId = form.get("fashionProductId");
  const state = form.get("state");
  const title = listingText(form.get("title"), 120);
  const description = listingText(form.get("description"), 4000, true);
  const category = listingText(form.get("category"), 80);
  const brand = listingText(form.get("fashionBrand") ?? "", FASHION_MAX_BRAND_LENGTH, false, true);
  const material = listingText(form.get("fashionMaterial") ?? "", FASHION_MAX_DETAIL_LENGTH, false, true);
  const fit = listingText(form.get("fashionFit") ?? "", FASHION_MAX_DETAIL_LENGTH, false, true);
  const care = listingText(form.get("fashionCare") ?? "", FASHION_MAX_DETAIL_LENGTH, false, true);
  const price = parseUzsTiyin(form.get("price"));
  const raw = form.get("fashionPayload");
  if (!isUuid(productId) || form.get("ecosystem") !== "fashion" || (state !== "draft" && state !== "published")
    || !title || !description || !category || brand === null || material === null || fit === null || care === null
    || price === null || typeof raw !== "string" || raw.length > 24_000) return null;
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return null; }
  if (!record(payload) || !Array.isArray(payload.colors) || !payload.colors.length || payload.colors.length > FASHION_MAX_COLORS) return null;

  const colors = [];
  const ids = new Set<string>();
  const names = new Set<string>();
  const offeredSizes = new Set<string>();
  for (const row of payload.colors as unknown[]) {
    const color = await readColor(row, form, existing);
    if (!color || ids.has(color.id) || names.has(color.name.toLowerCase())) return null;
    ids.add(color.id);
    names.add(color.name.toLowerCase());
    for (const variant of color.variants) offeredSizes.add(variant.size);
    colors.push(color);
  }
  const sizeGuide = readSizeGuide(payload.sizeGuide, offeredSizes);
  if (!sizeGuide) return null;
  const details: FashionProductDetails = { title, description, category, brand, material, fit, care,
    price_tiyin: price, state, size_guide: sizeGuide };
  return { productId: productId.toLowerCase(), details, colors };
}
