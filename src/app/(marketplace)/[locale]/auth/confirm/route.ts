import { NextResponse, type NextRequest } from "next/server";
import { isMarketplaceLocale } from "@/messages/marketplace";
import { getAuthConfig } from "@/lib/supabase/config";
import { flowCookieName } from "@/lib/auth/flow";
import { validFlowToken } from "@/lib/auth/validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isMarketplaceLocale(locale)) return new NextResponse(null, { status: 404 });
  const config = getAuthConfig();
  if (!config) return new NextResponse(null, { status: 303, headers: { Location: `/${locale}/account/login`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  const token = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const valid = validFlowToken(token) && (type === "signup" || type === "recovery")
    && request.nextUrl.searchParams.getAll("token_hash").length === 1 && request.nextUrl.searchParams.getAll("type").length === 1;
  const destination = !valid ? "login?notice=invalidLink" : type === "recovery" ? "reset-password" : "confirm-email";
  // Same-origin redirect does not depend on an untrusted Host header or next parameter.
  const response = NextResponse.redirect(new URL(`/${locale}/account/${destination}`, config.origin), 303);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set(flowCookieName(locale), valid ? JSON.stringify({ type, token }) : "", {
    httpOnly: true, sameSite: "lax", secure: config.origin.startsWith("https:"),
    path: `/${locale}/account`, maxAge: valid ? 600 : 0,
  });
  return response;
}
