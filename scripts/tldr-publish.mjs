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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = (process.argv[2] || "").replace(/\.mdx?$/, "").trim();
if (!slug) {
  console.error("Usage: npm run tldr:publish -- <slug>");
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
const fm = raw.match(/^---\n([\s\S]*?)\n---/);
if (!fm) {
  console.error("Draft needs YAML frontmatter (--- ... ---).");
  process.exit(1);
}
const need = ["title:", "date:"];
for (const k of need) {
  if (!fm[1].includes(k)) {
    console.error(`Frontmatter missing ${k}`);
    process.exit(1);
  }
}
if (!fm[1].includes("description:") && !fm[1].includes("dek:")) {
  console.error("Frontmatter needs description: or dek:");
  process.exit(1);
}
if (raw.includes("TITLE") || raw.includes("\nslug: SLUG")) {
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

fs.copyFileSync(src, dest);
console.log(`Published file: content/posts/${slug}.mdx`);
console.log("Live URL after deploy: https://abdur.ai/aitldr/" + slug);
console.log("Next (you): git add content/posts/" + slug + ".mdx && commit && push.");
console.log("Draft left in _drafts/ — delete after the deploy looks right.");
