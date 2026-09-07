import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { isRegister, REGISTER_SPEC, REGISTERS, type Register } from "./registers";
import { POST_BASE } from "./site";

/**
 * Canonical public base for a post. `/aitldr/<slug>` still serves the same
 * content, but every generated link, feed item, sitemap entry and JSON-LD
 * `@id` points here, so the duplicate surface never competes with this one.
 */
export { POST_BASE };

export function postPath(slug: string): string {
  return `${POST_BASE}/${slug}`;
}

export type PostMeta = {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  excerpt?: string;
  dek?: string;
  date: string; // ISO
  dateDisplay: string; // "JUN 25"
  updated?: string;
  author: string;
  tags?: string[];
  readingTime?: number; // minutes
  wordCount?: number;
  section?: string;
  /** Which claim this post is making. Required on every published post. */
  register: Register;
  /** One-line status note near the top. Omitted for `reported`. */
  statusNote?: string;
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

/**
 * Posts are `.mdx`. Plain `.md` in this directory is documentation
 * (`README.md`, `REGISTERS.md`), not content.
 *
 * This used to accept `.md` too and exclude `README.md` by name — an
 * allowlist-by-exception that held only until the second doc file landed here,
 * at which point the doc was parsed as an undeclared post and failed the
 * build. Extension is the rule now, so the next doc dropped in this folder is
 * a non-event.
 */
function listMdxFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_") && !f.startsWith("."));
}

/** Per-post cover if present, else the site default. No custom image required. */
export function resolveOgPath(post: PostMeta): string {
  if (post.ogImage) return post.ogImage;
  const cover = path.join(process.cwd(), "public", "blog", post.slug, "cover.jpg");
  if (fs.existsSync(cover)) return `/blog/${post.slug}/cover.jpg`;
  return "/og-default.jpg";
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  })
    .format(d)
    .toUpperCase();
}

/**
 * Every published post declares its register. This throws rather than
 * defaulting, because a wrong default is a false claim about the standard of
 * evidence a piece meets — exactly what the register exists to prevent. The
 * throw surfaces in `npm run build`, so an undeclared post cannot reach prod.
 */
function requireRegister(file: string, value: unknown): Register {
  if (isRegister(value)) return value;
  throw new Error(
    `content/posts/${file}: missing or invalid \`register:\` frontmatter ` +
      `(got ${JSON.stringify(value)}). Every published post must declare one of: ` +
      `${REGISTERS.join(", ")}. See content/posts/REGISTERS.md.`,
  );
}

function resolveStatusNote(register: unknown, override: unknown): string | undefined {
  if (typeof override === "string" && override.trim()) return override.trim();
  if (!isRegister(register)) return undefined;
  return REGISTER_SPEC[register].note ?? undefined;
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
        excerpt: typeof data.excerpt === "string" ? data.excerpt : undefined,
        dek: data.dek || data.description,
        date: dateIso,
        dateDisplay: dateIso ? shortDate(dateIso) : "",
        updated: toIso(data.updated) || dateIso,
        author: data.author || "Abdur Rahman Sayeed",
        tags: data.tags || [],
        readingTime: data.reading_time || Math.max(1, Math.round(words / 220)),
        wordCount: data.word_count || words,
        section: data.section,
        register: requireRegister(file, data.register),
        statusNote: resolveStatusNote(data.register, data.status_note),
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

/** Raw MDX body (frontmatter stripped) for a published slug, or null. */
export function getPostSource(slug: string): string | null {
  // Same key getAllPosts() uses (frontmatter `slug`, else filename), so a post
  // whose declared slug differs from its filename resolves the same way for
  // both the route and the body.
  for (const file of listMdxFiles()) {
    const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"));
    if ((data.slug || file.replace(/\.mdx$/, "")) === slug) return content;
  }
  return null;
}

/**
 * Newer/older neighbours for the prev/next footer. `getAllPosts()` is sorted
 * newest-first, so the *next* index is the older post.
 */
export function getNeighbors(slug: string): { prev: PostMeta | null; next: PostMeta | null } {
  const all = getAllPosts();
  const i = all.findIndex((p) => p.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return { prev: all[i + 1] ?? null, next: all[i - 1] ?? null };
}
