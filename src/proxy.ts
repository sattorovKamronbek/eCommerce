import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
export function proxy(request: NextRequest) { return updateSession(request); }
export const config = { matcher: ["/:locale/account/:path*", "/:locale/admin/:path*", "/:locale/auth/:path*", "/:locale/seller/:path*"] };
