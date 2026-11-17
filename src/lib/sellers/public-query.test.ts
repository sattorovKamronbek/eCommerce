import { describe, expect, it } from "vitest";
import { parsePublicListingQuery, publicListingHref } from "./public-query";

describe("public listing query", () => {
  it("bounds untrusted search and pagination and accepts only supported sorting", () => {
    expect(parsePublicListingQuery({ q: "  black jacket ", page: "2", sort: "price-asc" })).toEqual({ q: "black jacket", page: 2, sort: "price-asc" });
    expect(parsePublicListingQuery({ q: "a\nb", page: "-1", sort: "invalid" })).toEqual({ q: "", page: 1, sort: "recent" });
    expect(parsePublicListingQuery({ q: ["one", "two"], page: ["2", "3"] })).toEqual({ q: "", page: 1, sort: "recent" });
  });
  it("preserves search and sort safely in pagination links", () => {
    expect(publicListingHref("en", "cs2", { q: "a & b", page: 2, sort: "price-desc" })).toBe("/en/listings/cs2?q=a+%26+b&sort=price-desc&page=2");
  });
});
