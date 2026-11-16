import { expect, it } from "vitest";
import { sellerPageRange, sellerPageResults } from "./pagination";

it("makes all pending applications reachable without showing the extra lookahead row", () => {
  expect(sellerPageRange(1)).toEqual({ from: 0, to: 50 });
  expect(sellerPageRange(2)).toEqual({ from: 50, to: 100 });
  expect(sellerPageResults(Array.from({ length: 51 }, (_, i) => i))).toEqual({ rows: Array.from({ length: 50 }, (_, i) => i), hasNext: true });
  expect(sellerPageResults([50])).toEqual({ rows: [50], hasNext: false });
});
