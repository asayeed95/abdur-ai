import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type PostMeta = {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  dek?: string;
  date: string; // ISO
  dateDisplay: string; // "JUN 25"
  updated?: string;
  author: string;
  tags?: string[];
  readingTime?: number; // minutes
  wordCount?: number;
  section?: string;
  flagship?: boolean;
  pinned?: boolean;
  featured?: boolean;
  ogImage?: string;
  patterns?: { id: string; name: string }[];
  receipts?: Array<{ path: string; sha?: string; lines?: string; note?: string }>;
  citation?: string;
  related?: string[];
};

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function listMdxFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  const m = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${m} ${day}`;
}

/**
 * YAML frontmatter parses unquoted ISO dates into JS Date objects.
 * Coerce to an ISO string so the `date: string` contract holds for all
 * consumers (homepage Latest section, llms.txt, RSS).
 */
function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return "";
}

export function getAllPosts(): PostMeta[] {
  const files = listMdxFiles();
  const posts = files
    .map((file) => {
      const slug = file.replace(/\.mdx?$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const words = content.trim().split(/\s+/).length;
      const dateIso = toIso(data.date);
      const meta: PostMeta = {
        slug: data.slug || slug,
        title: data.title || slug,
        subtitle: data.subtitle,
        description: data.description || data.dek || "",
        dek: data.dek || data.description,
        date: dateIso,
        dateDisplay: dateIso ? shortDate(dateIso) : "",
        updated: toIso(data.updated) || dateIso,
        author: data.author || "Abdur Rahman Sayeed",
        tags: data.tags || [],
        readingTime: data.reading_time || Math.max(1, Math.round(words / 220)),
        wordCount: data.word_count || words,
        section: data.section,
        flagship: !!data.flagship,
        pinned: !!data.pinned,
        featured: !!data.featured,
        ogImage: data.og?.image,
        patterns: data.patterns,
        receipts: data.receipts,
        citation: data.citation_preferred,
        related: data.related,
      };
      return meta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

export function getPost(slug: string): PostMeta | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}
