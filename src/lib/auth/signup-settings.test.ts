import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readSignupSettings } from "./signup-settings";
const config = { url: "https://example.supabase.co", key: "sb_publishable_test", origin: "https://app.test" };
afterEach(() => vi.unstubAllGlobals());
it.each([
  [{ external: { email: true }, mailer_autoconfirm: true }, "ready"],
  [{ external: { email: true }, mailer_autoconfirm: false }, "confirmation-required"],
  [{ external: { email: true }, mailer_autoconfirm: "true" }, "unavailable"],
  [{ external: { email: false }, mailer_autoconfirm: true }, "unavailable"],
  [{ external: { email: true }, mailer_autoconfirm: true, disable_signup: true }, "unavailable"],
  [{}, "unavailable"],
  [null, "unavailable"],
])("checks public provider settings without accepting malformed values: %j", async (settings, expected) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(settings)));
  expect(await readSignupSettings(config)).toBe(expected);
});
it("fails closed on HTTP, JSON and network failures", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  for (const response of [new Response("failure", { status: 500 }), new Response("not-json")]) {
    fetcher.mockResolvedValue(response);
    expect(await readSignupSettings(config)).toBe("unavailable");
  }
  fetcher.mockRejectedValue(new Error("private transport detail"));
  expect(await readSignupSettings(config)).toBe("unavailable");
});
