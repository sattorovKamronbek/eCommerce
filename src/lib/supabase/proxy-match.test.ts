// @vitest-environment node
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config } from "@/proxy";

it("refreshes and protects session-bearing seller routes", () => {
  expect(unstable_doesMiddlewareMatch({ config, url: "/en/seller/apply" })).toBe(true);
  expect(unstable_doesMiddlewareMatch({ config, url: "/uz/seller/products" })).toBe(true);
});
