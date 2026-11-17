export type ListingInput = {
  ecosystem: "cs2" | "fashion"; title: string; description: string; category: string; variant: string;
  price_tiyin: number; quantity: number; state: "draft" | "published";
};
export type ListingActionState = { error?: "invalid" | "unavailable" };

export function parseUzsTiyin(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(0|[1-9]\d{0,12})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const amount = BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
  return amount > BigInt(0) && amount <= BigInt("100000000000000") ? Number(amount) : null;
}

function text(value: FormDataEntryValue | null, max: number, multiline = false, optional = false): string | null {
  if (typeof value !== "string") return null;
  if ((multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/).test(value)) return null;
  const result = value.trim();
  return [...result].length <= max && (optional || result.length > 0) ? result : null;
}

export function parseListing(form: FormData): ListingInput | null {
  const ecosystem = form.get("ecosystem");
  const state = form.get("state");
  const rawQuantity = form.get("quantity");
  if ((ecosystem !== "cs2" && ecosystem !== "fashion") || (state !== "draft" && state !== "published") || typeof rawQuantity !== "string" || !/^(0|[1-9]\d{0,6})$/.test(rawQuantity)) return null;
  const quantity = Number(rawQuantity);
  if (quantity > 1000000 || (ecosystem === "cs2" && quantity > 1)) return null;
  const title = text(form.get("title"), 120);
  const description = text(form.get("description"), 4000, true);
  const category = text(form.get("category"), 80, false, true);
  const variant = text(form.get("variant"), 80, false, true);
  const price = parseUzsTiyin(form.get("price"));
  if (!title || !description || category === null || variant === null || price === null) return null;
  return { ecosystem, title, description, category, variant, price_tiyin: price, quantity, state };
}
