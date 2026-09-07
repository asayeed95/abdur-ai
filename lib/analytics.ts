import { track } from "@vercel/analytics";
import { buildSubscribeFields } from "@/lib/attribution";

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
 * Source props for analytics events — the SAME vocabulary the subscribe route
 * writes to Resend contact properties (lib/attribution.ts), so "source" means
 * exactly one thing whether you read it in Vercel Events or in Resend.
 */
export function attributionProps(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return buildSubscribeFields(window.location.pathname);
}
