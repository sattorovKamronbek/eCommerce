import { describe, it, expect } from "vitest";
import { products } from "@/data/products";
import { normalizeCart, cartTotal } from "./cart";
import { filterProducts } from "./catalog";
import { formatMoney } from "./money";
describe("development cart validation", () => {
  it("rejects invalid products, variants, negative and fractional quantities", () => {
    expect(
      normalizeCart([
        null,
        { productId: "unknown", color: "Qum", quantity: 1 },
        { productId: "p1", color: "invalid", quantity: 1 },
        { productId: "p1", color: "Qum", quantity: -2 },
        { productId: "p1", color: "Qum", quantity: 1.5 },
      ]),
    ).toEqual([]);
  });
  it("caps aggregate stock across colors and merges duplicate lines", () => {
    const result = normalizeCart([
      { productId: "p1", color: "Qum", quantity: 5 },
      { productId: "p1", color: "Qum", quantity: 2 },
      { productId: "p1", color: "Tosh", quantity: 5 },
    ]);
    expect(result).toEqual([
      { productId: "p1", color: "Qum", quantity: 7 },
      { productId: "p1", color: "Tosh", quantity: 1 },
    ]);
  });
  it("rejects unavailable products and malformed persisted state", () => {
    expect(
      normalizeCart([{ productId: "p5", color: "Tabiiy", quantity: 1 }]),
    ).toEqual([]);
    expect(normalizeCart({ items: [] })).toEqual([]);
  });
  it("derives totals from fixture prices", () => {
    expect(
      cartTotal([
        { productId: "p1", color: "Qum", quantity: 2 },
        { productId: "p2", color: "Oq", quantity: 1 },
      ]),
    ).toBe(1460000);
    expect(cartTotal([])).toBe(0);
  });
});
describe("catalog", () => {
  it("combines search, category, availability and price", () => {
    expect(
      filterProducts(products, {
        q: "NUR",
        category: "lighting",
        available: true,
        maxPrice: 900000,
      }).map((p) => p.id),
    ).toEqual(["p2"]);
  });
  it("returns empty search and excludes unavailable stock", () => {
    expect(filterProducts(products, { q: "doesnotexist" })).toEqual([]);
    expect(
      filterProducts(products, { available: true }).some((p) => p.stock === 0),
    ).toBe(false);
  });
  it("sorts without mutating fixture order", () => {
    const original = products.map((p) => p.id);
    const sorted = filterProducts(products, { sort: "price-asc" });
    expect(sorted[0].id).toBe("p5");
    expect(products.map((p) => p.id)).toEqual(original);
  });
  it("filters new arrivals", () => {
    expect(
      filterProducts(products, { fresh: true }).every((p) => p.isNew),
    ).toBe(true);
  });
  it("formats UZS without fractional currency", () => {
    expect(formatMoney(285000).replace(/\s/g, " ")).toBe("285 000 so‘m");
  });
});
