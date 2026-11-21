import { CS2_MAX_PHOTO_BYTES, CS2_MAX_PHOTO_DIMENSION } from "@/lib/sellers/cs2";

const sourceTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSourceBytes = 12_000_000;
const canvasSizes = [CS2_MAX_PHOTO_DIMENSION, 960, 720, 540, 400];
const webpQualities = [0.88, 0.74, 0.6];

export const cs2PhotoAccept = sourceTypes.join(",");

export function acceptsCs2Photo(file: File) {
  return sourceTypes.includes(file.type) && file.size > 0 && file.size <= maxSourceBytes;
}

export async function prepareCs2Photo(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create canvas context");

    let previousScale = 0;
    for (const size of canvasSizes) {
      const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
      if (scale === previousScale) continue;
      previousScale = scale;
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of webpQualities) {
        const encoded = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
        if (encoded?.type !== "image/webp") throw new Error("Could not encode image as WebP");
        if (encoded.size > 0 && encoded.size <= CS2_MAX_PHOTO_BYTES) {
          return new File([encoded], "photo.webp", { type: encoded.type });
        }
      }
    }
    throw new Error("Could not compress photo to the upload limit");
  } finally {
    bitmap.close();
  }
}
