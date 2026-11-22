import sharp from "sharp";
import { CS2_MAX_PHOTO_BYTES, CS2_MAX_PHOTO_DIMENSION } from "./cs2";

export async function validateListingPhoto(file: File) {
  if (file.type !== "image/webp" || file.size < 20 || file.size > CS2_MAX_PHOTO_BYTES) return false;
  try {
    const bytes = await file.arrayBuffer();
    const header = new DataView(bytes);
    if (header.getUint32(0) !== 0x52494646 || header.getUint32(8) !== 0x57454250
      || header.getUint32(4, true) !== bytes.byteLength - 8) return false;
    const image = sharp(bytes, { limitInputPixels: CS2_MAX_PHOTO_DIMENSION ** 2, failOn: "warning" });
    const { width, height, pages } = await image.metadata();
    if (width > CS2_MAX_PHOTO_DIMENSION || height > CS2_MAX_PHOTO_DIMENSION || (pages ?? 1) > 1) return false;
    // Decode the image to catch broken image data beyond the container header.
    await image.raw().toBuffer();
    return true;
  } catch { return false; }
}
