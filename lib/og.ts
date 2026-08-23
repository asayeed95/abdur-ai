import { SITE } from "@/lib/site";

/** Site-wide OG size (Twitter/Facebook large card). */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * Committed share cards under public/. Home is a logbook card, not a
 * product tour. The two live TLDRs have lesson-specific art.
 */
export const OG_PATHS = {
  home: "/og/home.png",
  "your-pager-is-not-your-customer": "/og/your-pager-is-not-your-customer.png",
  "the-number-is-not-the-person": "/og/the-number-is-not-the-person.png",
} as const;

export const OG_ALTS = {
  home: "abdur.ai — the logbook. What shipped, what broke, what I learned.",
  "your-pager-is-not-your-customer":
    "Your pager is not your customer — four evidence states: signal, diagnosis, mitigation, recovery.",
  "the-number-is-not-the-person":
    "The number is not the person — phone-key persist. A number is a channel, not a principal.",
} as const;

export type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function absoluteOgUrl(path: string): string {
  if (path.startsWith("https://") || path.startsWith("http://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

export function ogImageForHome(): OgImage {
  return {
    url: absoluteOgUrl(OG_PATHS.home),
    width: OG_WIDTH,
    height: OG_HEIGHT,
    alt: OG_ALTS.home,
  };
}

export function ogImageForPost(slug: string, frontmatterOg?: string): OgImage {
  const known = OG_PATHS[slug as keyof typeof OG_PATHS];
  const path = frontmatterOg || known || `/blog/${slug}/cover.jpg`;
  const alt =
    OG_ALTS[slug as keyof typeof OG_ALTS] || `${slug} — ${SITE.brand}`;
  return {
    url: absoluteOgUrl(path),
    width: OG_WIDTH,
    height: OG_HEIGHT,
    alt,
  };
}
