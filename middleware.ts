import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Application-microsite subdomains: flightcast.abdur.ai → /apply/flightcast.
 * Inert until a subdomain's DNS + Vercel domain exist (the founder's one-time
 * flip via scripts/apply-domain.sh). Reserved subdomains never rewrite; the
 * /apply/[slug] route 404s any slug without a config, so an unexpected
 * hostname can never render fabricated content.
 */
const RESERVED = new Set([
  "www",
  "abdur",
  "dashboard",
  "api",
  "mail",
  "inbound",
  "mnemix",
  "staging",
  "preview",
]);

/**
 * /admin keeps a cookie session (lib/admin/supabase.ts). Server Components
 * cannot write cookies, so the access-token refresh happens here, before the
 * page renders. Every other path skips this entirely.
 */
async function refreshAdminSession(req: NextRequest): Promise<NextResponse> {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of list) res.cookies.set(name, value, options);
      },
    },
  });
  await sb.auth.getUser();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin" || req.nextUrl.pathname.startsWith("/admin/")) {
    return refreshAdminSession(req);
  }
  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (!host.endsWith(".abdur.ai")) return NextResponse.next();

  const sub = host.slice(0, -".abdur.ai".length);
  if (!sub || sub.includes(".") || RESERVED.has(sub) || !/^[a-z0-9-]+$/.test(sub)) {
    return NextResponse.next();
  }
  // Rewrite ONLY the root. Every other path (/hire, /aitldr, …) must keep
  // serving the real site, or the microsite's own outbound links loop back
  // to itself (review F8).
  if (req.nextUrl.pathname !== "/") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/apply/${sub}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
