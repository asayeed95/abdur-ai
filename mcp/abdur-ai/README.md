# abdur-ai MCP server

This server lets Claude Code (or any MCP client) draft, revise, illustrate and prepare abdur.ai posts. Every write is a commit on a `drafts/<slug>` branch plus one draft PR, and nothing it does can reach `main`. **Merging the PR is what publishes**, so CI's register, claims and receipts gates run on agent-written posts exactly as they do on hand-written ones.

The logic lives in `lib/publish/` and is shared with `/admin` (AGE-2974). This directory only holds the MCP wrapper. Linear: AGE-2973.

## Tools

| Tool | Writes? | What it does |
|---|---|---|
| `abdur_list_posts` | no | Lists published and draft slugs on `main` (or a given ref). |
| `abdur_get_post` | no | Returns the raw MDX for a slug, checking its draft branch, then main's draft, then the published file. |
| `abdur_validate_draft` | no | Reports every content-law problem at once: register, receipts for `reported`, slug, a description of at most 160 chars, no MDX `import`/`export`. |
| `abdur_create_draft` | branch + draft PR | Writes `content/posts/_drafts/<slug>.mdx`. Refuses a slug that is already published. |
| `abdur_update_draft` | commit | Patches fields; the whole draft is re-validated. |
| `abdur_upload_image` | commit | Adds a PNG/JPEG/WebP/GIF of at most 5 MB to `public/blog/<slug>/` and returns the `![alt](…)` markdown. The bytes must match the extension. SVG is refused because it can carry same-origin script. A `filePath` is read only if it resolves (following symlinks) inside the upload root, `ABDUR_PUBLISH_UPLOAD_DIR` (default: the working directory), and is under the size limit. The repo is public, so an upload is a publication. |
| `abdur_prepare_publish` | commit | Moves the draft into `content/posts/` and appends a `content-publish-override:` entry. `approvedBy` must quote a real human approval (who, where, when); placeholders such as "pending" or "self" are refused. |

Every write tool requires `taskId`, a Linear issue such as `AGE-1234`, because the repo's Linear-first rule applies. Writes can only touch `content/posts/_drafts/<slug>.mdx`, `content/posts/<slug>.mdx`, `public/blog/<slug>/*` and the overrides file. Branch updates are fast-forward only, so a concurrent push fails the call instead of being overwritten.

## Setup

```bash
npm ci                         # repo root (the publish core uses root deps)
npm ci --prefix mcp/abdur-ai   # MCP SDK + tsx
```

Register it with Claude Code from the repo root, injecting the token from Doppler so it never sits in a config file:

```bash
claude mcp add abdur-ai -- doppler run --project <project> --config <config> -- npx tsx mcp/abdur-ai/server.ts
```

Or without Doppler, using a JSON entry such as `.mcp.json` or `~/.claude.json`:

```json
{
  "mcpServers": {
    "abdur-ai": {
      "command": "npx",
      "args": ["tsx", "mcp/abdur-ai/server.ts"],
      "env": { "ABDUR_PUBLISH_GITHUB_TOKEN": "${ABDUR_PUBLISH_GITHUB_TOKEN}" }
    }
  }
}
```

**Token:** use a fine-grained personal access token scoped to `asayeed95/abdur-ai` only, with Contents read/write and Pull requests read/write. This repo is public, so never commit the token. Without one, every write tool returns a **dry-run plan**: validation runs and nothing is written. That makes the server safe to try with zero setup.

## Tests

```bash
npm run test:publish   # from the repo root; CI runs this too
```

The tests cover the draft rules, path safety, magic bytes, refusal of self-approval, the override line matching `scripts/check-phase.sh`'s grep, dry runs, and the create → update → image → prepare-publish flow against an in-memory GitHub, including the fast-forward race.
