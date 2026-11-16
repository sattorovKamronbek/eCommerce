import { products } from "@/data/products";
export type CartItem = { productId: string; color: string; quantity: number };
export function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const result: CartItem[] = [];
  for (const row of value.slice(0, 100)) {
    if (!row || typeof row !== "object") continue;
    const p = products.find((p) => p.id === row.productId);
    if (
      !p ||
      !p.colors.includes(row.color) ||
      !Number.isInteger(row.quantity) ||
      row.quantity < 1
    )
      continue;
    const used = result
      .filter((i) => i.productId === p.id)
      .reduce((n, i) => n + i.quantity, 0);
    const quantity = Math.min(row.quantity, p.stock - used);
    if (quantity > 0) {
      const existing = result.find(
        (i) => i.productId === p.id && i.color === row.color,
      );
      if (existing) existing.quantity += quantity;
      else result.push({ productId: p.id, color: row.color, quantity });
    }
  }
  return result;
}
export function cartTotal(items: CartItem[]) {
  return normalizeCart(items).reduce(
    (sum, item) =>
      sum +
      (products.find((p) => p.id === item.productId)?.price ?? 0) *
        item.quantity,
    0,
  );
}
