import { Feed } from "feed";
import { SITE } from "@/lib/site";
import { getAllPosts, postPath } from "@/lib/posts";
import { REGISTER_SPEC } from "@/lib/registers";

export const dynamic = "force-static";

/** Canonical feed. `/aitldr/rss.xml` is retained and points at the same items. */
export async function GET() {
  const posts = getAllPosts();

  const feed = new Feed({
    title: "abdur.ai writing",
    description: SITE.description,
    id: `${SITE.url}/`,
    link: SITE.url,
    language: "en",
    image: `${SITE.url}/og-default.jpg`,
    favicon: `${SITE.url}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} ${SITE.author}`,
    updated: posts[0] ? new Date(posts[0].date) : new Date(),
    feedLinks: { rss2: `${SITE.url}/writing/rss.xml` },
    author: { name: SITE.author, email: SITE.email, link: SITE.url },
  });

  posts.forEach((p) => {
    const url = `${SITE.url}${postPath(p.slug)}`;
    feed.addItem({
      title: p.title,
      id: url,
      link: url,
      description: p.dek || p.description,
      content: p.description,
      author: [{ name: p.author, link: SITE.url }],
      date: new Date(p.date),
      // The register travels with the item, so a feed reader carries the same
      // claim-type signal the page does.
      category: [
        { name: REGISTER_SPEC[p.register].label.toLowerCase() },
        ...(p.tags || []).map((t) => ({ name: t })),
      ],
    });
  });

  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
