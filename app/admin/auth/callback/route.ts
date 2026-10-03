import { NextResponse, type NextRequest } from "next/server";
import { adminSupabase } from "@/lib/admin/supabase";

/** OAuth / magic-link return: trade the PKCE code for a cookie session. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const sb = await adminSupabase();
  if (!code || !sb) return NextResponse.redirect(new URL("/admin/login?error=1", req.url));
  const { error } = await sb.auth.exchangeCodeForSession(code);
  // Fixed destination: never an open redirect from a query parameter.
  return NextResponse.redirect(new URL(error ? "/admin/login?error=1" : "/admin", req.url));
}
