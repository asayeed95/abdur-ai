import { Feed } from "feed";
import { SITE } from "./site";
import {
  getAllPosts,
  getPostSource,
  postPath,
  resolveRelated,
  type PostMeta,
} from "./posts";
import { REGISTER_SPEC } from "./registers";

export function absolutePostUrl(slug: string): string {
  return `${SITE.url}${postPath(slug)}`;
}

export function markdownTwinPath(slug: string): string {
  return `${postPath(slug)}.md`;
}

export function markdownTwinUrl(slug: string): string {
  return `${SITE.url}${markdownTwinPath(slug)}`;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

/**
 * Machine record carried beside the post body in feeds, markdown twins, and
 * llms-full.txt. Values come from frontmatter already on the published post.
 */
export function machineRecord(post: PostMeta): string {
  const related = resolveRelated(post);
  const lines = [
    `register: ${post.register}`,
    ...(post.series ? [`series: ${yamlString(post.series)}`] : []),
    ...(post.citation ? [`citation_preferred: ${yamlString(post.citation)}`] : []),
    `markdown: ${markdownTwinUrl(post.slug)}`,
  ];
  if (related.length) {
    lines.push("related:");
    for (const item of related) {
      lines.push(`  - ${absolutePostUrl(item.slug)}`);
    }
  }
  return lines.join("\n");
}

/** Published markdown twin: frontmatter the page emits, then the post body. */
export function fullPostMarkdown(post: PostMeta): string {
  const body = (getPostSource(post.slug) ?? "").trim();
  const related = resolveRelated(post);
  const lines = [
    "---",
    `title: ${yamlString(post.title)}`,
    `url: ${absolutePostUrl(post.slug)}`,
    `date: ${yamlString(post.date)}`,
    `register: ${post.register}`,
  ];
  if (post.series) lines.push(`series: ${yamlString(post.series)}`);
  if (post.citation) lines.push(`citation_preferred: ${yamlString(post.citation)}`);
  if (related.length) {
    lines.push("related:");
    for (const item of related) lines.push(`  - ${item.slug}`);
  }
  lines.push("---", "", body, "");
  return lines.join("\n");
}

function itemContent(post: PostMeta): string {
  const body = (getPostSource(post.slug) ?? "").trim();
  return `${body}\n\n---\n${machineRecord(post)}\n`;
}

function itemCategories(post: PostMeta): { name: string }[] {
  return [
    { name: REGISTER_SPEC[post.register].label.toLowerCase() },
    ...(post.series ? [{ name: post.series }] : []),
    ...(post.tags || []).map((tag) => ({ name: tag })),
  ];
}

/**
 * RSS 2.0 for the writing corpus. `content:encoded` is the published markdown
 * plus the machine record. `description` stays the dek.
 */
export function buildRssFeed(options: {
  title: string;
  rssUrl: string;
  image: string;
}): string {
  const posts = getAllPosts();
  const feed = new Feed({
    title: options.title,
    description: SITE.description,
    id: `${SITE.url}/`,
    link: SITE.url,
    language: "en",
    image: options.image,
    favicon: `${SITE.url}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} ${SITE.author}`,
    updated: posts[0] ? new Date(posts[0].date) : new Date(),
    feed: options.rssUrl,
    feedLinks: {
      rss2: options.rssUrl,
      json: `${SITE.url}/writing/feed.json`,
    },
    author: { name: SITE.author, email: SITE.email, link: SITE.url },
  });

  for (const post of posts) {
    const url = absolutePostUrl(post.slug);
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.dek || post.description,
      content: itemContent(post),
      author: [{ name: post.author, link: SITE.url }],
      date: new Date(post.date),
      category: itemCategories(post),
    });
  }

  return feed.rss2();
}

/**
 * JSON Feed 1.1. The body is `content_text` (markdown). There is no HTML
 * body field, because this site does not render a second HTML copy for the feed.
 */
export function buildJsonFeed(): string {
  const posts = getAllPosts();
  const document = {
    version: "https://jsonfeed.org/version/1.1",
    title: "abdur.ai writing",
    home_page_url: `${SITE.url}/writing`,
    feed_url: `${SITE.url}/writing/feed.json`,
    description: SITE.description,
    language: "en",
    authors: [{ name: SITE.author, url: SITE.url }],
    items: posts.map((post) => {
      const related = resolveRelated(post);
      return {
        id: absolutePostUrl(post.slug),
        url: absolutePostUrl(post.slug),
        title: post.title,
        summary: post.dek || post.description,
        content_text: itemContent(post),
        date_published: new Date(post.date).toISOString(),
        date_modified: new Date(post.updated || post.date).toISOString(),
        authors: [{ name: post.author, url: SITE.url }],
        tags: itemCategories(post).map((category) => category.name),
        _abdur: {
          register: post.register,
          ...(post.series ? { series: post.series } : {}),
          ...(post.citation ? { citation_preferred: post.citation } : {}),
          markdown: markdownTwinUrl(post.slug),
          related: related.map((item) => absolutePostUrl(item.slug)),
        },
      };
    }),
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}
