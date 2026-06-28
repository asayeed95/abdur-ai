import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const posts = getAllPosts();

  const staticPages = [
    { url: `${SITE.url}/`, lastModified: now, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/aitldr`, lastModified: now, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/about`, lastModified: now, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${SITE.url}/now`, lastModified: now, priority: 0.6, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/hire`, lastModified: now, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${SITE.url}/uses`, lastModified: now, priority: 0.5, changeFrequency: "monthly" as const },
  ];

  const postPages = posts.map((p) => ({
    url: `${SITE.url}/aitldr/${p.slug}`,
    lastModified: new Date(p.updated || p.date),
    priority: p.flagship ? 1.0 : 0.8,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...postPages];
}
