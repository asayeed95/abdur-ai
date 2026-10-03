/**
 * Minimal GitHub REST client for the publish core. fetch only — no SDK — so
 * it runs the same in a Next server action, a Vercel function and the MCP
 * server under tsx.
 *
 * Writes go through the git data API (blobs → tree → commit → ref), so a
 * draft plus its images land as ONE commit or not at all.
 */

export type RepoRef = { owner: string; repo: string };
export type FileWrite =
  | { path: string; content: string; encoding?: "utf-8" }
  | { path: string; content: string; encoding: "base64" }
  /** Remove the file in the same commit (used to move a draft on publish). */
  | { path: string; delete: true };

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export class GitHub {
  constructor(
    private readonly repoRef: RepoRef,
    private readonly token: string | undefined,
    private readonly api = "https://api.github.com",
  ) {}

  get canWrite(): boolean {
    return Boolean(this.token);
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.api}/repos/${this.repoRef.owner}/${this.repoRef.repo}${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "abdur-ai-publish",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      // GitHub error bodies carry a message, never the token; safe to surface.
      const text = await res.text().catch(() => "");
      let msg = text;
      try {
        msg = (JSON.parse(text) as { message?: string }).message ?? text;
      } catch {
        /* keep raw text */
      }
      throw new GitHubError(`GitHub ${method} ${path} → ${res.status}: ${msg.slice(0, 300)}`, res.status);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  async defaultBranch(): Promise<string> {
    const r = await this.call<{ default_branch: string }>("GET", "");
    return r.default_branch;
  }

  async branchSha(branch: string): Promise<string | null> {
    try {
      const r = await this.call<{ object: { sha: string } }>("GET", `/git/ref/heads/${encodeURIComponent(branch)}`);
      return r.object.sha;
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) return null;
      throw e;
    }
  }

  async createBranch(branch: string, fromSha: string): Promise<void> {
    await this.call("POST", "/git/refs", { ref: `refs/heads/${branch}`, sha: fromSha });
  }

  /** File text at a ref, or null when absent. */
  async readFile(path: string, ref: string): Promise<string | null> {
    try {
      const r = await this.call<{ content: string; encoding: string }>(
        "GET",
        `/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`,
      );
      return Buffer.from(r.content, r.encoding as BufferEncoding).toString("utf8");
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) return null;
      throw e;
    }
  }

  async listDir(path: string, ref: string): Promise<{ name: string; path: string; type: string }[]> {
    try {
      return await this.call("GET", `/contents/${path}?ref=${encodeURIComponent(ref)}`);
    } catch (e) {
      if (e instanceof GitHubError && e.status === 404) return [];
      throw e;
    }
  }

  /** One atomic commit on `branch` (must exist). Returns the new commit sha. */
  async commit(branch: string, message: string, files: FileWrite[]): Promise<string> {
    const head = await this.branchSha(branch);
    if (!head) throw new GitHubError(`branch ${branch} does not exist`, 404);
    const base = await this.call<{ tree: { sha: string } }>("GET", `/git/commits/${head}`);
    const tree = await Promise.all(
      files.map(async (f) => {
        if ("delete" in f) return { path: f.path, mode: "100644", type: "blob", sha: null };
        const blob = await this.call<{ sha: string }>("POST", "/git/blobs", {
          content: f.content,
          encoding: f.encoding ?? "utf-8",
        });
        return { path: f.path, mode: "100644", type: "blob", sha: blob.sha };
      }),
    );
    const newTree = await this.call<{ sha: string }>("POST", "/git/trees", { base_tree: base.tree.sha, tree });
    const commit = await this.call<{ sha: string }>("POST", "/git/commits", {
      message,
      tree: newTree.sha,
      parents: [head],
    });
    // force:false — a concurrent push to the branch fails this instead of being overwritten.
    await this.call("PATCH", `/git/refs/heads/${encodeURIComponent(branch)}`, { sha: commit.sha, force: false });
    return commit.sha;
  }

  async openDraftPr(args: { head: string; base: string; title: string; body: string }): Promise<{ number: number; url: string }> {
    const r = await this.call<{ number: number; html_url: string }>("POST", "/pulls", { ...args, draft: true });
    return { number: r.number, url: r.html_url };
  }

  async findOpenPr(head: string): Promise<{ number: number; url: string } | null> {
    const r = await this.call<{ number: number; html_url: string }[]>(
      "GET",
      `/pulls?state=open&head=${encodeURIComponent(`${this.repoRef.owner}:${head}`)}`,
    );
    return r[0] ? { number: r[0].number, url: r[0].html_url } : null;
  }
}
