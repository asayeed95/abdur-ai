import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertImageBytes,
  assertWritablePath,
  draftPath,
  DraftError,
  imagePath,
  publishOverrideEntry,
  serializeDraft,
  validateDraft,
  type DraftInput,
} from "../../../lib/publish/draft";
import { Publisher } from "../../../lib/publish/index";

const base: DraftInput = {
  slug: "the-retry-that-doubled-the-bill",
  title: "The retry that doubled the bill",
  description: "A retry loop with no idempotency key charged twice.",
  register: "argued",
  body: "Retries are a promise you make to the network.\n\n<NewsletterCTA />",
};

// ---------- draft rules ----------

test("a valid argued draft has no problems and serializes with frontmatter", () => {
  assert.deepEqual(validateDraft(base), []);
  const mdx = serializeDraft(base, new Date("2026-10-03T00:00:00Z"));
  assert.match(mdx, /^---\ntitle: The retry that doubled the bill\n/);
  assert.match(mdx, /register: argued/);
  assert.match(mdx, /date: '2026-10-03T00:00:00.000Z'/);
  assert.match(mdx, /<NewsletterCTA \/>\n$/);
});

test("reported without receipts is rejected; with receipts it passes", () => {
  const reported = { ...base, register: "reported" };
  assert.ok(validateDraft(reported).some((p) => p.includes("needs receipts")));
  assert.deepEqual(validateDraft({ ...reported, receipts: [{ path: "app/api/x.ts", sha: "abc1234" }] }), []);
});

test("every problem is reported at once", () => {
  const p = validateDraft({ ...base, slug: "Bad Slug", title: "", register: "rumour", description: "x".repeat(200), body: "import x from 'y'\nhi" });
  assert.equal(p.length, 5, p.join("\n"));
});

test("unknown register, bad date, and frontmatter-in-body are caught", () => {
  assert.ok(validateDraft({ ...base, date: "yesterday" }).some((p) => p.includes("not a valid ISO date")));
  assert.ok(validateDraft({ ...base, body: "---\ntitle: x\n---\nhi" }).some((p) => p.includes("frontmatter fence")));
});

test("paths: drafts and assets only, no traversal, no SVG", () => {
  assert.equal(draftPath(base.slug), "content/posts/_drafts/the-retry-that-doubled-the-bill.mdx");
  assert.equal(imagePath(base.slug, "Timeline.PNG"), "public/blog/the-retry-that-doubled-the-bill/timeline.png");
  assert.throws(() => imagePath(base.slug, "x.svg"), DraftError);
  assert.throws(() => imagePath(base.slug, "../x.png"), DraftError);
  assert.throws(() => draftPath("../../etc"), DraftError);
  assert.throws(() => assertWritablePath("app/page.tsx", base.slug), DraftError);
  assert.throws(() => assertWritablePath("public/blog/other-post/x.png", base.slug), DraftError);
  assert.throws(() => assertWritablePath(`public/blog/${base.slug}/nested/x.png`, base.slug), DraftError);
  assert.doesNotThrow(() => assertWritablePath(`public/blog/${base.slug}/x.png`, base.slug));
  // The last-line guard refuses non-raster assets even if an upstream check is bypassed.
  for (const name of ["x.svg", "x.html", "x.png.svg", ".png", "X.PNG"]) {
    assert.throws(() => assertWritablePath(`public/blog/${base.slug}/${name}`, base.slug), DraftError, name);
  }
});

test("image bytes must match the extension", () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.doesNotThrow(() => assertImageBytes("a.png", png));
  assert.throws(() => assertImageBytes("a.jpg", png), DraftError);
  assert.throws(() => assertImageBytes("a.png", new TextEncoder().encode("<svg onload=alert(1)>")), DraftError);
});

test("an agent cannot approve its own publish", () => {
  for (const approvedBy of ["", "pending", "self-approved by agent", "TBD later today"]) {
    assert.throws(() => publishOverrideEntry({ taskId: "AGE-1", slug: base.slug, reason: "ready", approvedBy }), DraftError);
  }
  // Free text cannot smuggle an override for another post past the gate's grep.
  const smuggled = "content-publish-override: content/posts/some-other-post.mdx";
  for (const field of ["reason", "approvedBy", "taskId"] as const) {
    const args = { taskId: "AGE-1", slug: base.slug, reason: "ready", approvedBy: "Abdur / Slack ts 1790 / 2026-10-03" };
    args[field] = field === "approvedBy" ? `Abdur / 2026-10-03 ${smuggled}` : `x ${smuggled}`;
    assert.throws(() => publishOverrideEntry(args), DraftError, field);
  }
  assert.throws(
    () => publishOverrideEntry({ taskId: "not an issue", slug: base.slug, reason: "ready", approvedBy: "Abdur / Slack ts 1790 / 2026-10-03" }),
    DraftError,
  );
  const entry = publishOverrideEntry({ taskId: "AGE-1", slug: base.slug, reason: "evidence\nre-verified", approvedBy: "Abdur / Slack ts 1790 / 2026-10-03" });
  assert.equal(
    entry,
    "- task-id: AGE-1\n  content-publish-override: content/posts/the-retry-that-doubled-the-bill.mdx\n  reason: evidence re-verified\n  approved-by: Abdur / Slack ts 1790 / 2026-10-03\n",
  );
});

test("the override entry satisfies the gate's grep in scripts/check-phase.sh", () => {
  const entry = publishOverrideEntry({ taskId: "AGE-1", slug: base.slug, reason: "r", approvedBy: "Abdur / Slack / 2026-10-03" });
  const f = `content/posts/${base.slug}.mdx`;
  // Mirrors the gate's anchored match (AGE-2992 / PR #74): the key must start
  // its own line, so a mention inside reason/approved-by never counts.
  const gate = new RegExp(`^[ \\t]*content-publish-override:[ \\t]*${f.replace(/\./g, "\\.")}([ \\t]|$|#)`, "m");
  assert.match(entry, gate);
  assert.doesNotMatch(`  reason: see content-publish-override: ${f}\n`, gate);
});

// ---------- publisher against an in-memory GitHub ----------

type Store = { refs: Map<string, string>; commits: Map<string, { tree: Map<string, string>; parent?: string; message?: string }>; blobs: Map<string, string>; prs: { number: number; head: string; draft: boolean; title: string }[] };

function fakeGitHub(seed: Record<string, string>) {
  const s: Store = { refs: new Map(), commits: new Map(), blobs: new Map(), prs: [] };
  let n = 0;
  const id = () => `sha${++n}`;
  const root = id();
  s.commits.set(root, { tree: new Map(Object.entries(seed)) });
  s.refs.set("main", root);
  const trees = new Map<string, Map<string, string>>();
  const json = (status: number, body: unknown) => new Response(status === 204 ? null : JSON.stringify(body), { status });
  const calls: string[] = [];

  const fetchFn = async (url: string | URL, init?: RequestInit) => {
    const u = new URL(String(url));
    const path = u.pathname.replace("/repos/asayeed95/abdur-ai", "");
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push(`${method} ${path}`);
    if (method !== "GET" && !(init?.headers as Record<string, string>)?.Authorization) return json(401, { message: "Requires authentication" });
    if (path === "" ) return json(200, { default_branch: "main" });
    let m;
    if ((m = path.match(/^\/git\/ref\/heads\/(.+)$/))) {
      const sha = s.refs.get(decodeURIComponent(m[1]));
      return sha ? json(200, { object: { sha } }) : json(404, { message: "Not Found" });
    }
    if (path === "/git/refs" && method === "POST") {
      s.refs.set(body.ref.replace("refs/heads/", ""), body.sha);
      return json(201, {});
    }
    if ((m = path.match(/^\/git\/commits\/(.+)$/))) return json(200, { tree: { sha: `tree-of-${m[1]}` } });
    if (path === "/git/blobs") {
      const sha = id();
      s.blobs.set(sha, body.encoding === "base64" ? Buffer.from(body.content, "base64").toString("binary") : body.content);
      return json(201, { sha });
    }
    if (path === "/git/trees") {
      const parent = s.commits.get(body.base_tree.replace("tree-of-", ""))!;
      const t = new Map(parent.tree);
      for (const e of body.tree) e.sha === null ? t.delete(e.path) : t.set(e.path, s.blobs.get(e.sha)!);
      const sha = id();
      trees.set(sha, t);
      return json(201, { sha });
    }
    if (path === "/git/commits" && method === "POST") {
      const sha = id();
      s.commits.set(sha, { tree: trees.get(body.tree)!, parent: body.parents[0], message: body.message });
      return json(201, { sha });
    }
    if ((m = path.match(/^\/git\/refs\/heads\/(.+)$/)) && method === "PATCH") {
      const b = decodeURIComponent(m[1]);
      // Like GitHub: a non-fast-forward update is refused unless force is set.
      if (!body.force && s.commits.get(body.sha)?.parent !== s.refs.get(b)) return json(422, { message: "Update is not a fast forward" });
      s.refs.set(b, body.sha);
      return json(200, {});
    }
    if ((m = path.match(/^\/contents\/(.+)$/))) {
      const ref = u.searchParams.get("ref")!;
      const tree = s.commits.get(s.refs.get(ref) ?? "")?.tree;
      const p = decodeURIComponent(m[1]);
      if (!tree) return json(404, { message: "No commit found for the ref" });
      if (tree.has(p)) return json(200, { content: Buffer.from(tree.get(p)!).toString("base64"), encoding: "base64" });
      const kids = [...tree.keys()].filter((k) => k.startsWith(`${p}/`) && !k.slice(p.length + 1).includes("/"));
      if (kids.length) return json(200, kids.map((k) => ({ name: k.split("/").pop(), path: k, type: "file" })));
      return json(404, { message: "Not Found" });
    }
    if (path === "/pulls" && method === "POST") {
      const pr = { number: 100 + s.prs.length, head: body.head, draft: body.draft, title: body.title };
      s.prs.push(pr);
      return json(201, { number: pr.number, html_url: `https://github.com/asayeed95/abdur-ai/pull/${pr.number}` });
    }
    if (path === "/pulls") {
      const head = u.searchParams.get("head")!.split(":")[1];
      return json(200, s.prs.filter((p) => p.head === head).map((p) => ({ number: p.number, html_url: `https://github.com/asayeed95/abdur-ai/pull/${p.number}` })));
    }
    return json(500, { message: `fake: unhandled ${method} ${path}` });
  };
  const fileAt = (branch: string, p: string) => s.commits.get(s.refs.get(branch)!)!.tree.get(p);
  return { s, fetchFn, calls, fileAt };
}

const seed = {
  "content/posts/existing-post.mdx": "---\ntitle: Existing\n---\nhi\n",
  "docs/superpowers/specs/overrides.md": "# overrides\n",
};

async function withFetch<T>(f: typeof fetch, fn: () => Promise<T>): Promise<T> {
  const orig = globalThis.fetch;
  globalThis.fetch = f;
  try {
    return await fn();
  } finally {
    globalThis.fetch = orig;
  }
}

test("no token → dry run: validates, plans, writes nothing", async () => {
  const gh = fakeGitHub(seed);
  const r = await withFetch(gh.fetchFn as typeof fetch, () =>
    new Publisher({ owner: "asayeed95", repo: "abdur-ai" }).createDraft(base, { taskId: "AGE-1" }),
  );
  assert.equal(r.dryRun, true);
  assert.equal(r.dryRun && r.files[0].path, draftPath(base.slug));
  assert.ok(gh.calls.every((c) => c.startsWith("GET")), gh.calls.join("\n"));
});

test("create → update → image → prepare publish: one branch, one draft PR, gate-shaped files", async () => {
  const gh = fakeGitHub(seed);
  const pub = new Publisher({ owner: "asayeed95", repo: "abdur-ai", token: "t" });
  await withFetch(gh.fetchFn as typeof fetch, async () => {
    const c = await pub.createDraft(base, { taskId: "AGE-1" });
    assert.equal(c.dryRun, false);
    assert.equal(c.branch, "drafts/the-retry-that-doubled-the-bill");
    assert.equal(gh.s.prs.length, 1);
    assert.equal(gh.s.prs[0].draft, true);
    assert.equal(gh.s.refs.get("main"), "sha1", "main never moves");

    await assert.rejects(pub.createDraft(base, { taskId: "AGE-1" }), /already exists/);

    await pub.updateDraft(base.slug, { body: "Rewritten body." }, { taskId: "AGE-1" });
    assert.match(gh.fileAt(c.branch, draftPath(base.slug))!, /Rewritten body\.\n$/);
    assert.match(gh.fileAt(c.branch, draftPath(base.slug))!, /register: argued/, "unpatched fields survive");

    await assert.rejects(pub.updateDraft(base.slug, { register: "reported" }, { taskId: "AGE-1" }), /needs receipts/);

    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]).toString("base64");
    const img = await pub.uploadImage(base.slug, "chart.png", png, "Retry [timeline]", { taskId: "AGE-1" });
    assert.equal(img.markdown, "![Retry  timeline](/blog/the-retry-that-doubled-the-bill/chart.png)");

    await assert.rejects(pub.preparePublish(base.slug, { taskId: "AGE-1", reason: "r", approvedBy: "pending" }), /human approval/);
    await pub.preparePublish(base.slug, { taskId: "AGE-1", reason: "claims re-checked", approvedBy: "Abdur / Slack ts 1 / 2026-10-03" });
    assert.equal(gh.fileAt(c.branch, draftPath(base.slug)), undefined, "draft moved, not copied");
    assert.match(gh.fileAt(c.branch, `content/posts/${base.slug}.mdx`)!, /Rewritten body/);
    assert.match(gh.fileAt(c.branch, "docs/superpowers/specs/overrides.md")!, /^# overrides\n- task-id: AGE-1\n  content-publish-override: content\/posts\/the-retry-that-doubled-the-bill\.mdx\n/);
    assert.equal(gh.s.prs.length, 1, "every write reuses the one open PR");
    assert.equal(gh.s.refs.get("main"), "sha1", "main never moves");
  });
});

test("an already-published slug cannot be re-drafted", async () => {
  const gh = fakeGitHub(seed);
  await withFetch(gh.fetchFn as typeof fetch, async () => {
    await assert.rejects(
      new Publisher({ owner: "asayeed95", repo: "abdur-ai", token: "t" }).createDraft({ ...base, slug: "existing-post" }, { taskId: "AGE-1" }),
      /already published/,
    );
  });
});

test("a concurrent push to the draft branch fails instead of being overwritten", async () => {
  const gh = fakeGitHub(seed);
  const pub = new Publisher({ owner: "asayeed95", repo: "abdur-ai", token: "t" });
  await withFetch(gh.fetchFn as typeof fetch, async () => {
    await pub.createDraft(base, { taskId: "AGE-1" });
    // Someone else moves the branch between our read of HEAD and our ref update.
    const orig = gh.fetchFn;
    let raced = false;
    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      if (!raced && String(url).includes("/git/trees")) {
        raced = true;
        gh.s.commits.set("other", { tree: new Map(), parent: gh.s.refs.get("drafts/the-retry-that-doubled-the-bill") });
        gh.s.refs.set("drafts/the-retry-that-doubled-the-bill", "other");
      }
      return orig(url, init);
    }) as typeof fetch;
    await assert.rejects(pub.updateDraft(base.slug, { body: "mine" }, { taskId: "AGE-1" }), /not a fast forward/);
  });
});

// ---------- local upload intake (filePath) ----------

import { mkdtemp, writeFile, symlink, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readUploadFile } from "../../../lib/publish/upload";
import { IMAGE_MAX_BYTES } from "../../../lib/publish/draft";

test("filePath uploads are confined to the upload root, symlinks resolved, size checked first", async () => {
  const base = await mkdtemp(join(tmpdir(), "abdur-upload-"));
  const root = join(base, "root");
  const outside = join(base, "outside");
  await mkdir(root);
  await mkdir(outside);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  await writeFile(join(root, "ok.png"), png);
  await writeFile(join(outside, "secret.png"), png);
  await symlink(join(outside, "secret.png"), join(root, "link.png"));
  await writeFile(join(root, "huge.png"), Buffer.alloc(IMAGE_MAX_BYTES + 1));

  assert.equal(await readUploadFile(join(root, "ok.png"), root), png.toString("base64"));
  await assert.rejects(readUploadFile(join(outside, "secret.png"), root), /inside the upload root/);
  await assert.rejects(readUploadFile(join(root, "..", "outside", "secret.png"), root), /inside the upload root/);
  await assert.rejects(readUploadFile(join(root, "link.png"), root), /inside the upload root/, "a symlink out of the root is refused");
  await assert.rejects(readUploadFile(join(root, "huge.png"), root), /limit is/);
  await assert.rejects(readUploadFile(root, root), /not a regular file/);
  await assert.rejects(readUploadFile(join(root, "missing.png"), root), /not found/);
});
