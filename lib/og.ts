import { SITE } from "@/lib/site";

/** Site-wide OG size (Twitter/Facebook large card). */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const OG_KICKER = "ABDUR R SAYEED";
export const OG_TAG_POST = "AI TLDR";
export const OG_TAG_HOME = "LOGBOOK";

/**
 * Leftover AGE-1222 static cards under public/og/. They may stay on disk.
 * Live og:image / twitter:image is /api/og — do not point messengers here.
 */
export const OG_LEFTOVER_PNGS = {
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

export type OgCardParams = {
  title: string;
  excerpt?: string;
  path?: string;
  kicker?: string;
  tag?: string;
  meta?: string;
};

/**
 * Tags every messenger must emit.
 * iMessage + Slack read OG; X reads twitter:*. One image set.
 */
export const SHARE_CARD_TAGS = [
  "og:title",
  "og:description",
  "og:image",
  "og:image:alt",
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

/** First sentence of a description — the card excerpt, not a closer. */
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^[\s\S]+?[.!?](?=\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

export function monthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return `${month} ${d.getUTCFullYear()}`;
}

/** encodeURIComponent but keep `/` so path=abdur.ai/aitldr/... matches the handoff URL. */
function encodeOgValue(value: string): string {
  return encodeURIComponent(value).replace(/%2F/gi, "/");
}

export function buildOgPath(params: OgCardParams): string {
  const pairs: Array<[string, string]> = [
    ["title", params.title],
    ["excerpt", params.excerpt ?? ""],
    ["path", params.path ?? "abdur.ai"],
    ["kicker", params.kicker ?? OG_KICKER],
    ["tag", params.tag ?? OG_TAG_POST],
    ["meta", params.meta ?? ""],
  ];
  const qs = pairs
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${encodeOgValue(key)}=${encodeOgValue(value)}`)
    .join("&");
  return `/api/og?${qs}`;
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

const HOME_TITLE = "The logbook";
const HOME_EXCERPT = "What shipped. What broke. What I learned.";

export function ogImageForHome(): OgImage {
  return pngCard(
    buildOgPath({
      title: HOME_TITLE,
      excerpt: HOME_EXCERPT,
      path: "abdur.ai",
      kicker: OG_KICKER,
      tag: OG_TAG_HOME,
    }),
    OG_ALTS.home,
  );
}

export type OgPostInput = {
  slug: string;
  title: string;
  description: string;
  excerpt?: string;
  dek?: string;
  date: string;
};

export function ogImageForPost(post: OgPostInput): OgImage {
  const excerpt = firstSentence(post.description || post.excerpt || post.dek || "");
  const alt =
    OG_ALTS[post.slug as keyof typeof OG_ALTS] || `${post.title} — ${SITE.brand}`;
  return pngCard(
    buildOgPath({
      title: post.title,
      excerpt,
      path: `abdur.ai/aitldr/${post.slug}`,
      kicker: OG_KICKER,
      tag: OG_TAG_POST,
      meta: monthYear(post.date),
    }),
    alt,
  );
}
