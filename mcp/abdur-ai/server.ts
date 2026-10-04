#!/usr/bin/env -S npx tsx
/**
 * abdur-ai MCP server (stdio). Lets Claude Code — or any MCP client — draft,
 * revise, illustrate and prepare abdur.ai posts. Every write is a commit on a
 * `drafts/<slug>` branch with a draft PR; nothing here can push to main or
 * publish without a human-quoted approval. See README.md.
 *
 * Env: ABDUR_PUBLISH_GITHUB_TOKEN (optional — without it writes are dry
 * runs), ABDUR_PUBLISH_REPO (default asayeed95/abdur-ai),
 * ABDUR_PUBLISH_UPLOAD_DIR (the only directory filePath uploads may read
 * from; default the working directory).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { configFromEnv, DraftError, Publisher, validateDraft, type DraftInput } from "../../lib/publish/index";
import { readUploadFile } from "../../lib/publish/upload";
import { REGISTERS } from "../../lib/registers";

const publisher = new Publisher(configFromEnv());
const server = new McpServer({ name: "abdur-ai", version: "0.1.0" });

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const fail = (e: unknown) => ({
  isError: true,
  content: [
    {
      type: "text" as const,
      text: e instanceof DraftError ? e.message : `Error: ${e instanceof Error ? e.message : String(e)}`,
    },
  ],
});
const run = <A,>(fn: (a: A) => Promise<unknown>) => async (a: A) => {
  try {
    return ok(await fn(a));
  } catch (e) {
    return fail(e);
  }
};

const taskId = z.string().regex(/^[A-Z]+-\d+$/, "a Linear issue id like AGE-1234").describe("Linear issue this work belongs to (Linear-first rule)");
const slug = z.string().describe("lowercase-hyphenated post slug, e.g. the-retry-that-doubled-the-bill");
const receipts = z
  .array(z.object({ path: z.string(), sha: z.string().optional(), lines: z.string().optional(), note: z.string().optional() }))
  .optional()
  .describe("Evidence for `reported` posts: repo path + commit sha (+ line range / note)");
const draftFields = {
  slug,
  title: z.string(),
  description: z.string().describe("≤160-char meta description / dek"),
  register: z.enum(REGISTERS).describe("reported = this happened (needs receipts) · designed = how I would build it · argued = what I think is true"),
  body: z.string().describe("MDX body without frontmatter. Components available: <NewsletterCTA />, <ReceiptsBlock />, <PatternsBlock />"),
  subtitle: z.string().optional(),
  date: z.string().optional().describe("ISO date; defaults to now"),
  tags: z.array(z.string()).optional(),
  receipts,
  status_note: z.string().optional(),
  seo_title: z.string().optional(),
  tldr: z.string().optional(),
  series: z.string().optional(),
  related: z.array(z.string()).optional(),
  comments: z.boolean().optional().describe("Opt this post into reader comments (off by default)"),
};

server.registerTool(
  "abdur_list_posts",
  {
    title: "List posts",
    description: "Published slugs and draft slugs on the default branch (or a given ref).",
    inputSchema: { ref: z.string().optional() },
    annotations: { readOnlyHint: true },
  },
  run(({ ref }: { ref?: string }) => publisher.listPosts(ref)),
);

server.registerTool(
  "abdur_get_post",
  {
    title: "Get post source",
    description: "Raw MDX (frontmatter + body) for a slug: its draft branch first, then main's draft, then the published file.",
    inputSchema: { slug },
    annotations: { readOnlyHint: true },
  },
  run(async ({ slug }: { slug: string }) => (await publisher.getPost(slug)) ?? { found: false, slug }),
);

server.registerTool(
  "abdur_validate_draft",
  {
    title: "Validate a draft",
    description: "Check a draft against the site's content law (register, receipts, slug, description length, no MDX import/export) without writing anything.",
    inputSchema: draftFields,
    annotations: { readOnlyHint: true },
  },
  run(async (input: DraftInput) => {
    const problems = validateDraft(input);
    return { valid: problems.length === 0, problems };
  }),
);

server.registerTool(
  "abdur_create_draft",
  {
    title: "Create a draft post",
    description:
      "Write content/posts/_drafts/<slug>.mdx on a new drafts/<slug> branch and open a draft PR. Never publishes. Without a GitHub token, returns a dry-run plan.",
    inputSchema: { ...draftFields, taskId },
  },
  run(({ taskId, ...input }: DraftInput & { taskId: string }) => publisher.createDraft(input, { taskId })),
);

server.registerTool(
  "abdur_update_draft",
  {
    title: "Update a draft post",
    description: "Patch any draft fields (body, title, receipts, …) on drafts/<slug>; the whole draft is re-validated and committed.",
    inputSchema: {
      slug,
      taskId,
      message: z.string().optional().describe("commit message"),
      patch: z.object(draftFields).omit({ slug: true }).partial().describe("only the fields to change"),
    },
  },
  run(({ slug, taskId, message, patch }: { slug: string; taskId: string; message?: string; patch: Partial<DraftInput> }) =>
    publisher.updateDraft(slug, patch, { taskId, message }),
  ),
);

server.registerTool(
  "abdur_upload_image",
  {
    title: "Upload an image for a post",
    description:
      "Commit a PNG/JPEG/WebP/GIF (≤5 MB, no SVG) to public/blog/<slug>/ on the draft branch. Returns the markdown to paste into the body. Pass either base64 or a local file path.",
    inputSchema: {
      slug,
      taskId,
      filename: z.string().describe("e.g. retry-timeline.png"),
      alt: z.string().describe("alt text describing the image for screen readers"),
      base64: z.string().optional(),
      filePath: z
        .string()
        .optional()
        .describe("local image path inside the upload root (ABDUR_PUBLISH_UPLOAD_DIR, default the working directory)"),
    },
  },
  run(async (a: { slug: string; taskId: string; filename: string; alt: string; base64?: string; filePath?: string }) => {
    // filePath reads are confined to the upload root and size-checked before
    // reading: the repo is public, so an upload is a publication.
    const b64 = a.base64 ?? (a.filePath ? await readUploadFile(a.filePath) : undefined);
    if (!b64) throw new DraftError(["pass base64 or filePath"]);
    return publisher.uploadImage(a.slug, a.filename, b64, a.alt, { taskId: a.taskId });
  }),
);

server.registerTool(
  "abdur_prepare_publish",
  {
    title: "Prepare a draft for publishing",
    description:
      "On drafts/<slug>: move the draft to content/posts/ and append a content-publish-override entry. approvedBy MUST quote a real human approval (who / where / when). Merging the PR is what publishes.",
    inputSchema: {
      slug,
      taskId,
      reason: z.string().describe("why this is ready: evidence re-verified, claims checked"),
      approvedBy: z.string().describe("quoted human approval, e.g. 'Abdur / Slack ts 1790… (\"ship it\") / 2026-10-03'"),
    },
    annotations: { destructiveHint: false },
  },
  run(({ slug, ...args }: { slug: string; taskId: string; reason: string; approvedBy: string }) => publisher.preparePublish(slug, args)),
);

await server.connect(new StdioServerTransport());
console.error(`abdur-ai MCP ready (${publisher.canWrite ? "write" : "dry-run: no ABDUR_PUBLISH_GITHUB_TOKEN"})`);
