# The Ledger — memory + duplicate prevention

The ledger is how the whole system remembers what it already said, so no post is ever duplicated and no vetoed idea is ever regenerated. **It is append-only.** You add lines; you never edit or delete them. Four files, each a JSONL stream (one JSON object per line).

## The files

| File | What goes in it | Written by |
|---|---|---|
| `posted.jsonl` | every piece that went live | the publisher (Pipedream/Pi5) after Blotato confirms |
| `scheduled.jsonl` | queued in Blotato, not yet fired | the scheduler when it queues a post |
| `rejected.jsonl` | SKIP'd or vetoed drafts (so we don't regenerate them) | the approval handler on SKIP/veto |
| `duplicate-candidates.jsonl` | near-dupes flagged for a human to check | the dedup check when it finds a close match |

## Line schema (all files share this shape)

```json
{
  "id": "2026-07-09-mnemix-metering-ledger",   // stable slug: date-project-angle
  "ts": "2026-07-09T12:06:03Z",                // when this state change happened (UTC)
  "project": "mnemix",                          // this OS drafts for: mnemix | abdur-ai | dockerfile-ai | heycli | mnemix-learning
                                                 // OBSERVED-ONLY (from parallel-pipeline backfill, not drafted by this OS): retention-lab
  "channel": "x",                               // this OS's own short codes: x | linkedin | ig | blog | reddit-draft | hn-draft
                                                 // OBSERVED-ONLY (raw Blotato platform names, backfilled rows): instagram | threads
                                                 //   (twitter is normalized to "x" at backfill time; instagram/threads are not — "ig" is
                                                 //    this OS's convention for content it drafts, "instagram" is what a backfill records)
  "account": "@mnemix_official",                // handle or account id
  "angle": "metering ledger: count before you charge; double-gate append-only",
  "source": "sources/repo-events/pr-406.md",    // REQUIRED — traces to real work
  "state": "posted",                            // posted | scheduled | rejected | duplicate
  "blotato_id": "abc123",                       // scheduled/posted only
  "permalink": "https://x.com/mnemix_official/status/...", // posted only
  "hash": "sha1-of-normalized-body",            // for exact-dupe detection
  "keywords": ["metering","append-only","rls","cache-hit"] // for near-dupe detection
}
```

`rejected.jsonl` adds `"reason": "off-voice" | "duplicate" | "founder-veto" | "wrong-timing"`.
`duplicate-candidates.jsonl` adds `"matches": ["<id>", ...]` and `"similarity": 0.82`.

## The dedup check — run this BEFORE writing any draft

1. **Gather the corpus.** Read `posted.jsonl` + `scheduled.jsonl` (and skim `rejected.jsonl` — don't re-pitch a vetoed angle) for the target `project`.
2. **Exact check.** Normalize your candidate body (lowercase, strip whitespace/punctuation/emoji), sha1 it. If the hash matches any ledger line → **it's a dup, stop.**
3. **Near check.** Compare your `keywords` + `angle` against recent lines (last ~30 days for the same project). If keyword overlap is high (≥60%) or the angle is semantically the same → **write a line to `duplicate-candidates.jsonl` and pick a different angle**, or escalate to a human if you believe it's genuinely fresh.
4. **Cross-account check.** The same story can run once on `@abdur_sayeed` (operator framing) and once on `@mnemix_official` (product framing) — that's allowed — but not the *same framing* twice, and never both accounts on the identical text.
5. Only after passing → draft.

## Append discipline (don't corrupt the ledger)

- **One JSON object per line, newline-terminated. No pretty-printing, no trailing commas.**
- **Normalize permalinks before writing or comparing: strip `www.`** (`://www.` → `://`). A `www` mismatch once defeated the backfill dedup and produced a duplicate row.
- Append with `>>`, never rewrite the file. Concurrent writers: append is atomic for small lines; if a process must batch, write to a temp file and `cat >>` once.
- Every state transition = one new line. A post goes `scheduled` → (fires) → `posted`: that's two lines with the same `id`, not an edit.
- `id` is the join key across lines. Keep it stable for a given piece of content.

## Why append-only

Same reason the Mnemix `usage_events` ledger is append-only: history you can edit is history you can't trust. If the dedup memory could be silently rewritten, a duplicate could slip through and nobody would know. Append-only + the `id`/`hash` keys make "did we already post this?" a question with a definite answer.

## Seeding note

These files start empty (2026-07-09). The first real writes come from: (a) the Mnemix daily brain's approved posts, (b) the abdur.ai brain's approved posts, (c) backfill of the pillar-1 "voice has no cookies" post already published on X/LinkedIn — add those as `posted` lines when convenient so the dedup corpus reflects reality.
