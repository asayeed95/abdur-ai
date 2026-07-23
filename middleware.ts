import { NextRequest, NextResponse } from "next/server";

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

export function middleware(req: NextRequest) {
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
