import type { MetadataRoute } from "next";
import { getAllPosts, postPath } from "@/lib/posts";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  // `lastModified` must say when the page's content last changed. It used to be
  // `new Date()` for every static page, i.e. "changed at build time" on every
  // deploy, which search engines learn to ignore. The index pages change when
  // the latest post change does; the rest have no reliable change date, so they
  // omit it. getAllPosts() sorts by publication date, so an older post updated
  // after the newest one was published would be missed by posts[0]: take the
  // latest `updated` (falling back to `date`) across every post instead.
  const changeTimes = posts
    .map((p) => new Date(p.updated || p.date).getTime())
    .filter((t) => !Number.isNaN(t));
  const newestChange = changeTimes.length ? new Date(Math.max(...changeTimes)) : undefined;

  const staticPages = [
    { url: `${SITE.url}/`, lastModified: newestChange, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/writing`, lastModified: newestChange, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/about`, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${SITE.url}/now`, priority: 0.6, changeFrequency: "weekly" as const },
    { url: `${SITE.url}/hire`, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${SITE.url}/kit`, priority: 0.8, changeFrequency: "monthly" as const },
  ];

  const postPages = posts.map((p) => ({
    url: `${SITE.url}${postPath(p.slug)}`,
    lastModified: new Date(p.updated || p.date),
    priority: p.flagship ? 1.0 : 0.8,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...postPages];
}
