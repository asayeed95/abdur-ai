import type { MetadataRoute } from "next";
import { markdownTwinPath } from "@/lib/legibility";
import { getAllPosts, postPath } from "@/lib/posts";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const posts = getAllPosts();

  const staticPages = [
    { url: `${SITE.url}/`, lastModified: now, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/writing`, lastModified: now, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/about`, lastModified: now, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${SITE.url}/now`, lastModified: now, priority: 0.6, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/hire`, lastModified: now, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${SITE.url}/llms.txt`, lastModified: now, priority: 0.3, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/llms-full.txt`, lastModified: now, priority: 0.3, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/writing/rss.xml`, lastModified: now, priority: 0.3, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/writing/feed.json`, lastModified: now, priority: 0.3, changeFrequency: "weekly" as const },
  ];

  const postPages = posts.map((p) => ({
    url: `${SITE.url}${postPath(p.slug)}`,
    lastModified: new Date(p.updated || p.date),
    priority: p.flagship ? 1.0 : 0.8,
    changeFrequency: "monthly" as const,
  }));

  const markdownTwins = posts.map((p) => ({
    url: `${SITE.url}${markdownTwinPath(p.slug)}`,
    lastModified: new Date(p.updated || p.date),
    priority: 0.3,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...postPages, ...markdownTwins];
}
