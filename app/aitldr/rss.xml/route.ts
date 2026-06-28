import { Feed } from "feed";
import { SITE } from "@/lib/site";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";

export async function GET() {
  const posts = getAllPosts();

  const feed = new Feed({
    title: "abdur.ai builder logs",
    description: SITE.description,
    id: `${SITE.url}/`,
    link: SITE.url,
    language: "en",
    image: `${SITE.url}/og-default.jpg`,
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
      id: `${SITE.url}/aitldr/${p.slug}`,
      link: `${SITE.url}/aitldr/${p.slug}`,
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
