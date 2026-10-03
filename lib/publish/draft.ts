/**
 * Draft rules shared by every agent-facing write path (the abdur-ai MCP
 * server and, later, /admin). Pure: no network, no filesystem.
 *
 * The content law this enforces (CONTENT-ROUTING-RULE.md, PROCESS.md):
 *   - new content lands in content/posts/_drafts/ — never straight into
 *     content/posts/;
 *   - images land under public/blog/<slug>/ and nowhere else;
 *   - every post declares a register, and `reported` owes receipts;
 *   - promotion to content/posts/ needs a content-publish-override entry
 *     naming a human approval, which this module formats but never invents.
 *
 * Relative imports only: this file is also loaded by the MCP server through
 * tsx, outside Next's `@/` alias.
 */
import matter from "gray-matter";
import { isRegister, REGISTERS, REGISTER_SPEC, type Register } from "../registers";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX = 80;
export const DRAFTS_DIR = "content/posts/_drafts";
export const PUBLISHED_DIR = "content/posts";
export const OVERRIDES_FILE = "docs/superpowers/specs/overrides.md";

/** Raster only. SVG served from public/ is same-origin script-capable. */
const IMAGE_RE = /^[a-z0-9][a-z0-9_-]{0,60}\.(png|jpe?g|webp|gif)$/;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type Receipt = { path: string; sha?: string; lines?: string; note?: string };

export type DraftInput = {
  slug: string;
  title: string;
  description: string;
  register: Register | string;
  body: string;
  subtitle?: string;
  date?: string;
  tags?: string[];
  receipts?: Receipt[];
  status_note?: string;
  seo_title?: string;
  tldr?: string;
  series?: string;
  related?: string[];
  /** Per-post comments opt-in, read by the community phase (AGE-2972). */
  comments?: boolean;
};

export class DraftError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Draft rejected:\n- ${problems.join("\n- ")}`);
    this.name = "DraftError";
  }
}

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export function assertSlug(slug: string): void {
  if (!SLUG_RE.test(slug) || slug.length > SLUG_MAX) {
    throw new DraftError([
      `slug "${slug}" must be lowercase letters, digits and single hyphens, at most ${SLUG_MAX} chars`,
    ]);
  }
}

/**
 * Every problem at once, so an agent fixes a draft in one round trip instead
 * of discovering rules one rejection at a time.
 */
export function validateDraft(input: DraftInput): string[] {
  const p: string[] = [];
  if (!SLUG_RE.test(input.slug ?? "") || (input.slug ?? "").length > SLUG_MAX) {
    p.push(`slug must match ${SLUG_RE} and be at most ${SLUG_MAX} chars`);
  }
  if (!nonEmpty(input.title)) p.push("title is required");
  if (!nonEmpty(input.description)) p.push("description is required (meta description / dek)");
  else if (input.description.length > 160) {
    p.push(`description is ${input.description.length} chars; keep it ≤ 160 so search does not truncate it`);
  }
  if (!isRegister(input.register)) {
    p.push(`register must be one of: ${REGISTERS.join(", ")} (see content/posts/REGISTERS.md)`);
  } else if (REGISTER_SPEC[input.register].requiresReceipts) {
    const r = input.receipts ?? [];
    if (!r.length) p.push("register `reported` claims an event happened, so it needs receipts (path + sha)");
    r.forEach((x, i) => {
      if (!nonEmpty(x?.path)) p.push(`receipts[${i}].path is required`);
    });
  }
  if (input.date !== undefined && Number.isNaN(new Date(input.date).getTime())) {
    p.push(`date "${input.date}" is not a valid ISO date`);
  }
  if (!nonEmpty(input.body)) p.push("body is required");
  else {
    // MDX ESM would execute at build time; posts never need it.
    if (/^\s*(import|export)\s/m.test(input.body)) p.push("body must not contain MDX import/export statements");
    if (/^---\s*$/m.test(input.body.split("\n")[0] ?? "")) {
      p.push("body starts with a frontmatter fence; pass metadata as fields, not inside body");
    }
  }
  for (const s of input.related ?? []) {
    if (!SLUG_RE.test(s)) p.push(`related slug "${s}" is not a valid slug`);
  }
  return p;
}

/** Frontmatter in the order existing posts use, then the body. */
export function serializeDraft(input: DraftInput, now = new Date()): string {
  const problems = validateDraft(input);
  if (problems.length) throw new DraftError(problems);
  const fm: Record<string, unknown> = {
    title: input.title.trim(),
    ...(input.subtitle ? { subtitle: input.subtitle } : {}),
    slug: input.slug,
    date: input.date ?? now.toISOString(),
    description: input.description.trim(),
    ...(input.seo_title ? { seo_title: input.seo_title } : {}),
    register: input.register,
    ...(input.status_note ? { status_note: input.status_note } : {}),
    author: "Abdur Rahman Sayeed",
    tags: input.tags ?? [],
    ...(input.tldr ? { tldr: input.tldr } : {}),
    ...(input.series ? { series: input.series } : {}),
    ...(input.related?.length ? { related: input.related } : {}),
    ...(input.comments !== undefined ? { comments: input.comments } : {}),
    ...(input.receipts?.length ? { receipts: input.receipts } : {}),
  };
  return matter.stringify(`\n${input.body.trim()}\n`, fm);
}

/** Parse an existing draft file back into editable fields (for updates). */
export function parseDraft(raw: string): DraftInput {
  const { data, content } = matter(raw);
  const date = data.date instanceof Date ? data.date.toISOString() : data.date;
  return { ...(data as Omit<DraftInput, "body">), date, body: content.trim() } as DraftInput;
}

export function draftPath(slug: string): string {
  assertSlug(slug);
  return `${DRAFTS_DIR}/${slug}.mdx`;
}

export function publishedPath(slug: string): string {
  assertSlug(slug);
  return `${PUBLISHED_DIR}/${slug}.mdx`;
}

export function imagePath(slug: string, filename: string): string {
  assertSlug(slug);
  const name = filename.toLowerCase();
  if (!IMAGE_RE.test(name)) {
    throw new DraftError([
      `image filename "${filename}" must be lowercase [a-z0-9_-], ≤ 61 chars, ending .png/.jpg/.jpeg/.webp/.gif (no SVG)`,
    ]);
  }
  return `public/blog/${slug}/${name}`;
}

/** Site path an uploaded image is served at, for use in the post body. */
export function imageUrlPath(repoPath: string): string {
  return repoPath.replace(/^public/, "");
}

/** Magic-byte check: the declared extension must match the bytes. */
export function assertImageBytes(filename: string, bytes: Uint8Array): void {
  if (bytes.byteLength > IMAGE_MAX_BYTES) {
    throw new DraftError([`image is ${bytes.byteLength} bytes; limit is ${IMAGE_MAX_BYTES}`]);
  }
  const h = (n: number) => bytes[n];
  const ext = filename.toLowerCase().split(".").pop();
  const ok =
    (ext === "png" && h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4e && h(3) === 0x47) ||
    ((ext === "jpg" || ext === "jpeg") && h(0) === 0xff && h(1) === 0xd8 && h(2) === 0xff) ||
    (ext === "gif" && h(0) === 0x47 && h(1) === 0x49 && h(2) === 0x46) ||
    (ext === "webp" && h(0) === 0x52 && h(1) === 0x49 && h(2) === 0x46 && h(3) === 0x46 &&
      h(8) === 0x57 && h(9) === 0x45 && h(10) === 0x42 && h(11) === 0x50);
  if (!ok) throw new DraftError([`image bytes do not match the .${ext} extension`]);
}

/**
 * The only paths an agent write may touch. Checked on every commit, after
 * all path construction, so a bug upstream cannot widen the blast radius.
 */
export function assertWritablePath(repoPath: string, slug: string): void {
  const allowed =
    repoPath === draftPath(slug) ||
    repoPath === publishedPath(slug) ||
    repoPath === OVERRIDES_FILE ||
    (repoPath.startsWith(`public/blog/${slug}/`) && !repoPath.slice(`public/blog/${slug}/`.length).includes("/"));
  if (!allowed || repoPath.includes("..") || repoPath.startsWith("/")) {
    throw new DraftError([`refusing to write ${repoPath}: outside the draft/asset paths for "${slug}"`]);
  }
}

/**
 * The override entry the publish gate looks for. `approvedBy` must quote a
 * real human approval (who, where, when) — this function refuses an empty
 * or placeholder value rather than letting an agent approve itself.
 */
export function publishOverrideEntry(args: {
  taskId: string;
  slug: string;
  reason: string;
  approvedBy: string;
}): string {
  const problems: string[] = [];
  if (!nonEmpty(args.taskId)) problems.push("taskId (Linear issue) is required");
  if (!nonEmpty(args.reason)) problems.push("reason is required");
  if (!nonEmpty(args.approvedBy) || args.approvedBy.trim().length < 12 || /pending|tbd|todo|self|agent/i.test(args.approvedBy)) {
    problems.push(
      "approvedBy must quote a human approval — who, where and when (e.g. 'Abdur / Slack ts … / 2026-10-03'); agents cannot approve their own publish",
    );
  }
  if (problems.length) throw new DraftError(problems);
  const one = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();
  return [
    `- task-id: ${one(args.taskId)}`,
    `  content-publish-override: ${publishedPath(args.slug)}`,
    `  reason: ${one(args.reason)}`,
    `  approved-by: ${one(args.approvedBy)}`,
    "",
  ].join("\n");
}
