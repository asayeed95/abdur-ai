# Registers — what a post on abdur.ai is allowed to claim

**Status:** ACTIVE. Source: the GMP design lane. Enforced mechanically by
`lib/posts.ts` (build fails on an undeclared post) and
`scripts/check-public-claims.py` (a `reported` post without receipts fails the
gate). This file is the human-readable version of those two gates; where it and
they disagree, they win.

## Publish freely

Shipping is not a precondition for publishing. What *is* required is being
honest about which kind of claim you are making. There are three:

| register | asserts | needs |
|---|---|---|
| `reported` | "this happened" | a receipt — PR, SHA, log line, or measurement |
| `designed` | "this is what I designed / how I'd build it" | nothing shipped |
| `argued` | "this is what I think is true" | no artifact |

Every post declares its register in frontmatter:

```yaml
register: designed
status_note: "Design. Not built yet."   # optional; a default is supplied
```

`designed` and `argued` posts render a one-line status note near the top.
**That note is a credibility feature, not a disclaimer** — it says the author
knows the difference. Write it as a statement, not an apology. `reported` posts
carry no note; their receipts block is the note.

Defaults, if you omit `status_note:` — see `lib/registers.ts`:

- `designed` → "Design. Not built yet."
- `argued` → "Argument. No artifact behind it."
- `reported` → none.

Override the default whenever it would misstate the piece. `voice-ai-memory-
latency-is-a-dead-argument.mdx` is the worked example: it is `argued`, and its
note names the one thing a reader could otherwise mistake for a measurement.

## The hard line — not waivable by any register

1. **No past-tense verb over an event that did not happen.** "I built X" is a
   `reported` sentence. If X is not built, the sentence is "I'd build X" and
   the post is `designed`. This is not a style preference.
2. **No number attached to something that was not measured.** A target is a
   target and must read as one. If you cannot point at the run that produced
   the number, the number does not go in the post.

Everything else is open — tone, length, cadence, how speculative you get.
**The moat is that the claims check out.**

## Choosing the register

Ask what breaks if you are wrong.

- Wrong about an event → you published a false fact. `reported`, and it owes a
  receipt.
- Wrong about a design → you had a worse idea than you thought. `designed`.
  Costs nothing but your judgement.
- Wrong about a belief → you argued badly. `argued`.

When a post mixes registers, the register is the **strongest claim it makes**.
A designed piece that opens with one real incident is `reported` — the incident
is load-bearing, so it owes a receipt. Split the post if that feels wrong.

## Receipts

`reported` posts carry a `receipts:` block in frontmatter:

```yaml
receipts:
  - path: "dashboard/layout.tsx"
    sha: "aee3f57"
    note: "what this proves"
```

A receipt points at something a reader could independently check. "I remember
it going that way" is not a receipt. If the evidence is gone, the post is
`argued` and says so.

## Where this is enforced

| gate | what it catches |
|---|---|
| `lib/posts.ts` → `requireRegister()` | a published post with no/invalid `register:` — **fails `npm run build`** |
| `scripts/check-public-claims.py` | a `reported` post with no `receipts:` block; a register list in `lib/registers.ts` that this gate no longer mirrors |
| `scripts/tldr-publish.mjs` | refuses to promote a draft that has not declared a register |

There is deliberately **no** gate on the status note. `lib/registers.ts` supplies
a default for `designed` and `argued`, so a note-less post of those registers
cannot be built — a checker for it could never fail, and a gate that cannot
fail is worse than no gate, because it reads as coverage.

Both gates are proven by mutation, not assumed: see `RETRO.md`.
