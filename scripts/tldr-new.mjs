#!/usr/bin/env node
/**
 * AGE-886 — scaffold a TLDR draft. Does not publish.
 *   npm run tldr:new -- "The night the loop wrote itself"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const title = process.argv.slice(2).join(" ").trim();
if (!title) {
  console.error('Usage: npm run tldr:new -- "Title of the TLDR"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/['']/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 80);
if (!slug) {
  console.error("Could not derive a slug from that title.");
  process.exit(1);
}

const drafts = path.join(root, "content", "posts", "_drafts");
const dest = path.join(drafts, `${slug}.mdx`);
const published = path.join(root, "content", "posts", `${slug}.mdx`);
if (fs.existsSync(dest) || fs.existsSync(published)) {
  console.error(`Already exists: ${slug}`);
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const tz = -now.getTimezoneOffset();
const sign = tz >= 0 ? "+" : "-";
const offH = pad(Math.floor(Math.abs(tz) / 60));
const offM = pad(Math.abs(tz) % 60);
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00${sign}${offH}:${offM}`;

const template = fs.readFileSync(path.join(root, "content", "tldr-template.mdx"), "utf8");
const body = template
  .replaceAll("TITLE", title.replaceAll('"', '\\"'))
  .replaceAll("SLUG", slug)
  .replaceAll("DATE", date);

fs.mkdirSync(drafts, { recursive: true });
fs.writeFileSync(dest, body);
console.log(`Draft: ${path.relative(root, dest)}`);
console.log("Edit that file. When ready: npm run tldr:publish -- " + slug);
