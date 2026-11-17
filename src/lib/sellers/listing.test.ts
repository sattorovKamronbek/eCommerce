import { describe, expect, it } from "vitest";
import { parseListing, parseUzsTiyin } from "./listing";

function form(values: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}
const base = { ecosystem: "cs2", title: "  AK skin  ", description: " Seller description ", category: "Rifle", variant: "", price: "1000.50", quantity: "1", state: "draft" };

describe("seller listing validation", () => {
  it("parses UZS exactly in integer tiyin without float rounding", () => {
    expect(parseUzsTiyin("1000.50")).toBe(100050);
    expect(parseUzsTiyin("0.01")).toBe(1);
    expect(parseUzsTiyin("42")).toBe(4200);
    for (const value of ["", "0", "-1", "1e4", "1,000", "1.001", "1000000000000.01", "Infinity"]) expect(parseUzsTiyin(value)).toBeNull();
  });
  it("normalizes a valid listing and enforces CS2 quantity", () => {
    expect(parseListing(form(base))).toEqual({ ecosystem: "cs2", title: "AK skin", description: "Seller description", category: "Rifle", variant: "", price_tiyin: 100050, quantity: 1, state: "draft" });
    expect(parseListing(form({ ...base, quantity: "2" }))).toBeNull();
    expect(parseListing(form({ ...base, ecosystem: "fashion", quantity: "2", variant: "M / Black" }))?.quantity).toBe(2);
  });
  it("rejects unsupported categories, invalid quantities and invalid publication states", () => {
    for (const values of [
      { ...base, ecosystem: "other" }, { ...base, title: "A\nB" }, { ...base, quantity: "-1" },
      { ...base, quantity: "1.5" }, { ...base, state: "approved" }, { ...base, description: " " },
    ]) expect(parseListing(form(values))).toBeNull();
  });
});
