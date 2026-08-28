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
  /** Helps iMessage / Slack treat the card as a real HTTPS PNG. */
  secureUrl: string;
  type: "image/png";
};

/**
 * Tags every messenger in the AGE-1222 slice must emit.
 * iMessage + Slack read OG; X reads twitter:*. One image set.
 */
export const SHARE_CARD_TAGS = [
  "og:title",
  "og:description",
  "og:image",
  "og:image:width",
  "og:image:height",
  "og:url",
  "og:type",
  "twitter:card",
  "twitter:image",
  "twitter:title",
  "twitter:description",
] as const;

export type ShareCardFields = {
  title: string;
  description: string;
  url: string;
  type: "website" | "article";
  image: OgImage;
};

/** Complete OG + Twitter large-image card. Callers may spread extra article fields. */
export function shareCard({ title, description, url, type, image }: ShareCardFields) {
  return {
    openGraph: {
      type,
      url,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [image],
    },
  };
}

export function absoluteOgUrl(path: string): string {
  if (path.startsWith("https://") || path.startsWith("http://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

function pngCard(path: string, alt: string): OgImage {
  const url = absoluteOgUrl(path);
  return {
    url,
    secureUrl: url,
    type: "image/png",
    width: OG_WIDTH,
    height: OG_HEIGHT,
    alt,
  };
}

export function ogImageForHome(): OgImage {
  return pngCard(OG_PATHS.home, OG_ALTS.home);
}

export function ogImageForPost(slug: string, frontmatterOg?: string): OgImage {
  const known = OG_PATHS[slug as keyof typeof OG_PATHS];
  const path = frontmatterOg || known || `/blog/${slug}/cover.jpg`;
  const alt =
    OG_ALTS[slug as keyof typeof OG_ALTS] || `${slug} — ${SITE.brand}`;
  return pngCard(path, alt);
}
