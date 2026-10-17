import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { LibraryId } from "./library";

/**
 * Library asset bodies live in content/library/<id>.md: plain GitHub-flavored
 * Markdown (not MDX), so the same file is rendered on the site and offered as
 * the editable download. Everything above the `<!-- preview-end -->` line is
 * the public preview on the asset's page.
 */
const LIBRARY_DIR = path.join(process.cwd(), "content/library");
const PREVIEW_MARKER = "<!-- preview-end -->";

export type LibrarySource = {
  sources: { slug: string; title: string }[];
  version?: string;
  updated?: string;
  /** The whole file, frontmatter included: what the download serves. */
  raw: string;
  /** Body without frontmatter, preview marker removed. */
  body: string;
  /** Body up to the preview marker (the whole body if there is none). */
  preview: string;
};

export function getLibrarySource(id: LibraryId): LibrarySource | null {
  let raw: string;
  try {
    raw = fs.readFileSync(path.join(LIBRARY_DIR, `${id}.md`), "utf8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  const cut = content.indexOf(PREVIEW_MARKER);
  return {
    sources: Array.isArray(data.sources) ? data.sources : [],
    version: typeof data.version === "string" ? data.version : undefined,
    updated: typeof data.updated === "string" ? data.updated : undefined,
    raw,
    body: content.replace(PREVIEW_MARKER, ""),
    preview: cut === -1 ? content : content.slice(0, cut),
  };
}
