import { SITE } from "./site";

/**
 * The free library (AGE-2990 / AGE-3762): lead magnets delivered by email.
 *
 * This registry is the allowlist. An asset id that is not here does not
 * exist, and every link an email carries is built from SITE.url plus a
 * registry id — never from anything the request sent.
 *
 * Status:
 *  - planned:   named in the plan, no content yet. Never shown, never sent.
 *  - draft:     content exists in content/library/<id>.md but the founder
 *               has not approved it. Hidden in production. LIBRARY_PREVIEW=1
 *               shows and sends it on a local or preview build (the journey
 *               test uses this); the flag is ignored when
 *               VERCEL_ENV=production, so a stray env var cannot publish it.
 *  - available: approved. Shown, sent, listed in the sitemap.
 *
 * Moving an asset to `available` is a publishing act: it needs the same
 * founder approval as a post.
 */

export const LIBRARY_IDS = ["evidence-os-v1", "mistakes-playbook-v1", "mcp-publishing-kit-v1"] as const;
export type LibraryId = (typeof LIBRARY_IDS)[number];
export type LibraryStatus = "planned" | "draft" | "available";

export type LibraryAsset = {
  id: LibraryId;
  title: string;
  /** One sentence for the index card and the meta description. */
  summary: string;
  /** What the reader gets, shown above the request form. */
  inside: string[];
  /** The request button's label. */
  cta: string;
  status: LibraryStatus;
};

export const LIBRARY: readonly LibraryAsset[] = [
  {
    id: "evidence-os-v1",
    title: "Evidence Before Shipping",
    summary:
      "A workbook for saying “done” only when you can show it: claim, boundary, oracle, receipt, with three worked examples from the logbook.",
    inside: [
      "The claim → boundary → oracle → receipt loop, one page",
      "A worksheet to copy for every change",
      "Three worked examples, each sourced to a published postmortem",
      "Blank evidence cards, a failure-injection checklist and rollback prompts",
    ],
    cta: "Email me the editable evidence workbook",
    status: "draft",
  },
  {
    id: "mistakes-playbook-v1",
    title: "The Mistakes Playbook",
    summary: "The patterns behind the Mistakes TLDR series, as a checklist.",
    inside: [],
    cta: "Email me the playbook",
    status: "planned",
  },
  {
    id: "mcp-publishing-kit-v1",
    title: "MCP Publishing Kit",
    summary: "How this site takes a draft from any agent to a reviewed pull request.",
    inside: [],
    cta: "Email me the kit",
    status: "planned",
  },
];

/** Drafts are visible only on a non-production build that opts in. */
export function previewEnabled(): boolean {
  return process.env.LIBRARY_PREVIEW === "1" && process.env.VERCEL_ENV !== "production";
}

/** Shown on the site and deliverable by email right now. */
export function isVisible(asset: LibraryAsset): boolean {
  return asset.status === "available" || (asset.status === "draft" && previewEnabled());
}

export function getAsset(id: string): LibraryAsset | undefined {
  return LIBRARY.find((a) => a.id === id);
}

export function getVisibleAssets(): LibraryAsset[] {
  return LIBRARY.filter(isVisible);
}

export function libraryPath(id: LibraryId): string {
  return `/library/${id}`;
}

/** The links a delivery email carries. Absolute, built only from SITE.url and the registry id. */
export function deliveryLinks(id: LibraryId): { read: string; download: string } {
  return {
    read: `${SITE.url}${libraryPath(id)}/read`,
    download: `${SITE.url}${libraryPath(id)}/workbook.md`,
  };
}
