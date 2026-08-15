#!/usr/bin/env node
/**
 * AGE-886 — promote a draft to a live post file. Does not deploy.
 *   npm run tldr:publish -- the-slug
 *
 * After this: commit, push, Vercel deploys. Human-only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import matter from "gray-matter";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = (process.argv[2] || "").replace(/\.mdx?$/, "").trim();
if (!slug) {
  console.error("Usage: npm run tldr:publish -- <slug>");
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Slug must contain lowercase letters, numbers, and single hyphens only.");
  process.exit(1);
}

const drafts = path.join(root, "content", "posts", "_drafts");
const publishedDir = path.join(root, "content", "posts");
const src =
  [".mdx", ".md"]
    .map((ext) => path.join(drafts, slug + ext))
    .find((p) => fs.existsSync(p)) || null;
if (!src) {
  console.error(`No draft at content/posts/_drafts/${slug}.mdx`);
  process.exit(1);
}

const dest = path.join(publishedDir, `${slug}.mdx`);
if (fs.existsSync(dest) || fs.existsSync(path.join(publishedDir, `${slug}.md`))) {
  console.error(`Already published: content/posts/${slug}.mdx`);
  process.exit(1);
}

const raw = fs.readFileSync(src, "utf8");
let data;
try {
  data = matter(raw).data;
} catch {
  console.error("Draft needs YAML frontmatter (--- ... ---).");
  process.exit(1);
}
const hasText = (value) => typeof value === "string" && value.trim().length > 0;
if (!hasText(data.title)) {
  console.error("Frontmatter needs a non-empty title.");
  process.exit(1);
}
if (!data.date || Number.isNaN(new Date(data.date).getTime())) {
  console.error("Frontmatter needs a valid date.");
  process.exit(1);
}
if (!hasText(data.description) && !hasText(data.dek)) {
  console.error("Frontmatter needs a non-empty description or dek.");
  process.exit(1);
}
if (data.slug && data.slug !== slug) {
  console.error(`Frontmatter slug must match the filename: ${slug}`);
  process.exit(1);
}
if (data.title === "TITLE" || data.slug === "SLUG") {
  console.error("Draft still has template placeholders. Edit before publish.");
  process.exit(1);
}

const claims = path.join(root, "scripts", "check-public-claims.py");
if (fs.existsSync(claims)) {
  const r = spawnSync("python3", [claims], { cwd: root, encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stdout || r.stderr || "claims check failed");
    process.exit(1);
  }
}

fs.renameSync(src, dest);
console.log(`Published file: content/posts/${slug}.mdx`);
console.log("Live URL after deploy: https://abdur.ai/aitldr/" + slug);
console.log("Next (you): git add content/posts/" + slug + ".mdx && commit && push.");
