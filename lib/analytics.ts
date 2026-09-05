import { track } from "@vercel/analytics";

/**
 * Single funnel for all custom analytics events. Wraps Vercel Web
 * Analytics (`track` is a no-op during SSR and when the insights script
 * is blocked), so call sites never touch a `window.*` global directly.
 *
 * Rule: never pass PII (email addresses, names, IPs) in props — event
 * names and props go to the analytics dashboard. Coarse strings only
 * (e.g. which CTA, which surface), never user input.
 */
/**
 * The catalog. A name not in this list is a type error, so a misspelled or
 * removed event cannot compile and quietly create an untracked variant.
 * Add here first, then at the call site; README "Event catalog" mirrors it.
 */
export const ANALYTICS_EVENTS = [
  "cta:northsun:from-post",
  "cta:asec:from-post",
  "cta:newsletter:from-post",
  "subscribe:tldr",
  "subscribe:asec-waitlist",
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function trackEvent(name: AnalyticsEventName, props?: Record<string, string>) {
  track(name, props);
}

/**
 * Source-props seam for subscriber attribution (PR #38,
 * feat/subscriber-attribution → lib/attribution.ts). That branch owns the
 * single capture mechanism for "where the subscriber came from"
 * (first-touch UTMs / landing_path / referrer in sessionStorage). When it
 * lands, this becomes one import-line change —
 * `return buildSubscribeFields(window.location.pathname)` — so a `source`
 * prop on an event uses the identical vocabulary as Resend contact
 * properties and "source" means exactly one thing. Until then it returns
 * no props; call sites are already wired through it.
 */
export function attributionProps(): Record<string, string> {
  return {};
}
