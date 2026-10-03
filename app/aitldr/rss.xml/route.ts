import { buildRssFeed } from "@/lib/legibility";
import { ogImageForHome } from "@/lib/og";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/** Retained legacy feed. Items link to canonical /writing URLs and carry the same body. */
export async function GET() {
  const xml = buildRssFeed({
    title: "abdur.ai builder logs",
    rssUrl: `${SITE.url}/aitldr/rss.xml`,
    image: ogImageForHome().url,
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
