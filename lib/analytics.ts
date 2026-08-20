/**
 * lib/analytics.ts — the single sink for conversion telemetry on abdur.ai.
 *
 * Before this file existed, `components/post/LeadMagnets.tsx` carried its own
 * local `track()` that called `window.plausible?.()` and `window.va?.()`. Neither
 * script was ever loaded, and optional chaining meant every CTA click resolved to
 * `undefined` — silently, forever, with no error. Zero conversion events were ever
 * recorded. The docstring in that file pointed here, to a file that did not exist.
 *
 * Two rules this module exists to enforce:
 *
 *  1. ONE definition. Call sites import `track` from here and nowhere else. A
 *     second local copy is how the first one rotted unnoticed for months.
 *  2. NO silent no-op. If the analytics transport is missing, `track` says so in
 *     the console in development rather than resolving to `undefined`. An absent
 *     sink is a broken sink, not a quiet success — the same rule the attribution
 *     ledger applies server-side.
 */

import { track as vercelTrack } from "@vercel/analytics";
import { SITE } from "@/lib/site";

/** Canonical outbound-CTA contract — see lib/site.ts. */
const CTA = SITE.flagship.cta;

/**
 * Conversion events, enumerated. A union rather than a bare `string` so a typo
 * is a build error instead of an event that lands in a bucket nobody reads.
 *
 * Naming: `<surface>:<action>` — surface is where the click happened, action is
 * what the visitor was reaching for.
 */
export type ConversionEvent =
  | "post:cta:mnemix-waitlist"
  | "post:cta:asec-copy"
  | "post:cta:newsletter"
  | "home:cta:mnemix-waitlist"
  | "newsletter:submit"
  | "newsletter:success"
  | "newsletter:error";

/** Optional context. Keep values short — Vercel caps custom-event properties. */
export type EventProps = Record<string, string | number | boolean | null>;

/**
 * Record a conversion event.
 *
 * Safe to call during SSR (no-ops off-window by design — there is no user there
 * to convert). Never throws: a telemetry failure must not take down a CTA the
 * visitor is actively clicking.
 */
export function track(event: ConversionEvent, props?: EventProps): void {
  if (typeof window === "undefined") return;

  try {
    vercelTrack(event, props);
  } catch (error) {
    // Loud in development, quiet in production. A visitor mid-signup should
    // never see a console error because a beacon failed — but a developer
    // wiring a new CTA should find out immediately if the sink is missing.
    if (process.env.NODE_ENV === "development") {
      console.warn(`[analytics] "${event}" was not recorded:`, error);
    }
  }
}

/**
 * Attribution ref for outbound links to mnemix.ai.
 *
 * The Mnemix signup form does not read this yet — it POSTs a hardcoded
 * `source: "landing-page"` regardless of referrer, so today this parameter is
 * carried and dropped on arrival. It is set now anyway: the moment the Mnemix
 * side reads `?ref=`, every link already in the wild starts attributing, with no
 * second pass over published posts.
 *
 * Pair this with the `packet_id` carrier scheme in
 * `content/workflows/attribution/` once the signed ingress exists.
 */
export function mnemixUrl(surface: string, hash = CTA.fragment): string {
  // Query string BEFORE the fragment. Reversed, everything after `#` becomes the
  // fragment, the params never reach `location.search`, and the ref is silently
  // inert — a broken carrier that looks exactly like a working one.
  //
  // Built from SITE.flagship.cta rather than literals so there is one source of
  // truth for the destination. The claims checker validates this template against
  // the same constants; hardcoding here would let the two drift apart in
  // compensating directions and still pass.
  return (
    `${CTA.origin}/?${CTA.refParam}=${CTA.refValue}` +
    `&${CTA.surfaceParam}=${encodeURIComponent(surface)}#${hash}`
  );
}
