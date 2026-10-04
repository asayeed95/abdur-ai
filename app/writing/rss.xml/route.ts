import { buildRssFeed } from "@/lib/legibility";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** Canonical feed. Item bodies are the published markdown, not the dek. */
export async function GET() {
  const xml = buildRssFeed({
    title: "abdur.ai writing",
    rssUrl: `${SITE.url}/writing/rss.xml`,
    image: `${SITE.url}/og-default.jpg`,
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
