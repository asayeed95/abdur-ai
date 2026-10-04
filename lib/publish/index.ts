/**
 * Publish core: the one write path from an agent (or /admin) into the site.
 *
 * Every write is a commit on a `drafts/<slug>` branch plus a draft PR — never
 * a push to main. Publishing stays a reviewed merge with a human-quoted
 * content-publish-override entry, so the register/claims/receipts gates in
 * CI run on agent-written posts exactly as on hand-written ones.
 *
 * Without ABDUR_PUBLISH_GITHUB_TOKEN every write returns a dry-run plan
 * instead of failing, so an agent can validate a draft end to end with no
 * credential at all.
 */
import {
  assertImageBytes,
  assertWritablePath,
  draftPath,
  DraftError,
  DRAFTS_DIR,
  imagePath,
  imageUrlPath,
  OVERRIDES_FILE,
  parseDraft,
  publishedPath,
  publishOverrideEntry,
  PUBLISHED_DIR,
  serializeDraft,
  validateDraft,
  type DraftInput,
} from "./draft";
import { GitHub, type FileWrite } from "./github";

export { DraftError, validateDraft, type DraftInput } from "./draft";

export type PublishConfig = { owner: string; repo: string; token?: string };

/** Repo + token from ABDUR_PUBLISH_REPO / ABDUR_PUBLISH_GITHUB_TOKEN. */
export function configFromEnv(env: Record<string, string | undefined> = process.env): PublishConfig {
  const [owner, repo] = (env.ABDUR_PUBLISH_REPO || "asayeed95/abdur-ai").split("/");
  return { owner, repo, token: env.ABDUR_PUBLISH_GITHUB_TOKEN || undefined };
}

export type WriteResult =
  | { dryRun: true; branch: string; files: { path: string; bytes: number; preview?: string }[]; note: string }
  | { dryRun: false; branch: string; commit: string; pr: { number: number; url: string } };

export const branchFor = (slug: string) => `drafts/${slug}`;

/** The agent/admin write path: drafts/<slug> branch commits + one draft PR per slug. */
export class Publisher {
  private gh: GitHub;
  constructor(private readonly cfg: PublishConfig) {
    this.gh = new GitHub({ owner: cfg.owner, repo: cfg.repo }, cfg.token);
  }

  /** False means every write returns a dry-run plan instead of committing. */
  get canWrite() {
    return this.gh.canWrite;
  }

  /** Published posts and drafts on `ref` (default branch when omitted). */
  async listPosts(ref?: string) {
    const at = ref ?? (await this.gh.defaultBranch());
    const [pub, drafts] = await Promise.all([this.gh.listDir(PUBLISHED_DIR, at), this.gh.listDir(DRAFTS_DIR, at)]);
    const slugs = (xs: { name: string; type: string }[]) =>
      xs.filter((x) => x.type === "file" && /\.mdx?$/.test(x.name) && !/^[A-Z_]/.test(x.name)).map((x) => x.name.replace(/\.mdx?$/, ""));
    return { ref: at, published: slugs(pub), drafts: slugs(drafts) };
  }

  /** Raw MDX for a slug: the draft branch first, then main's draft, then main's published file. */
  async getPost(slug: string) {
    const main = await this.gh.defaultBranch();
    const branch = branchFor(slug);
    const candidates: [string, string][] = [
      [draftPath(slug), branch],
      [draftPath(slug), main],
      [publishedPath(slug), main],
    ];
    for (const [path, ref] of candidates) {
      const raw = await this.gh.readFile(path, ref).catch(() => null);
      if (raw !== null) return { path, ref, raw };
    }
    return null;
  }

  /** Path-check, then commit on drafts/<slug> and reuse or open its draft PR (or plan, without a token). */
  private async write(slug: string, message: string, files: FileWrite[], pr: { title: string; body: string }): Promise<WriteResult> {
    for (const f of files) assertWritablePath(f.path, slug);
    const branch = branchFor(slug);
    if (!this.gh.canWrite) {
      return {
        dryRun: true,
        branch,
        files: files.map((f) =>
          "delete" in f
            ? { path: f.path, bytes: 0, preview: "(delete)" }
            : { path: f.path, bytes: f.content.length, preview: f.encoding === "base64" ? undefined : f.content.slice(0, 400) },
        ),
        note:
          "Dry run: validation passed; nothing was written. Set ABDUR_PUBLISH_GITHUB_TOKEN (fine-grained, contents + pull requests RW on this repo only) to commit and open the PR.",
      };
    }
    const main = await this.gh.defaultBranch();
    if (!(await this.gh.branchSha(branch))) {
      const base = await this.gh.branchSha(main);
      if (!base) throw new Error(`default branch ${main} not found`);
      await this.gh.createBranch(branch, base);
    }
    const commit = await this.gh.commit(branch, message, files);
    const existing = await this.gh.findOpenPr(branch);
    const prRef = existing ?? (await this.gh.openDraftPr({ head: branch, base: main, ...pr }));
    return { dryRun: false, branch, commit, pr: prRef };
  }

  /** New draft on a new drafts/<slug> branch; refuses published slugs and existing branches. */
  async createDraft(input: DraftInput, meta: { taskId: string }): Promise<WriteResult> {
    const problems = validateDraft(input);
    if (!meta.taskId?.trim()) problems.push("taskId (Linear issue, e.g. AGE-1234) is required — Linear-first rule");
    if (problems.length) throw new DraftError(problems);
    let published: boolean | "unknown" = "unknown";
    try {
      published = (await this.gh.readFile(publishedPath(input.slug), await this.gh.defaultBranch())) !== null;
    } catch (e) {
      // Dry runs must still work with no token on a shared IP that has spent
      // GitHub's 60/h anonymous budget; a real write re-checks with the token.
      if (this.gh.canWrite) throw e;
    }
    if (published === true) {
      throw new DraftError([`"${input.slug}" is already published; pick a new slug or edit the post by hand`]);
    }
    if (this.gh.canWrite && (await this.gh.branchSha(branchFor(input.slug)))) {
      throw new DraftError([`branch ${branchFor(input.slug)} already exists; use update_draft to change it`]);
    }
    const mdx = serializeDraft(input);
    return this.write(input.slug, `content(draft): ${input.title} (${meta.taskId})`, [{ path: draftPath(input.slug), content: mdx }], {
      title: `content(draft): ${input.title} (${meta.taskId})`,
      body: prBody(input, meta.taskId),
    });
  }

  /** Merge `patch` into the draft on its branch and re-validate the whole draft. */
  async updateDraft(slug: string, patch: Partial<DraftInput>, meta: { taskId: string; message?: string }): Promise<WriteResult> {
    const branch = branchFor(slug);
    const raw = (await this.gh.readFile(draftPath(slug), branch)) ?? (await this.gh.readFile(draftPath(slug), await this.gh.defaultBranch()));
    if (raw === null) throw new DraftError([`no draft for "${slug}" on ${branch} or the default branch; create it first`]);
    const current = parseDraft(raw);
    const next: DraftInput = { ...current, ...patch, slug };
    const mdx = serializeDraft(next);
    return this.write(slug, meta.message ?? `content(draft): update ${slug} (${meta.taskId})`, [{ path: draftPath(slug), content: mdx }], {
      title: `content(draft): ${next.title} (${meta.taskId})`,
      body: prBody(next, meta.taskId),
    });
  }

  /** Commit a raster image under public/blog/<slug>/ and return the markdown that embeds it. */
  async uploadImage(slug: string, filename: string, base64: string, alt: string, meta: { taskId: string }) {
    const path = imagePath(slug, filename);
    const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
    assertImageBytes(filename, bytes);
    const result = await this.write(slug, `content(asset): ${path} (${meta.taskId})`, [{ path, content: base64, encoding: "base64" }], {
      title: `content(draft): assets for ${slug} (${meta.taskId})`,
      body: `Image upload for \`${slug}\`. Linear: ${meta.taskId}`,
    });
    const safeAlt = alt.replace(/[[\]\n]/g, " ").trim();
    return { ...result, markdown: `![${safeAlt}](${imageUrlPath(path)})` };
  }

  /**
   * Move the draft to content/posts/ and append the override entry, on the
   * draft branch. Merging the PR is what publishes; that stays with a human
   * or an agent acting under a quoted standing approval.
   */
  async preparePublish(slug: string, args: { taskId: string; reason: string; approvedBy: string }): Promise<WriteResult> {
    const entry = publishOverrideEntry({ slug, ...args });
    const branch = branchFor(slug);
    const main = await this.gh.defaultBranch();
    const onBranch = this.gh.canWrite ? await this.gh.branchSha(branch) : null;
    const ref = onBranch ? branch : main;
    const raw = await this.gh.readFile(draftPath(slug), ref);
    if (raw === null) throw new DraftError([`no draft for "${slug}" on ${ref}`]);
    const draft = parseDraft(raw);
    const problems = validateDraft(draft);
    if (problems.length) throw new DraftError(problems);
    const overrides = (await this.gh.readFile(OVERRIDES_FILE, ref)) ?? "";
    if (overrides.includes(`content-publish-override: ${publishedPath(slug)}`)) {
      throw new DraftError([`an override entry for ${publishedPath(slug)} already exists`]);
    }
    return this.write(
      slug,
      `content: publish ${slug} (${args.taskId})`,
      [
        { path: draftPath(slug), delete: true },
        { path: publishedPath(slug), content: raw },
        { path: OVERRIDES_FILE, content: `${overrides.replace(/\n*$/, "\n")}${entry}` },
      ],
      { title: `content: publish "${draft.title}" (${args.taskId})`, body: prBody(draft, args.taskId) },
    );
  }
}

/** Draft PR description: what the post claims and how it becomes public. */
function prBody(d: DraftInput, taskId: string): string {
  return `Opened by the abdur-ai publish core (MCP / admin). Linear: ${taskId}

**${d.title}** — register \`${d.register}\`
${d.description}

Publishing is this PR's merge. A draft only moves to \`content/posts/\` through \`prepare_publish\`, which writes a \`content-publish-override:\` entry quoting the human approval.

\`\`\`
Task-id: ${taskId}
Checklist:
- [ ] check-phase.sh --hard passes (CI Quality gate)
- [ ] Register matches the evidence; reported posts carry receipts
- [ ] No unratified price / benchmark / customer / integration claims
\`\`\``;
}
