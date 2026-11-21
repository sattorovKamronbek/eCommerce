import { isUuid } from "@/lib/uuid";
import { CS2_MAX_PHOTOS, CS2_WEAR, isCs2Category, isCs2Model, isCs2PhotoName, isCs2Wear, type Cs2Wear } from "./cs2";
import { listingText, parseUzsTiyin } from "./listing";
import { validateListingPhoto } from "./listing-photo-input";

async function readVariant(form: FormData, wear: Cs2Wear, existing: readonly string[] = []) {
  const price = parseUzsTiyin(form.get(`cs2Price-${wear}`));
  const keptEntries = form.getAll(`cs2Keep-${wear}`);
  const newEntries = form.getAll(`cs2Photo-${wear}`);
  const kept = keptEntries.filter(isCs2PhotoName);
  const files = newEntries.filter((value): value is File => typeof value !== "string");
  if (price === null || kept.length !== keptEntries.length
    || files.length !== newEntries.length || kept.length + files.length > CS2_MAX_PHOTOS
    || new Set(kept).size !== kept.length || kept.some(file => !existing.includes(file))) return null;
  for (const file of files) {
    if (!await validateListingPhoto(file)) return null;
  }
  return { wear, price, kept, files };
}

function readDetails(form: FormData) {
  const description = listingText(form.get("description"), 4000, true);
  const state = form.get("state");
  if (!description || (state !== "draft" && state !== "published")) return null;
  return { description, state } as const;
}

export async function parseCs2Creation(form: FormData) {
  const group = form.get("cs2SubmissionId");
  const category = form.get("cs2Category");
  const model = form.get("cs2Model");
  if (!isUuid(group) || !isCs2Category(category) || !isCs2Model(category, model)) return null;
  const name = listingText(form.get("title"), 120 - model.length - 3);
  const details = readDetails(form);
  const selected = form.getAll("cs2Wear").filter(isCs2Wear);
  if (!name || !details || selected.length !== form.getAll("cs2Wear").length || !selected.length
    || new Set(selected).size !== selected.length || (selected.includes("NP") && selected.length !== 1)) return null;
  const variants = await Promise.all(CS2_WEAR.filter(wear => selected.includes(wear)).map(wear => readVariant(form, wear)));
  if (variants.some(variant => variant === null)) return null;
  return { group, category, model, title: `${model} | ${name}`, ...details, variants: variants.filter(variant => variant !== null) };
}

export async function parseCs2Edit(form: FormData, wear: Cs2Wear, existing: readonly string[]) {
  const details = readDetails(form);
  const quantity = form.get("quantity");
  if (!details || (quantity !== "0" && quantity !== "1")) return null;
  const variant = await readVariant(form, wear, existing);
  return variant && { ...details, ...variant, quantity: Number(quantity) };
}
