import { describe, expect, it } from "vitest";
import { parsePublicListingQuery, publicListingHref, publicListingQueryString } from "./public-query";

describe("public listing query", () => {
  it("bounds untrusted search and pagination and accepts only supported sorting", () => {
    expect(parsePublicListingQuery({ q: "  black jacket ", page: "2", sort: "price-asc" })).toEqual({ q: "black jacket", page: 2, sort: "price-asc" });
    expect(parsePublicListingQuery({ q: "a\nb", page: "-1", sort: "invalid" })).toEqual({ q: "", page: 1, sort: "recent" });
    expect(parsePublicListingQuery({ q: ["one", "two"], page: ["2", "3"] })).toEqual({ q: "", page: 1, sort: "recent" });
  });
  it("preserves search and sort safely in pagination links", () => {
    expect(publicListingHref("en", "cs2", { q: "a & b", page: 2, sort: "price-desc" })).toBe("/en/listings/cs2?q=a+%26+b&sort=price-desc&page=2");
  });
  it("preserves validated CS2 filters alongside search, sorting and pagination", () => {
    const filters = parsePublicListingQuery({ q: "Redline", page: "2", sort: "price-asc", category: "rifle", model: "AK-47", wear: "FT" }, "cs2");

    expect(filters.cs2).toEqual({ category: "rifle", model: "AK-47", wear: "FT" });
    expect(publicListingHref("en", "cs2", filters)).toBe("/en/listings/cs2?q=Redline&sort=price-asc&page=2&category=rifle&model=AK-47&wear=FT");
    expect(publicListingHref("en", "fashion", filters)).toBe("/en/listings/fashion?q=Redline&sort=price-asc&page=2");
  });
  it("ignores invalid or repeated taxonomy values and models outside their category", () => {
    expect(parsePublicListingQuery({ category: "pistol", model: "AK-47", wear: "FT" }, "cs2").cs2).toEqual({ category: "pistol", wear: "FT" });
    expect(parsePublicListingQuery({ category: ["rifle", "pistol"], model: "AK-47", wear: ["FN", "BS"] }, "cs2").cs2).toBeUndefined();
    expect(parsePublicListingQuery({ model: "AK-47", wear: "NP" }, "cs2").cs2).toEqual({ wear: "NP" });
    expect(parsePublicListingQuery({ category: "invalid", wear: "unknown" }, "cs2").cs2).toBeUndefined();
  });
  it("keeps taxonomy filters out of search context", () => {
    const query = { q: "Redline", category: "rifle", model: "AK-47", wear: "FN" };
    expect(parsePublicListingQuery(query).cs2).toBeUndefined();
    expect(publicListingQueryString(parsePublicListingQuery(query))).toBe("?q=Redline");
    expect(publicListingQueryString(parsePublicListingQuery(query, "cs2"), true)).toBe("?q=Redline&from=search");
  });
  it("parses exact UZS price bounds and preserves stock and prices in catalog and search links", () => {
    const filters = parsePublicListingQuery({ minPrice: "100,25", maxPrice: "2500", stock: "in-stock", page: "2" }, "cs2");
    expect(filters.price).toMatchObject({ minTiyin: 10025, maxTiyin: 250000 });
    expect(filters.inStock).toBe(true);
    expect(publicListingHref("uz", "cs2", filters)).toBe("/uz/listings/cs2?page=2&minPrice=100%2C25&maxPrice=2500&stock=in-stock");
    expect(publicListingQueryString(filters, true)).toContain("minPrice=100%2C25&maxPrice=2500&stock=in-stock");
    expect(parsePublicListingQuery({ minPrice: "0" }).price).toMatchObject({ minTiyin: 0 });
  });

  it("flags unsupported amounts, repeated inputs and reversed bounds", () => {
    expect(parsePublicListingQuery({ minPrice: "12.345" }).price?.error).toBe("format");
    expect(parsePublicListingQuery({ maxPrice: ["100", "200"] }).price?.error).toBe("format");
    expect(parsePublicListingQuery({ minPrice: "200", maxPrice: "100" }).price?.error).toBe("range");
    expect(parsePublicListingQuery({ stock: ["in-stock", "all"] }).inStock).toBeUndefined();
  });
});
