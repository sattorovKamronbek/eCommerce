import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ create: vi.fn(), config: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.create }));
vi.mock("./config", () => ({ getAuthConfig: mocks.config }));
import { createPublicSupabaseClient } from "./public";

it("creates a cookie-free public client that cannot rotate a visitor's session", () => {
  mocks.config.mockReturnValue({ url: "https://example.supabase.co", key: "public", origin: "https://example.test" });
  createPublicSupabaseClient();
  const options = mocks.create.mock.calls[0][2];
  expect(options.auth).toEqual({ persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
  expect(options.cookies).toBeUndefined();
});
