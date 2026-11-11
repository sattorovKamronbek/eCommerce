import { describe, expect, it } from "vitest";
import { filterMarketplaceSamples, formatSamplePrice, sampleFilterQuery } from "./marketplace";
import { marketplaceSamples } from "@/data/marketplace-samples";
import { products } from "@/data/products";

describe("development marketplace boundaries", () => {
  it("never crosses ecosystems even when a type belongs to the other domain", () => {
    expect(filterMarketplaceSamples("cs2", "en", { type: "outerwear" })).toEqual([]);
    expect(filterMarketplaceSamples("fashion", "en", {}).every((item) => item.ecosystem === "fashion")).toBe(true);
  });
  it("searches the selected locale including Cyrillic and Uzbek casing", () => {
    expect(filterMarketplaceSamples("fashion", "ru", { q: "  ПЕСОЧНАЯ " }).map((item) => item.id)).toEqual(["sand-overshirt"]);
    expect(filterMarketplaceSamples("cs2", "uz", { q: "BINAfSHA" }).map((item) => item.id)).toEqual(["violet-rifle"]);
  });
  it("sorts a copy without mutating source order or introducing other types", () => {
    const order = marketplaceSamples.map((item) => item.id);
    const found = filterMarketplaceSamples("cs2", "en", { sort: "price-desc", type: "rifle" });
    expect(found.map((item) => item.id)).toEqual(["night-rifle", "violet-rifle"]);
    expect(marketplaceSamples.map((item) => item.id)).toEqual(order);
  });
  it("keeps sample identities out of the preserved browser cart catalog", () => {
    const legacyIds = new Set(products.map((item) => item.id));
    expect(marketplaceSamples.some((item) => legacyIds.has(item.id))).toBe(false);
  });
  it("identifies sample currency consistently across languages", () => {
    for (const locale of ["uz", "ru", "en"] as const) expect(formatSamplePrice(125000, locale)).toContain("UZS");
  });
  it("encodes search text without letting it replace a filter or add parameters", () => {
    const query = sampleFilterQuery({ q: "  rifle &type=knife #  ", type: "rifle", sort: "price-desc" });
    const params = new URLSearchParams(query);
    expect(params.get("q")).toBe("rifle &type=knife #");
    expect(params.getAll("type")).toEqual(["rifle"]);
    expect(params.get("sort")).toBe("price-desc");
    expect(Array.from(params.keys())).toEqual(["q", "type", "sort"]);
  });
  it("omits empty filters and the default sort from navigable links", () => {
    expect(sampleFilterQuery({})).toBe("");
    expect(sampleFilterQuery({ q: "  ", type: "", sort: "featured" })).toBe("");
    expect(sampleFilterQuery({ q: "x".repeat(110) })).toBe(`?q=${"x".repeat(100)}`);
  });
  it("removes a type while retaining the search and sort context", () => {
    const params = new URLSearchParams(sampleFilterQuery({ q: "rifle", type: "", sort: "price-asc" }));
    expect(params.get("q")).toBe("rifle");
    expect(params.has("type")).toBe(false);
    expect(params.get("sort")).toBe("price-asc");
  });
});
