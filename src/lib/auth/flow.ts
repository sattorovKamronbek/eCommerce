import "server-only";
import { cookies } from "next/headers";
import type { MarketplaceLocale } from "@/messages/marketplace";
import { validFlowToken } from "./validation";

export type EmailFlow = { type: "signup" | "recovery"; token: string };
export const flowCookieName = (locale: MarketplaceLocale) => `mp-email-flow-${locale}`;
export async function readEmailFlow(locale: MarketplaceLocale): Promise<EmailFlow | null> {
  const value = (await cookies()).get(flowCookieName(locale))?.value;
  try {
    const flow: unknown = JSON.parse(value ?? "null");
    if (flow && typeof flow === "object" && "type" in flow && "token" in flow
      && (flow.type === "signup" || flow.type === "recovery") && validFlowToken(flow.token)) {
      return { type: flow.type, token: flow.token };
    }
  } catch { /* Untrusted or expired flow is rejected. */ }
  return null;
}
export async function clearEmailFlow(locale: MarketplaceLocale) {
  // Explicit path matches the path used when staging the cookie.
  const store = await cookies();
  store.set(flowCookieName(locale), "", { httpOnly: true, sameSite: "lax", path: `/${locale}/account`, maxAge: 0 });
}
