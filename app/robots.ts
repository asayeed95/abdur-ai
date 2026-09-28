import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Card crawlers (Twitterbot, LinkedInBot, Slackbot…) are not named below, so
      // they inherit this group and obey it. Every post's og:image is /api/og?…,
      // so it needs its own Allow: the longest matching rule wins, which keeps the
      // rest of /api/ closed. scripts/check-robots.mjs guards this on the built file.
      { userAgent: "*", allow: ["/", "/api/og"], disallow: ["/api/"] },
      // AI crawlers — explicitly welcomed
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
