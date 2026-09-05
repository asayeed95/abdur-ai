import { Feed } from "feed";
import { SITE } from "@/lib/site";
import { getAllPosts, postPath } from "@/lib/posts";
import { ogImageForHome } from "@/lib/og";

export const dynamic = "force-static";

/** Retained legacy feed. Items link to the canonical /writing URLs. */

export async function GET() {
  const posts = getAllPosts();

  const feed = new Feed({
    title: "abdur.ai builder logs",
    description: SITE.description,
    id: `${SITE.url}/`,
    link: SITE.url,
    language: "en",
    image: ogImageForHome().url,
    favicon: `${SITE.url}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} ${SITE.author}`,
    updated: posts[0] ? new Date(posts[0].date) : new Date(),
    feedLinks: {
      rss2: `${SITE.url}/aitldr/rss.xml`,
    },
    author: {
      name: SITE.author,
      email: SITE.email,
      link: SITE.url,
    },
  });

  posts.forEach((p) => {
    feed.addItem({
      title: p.title,
      // GUID stays on the legacy URL so existing subscribers' readers do not
      // re-surface every post as new; only the click-through link moves.
      id: `${SITE.url}/aitldr/${p.slug}`,
      link: `${SITE.url}${postPath(p.slug)}`,
      description: p.dek || p.description,
      content: p.description,
      author: [{ name: p.author, link: SITE.url }],
      date: new Date(p.date),
      category: (p.tags || []).map((t) => ({ name: t })),
    });
  });

  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
