# Totality Beacon Program — Signal Noir asset batch, 2026-08-08

Generated via Higgsfield MCP (`nano_banana_pro` for stills, `seedance_2_5` for motion), against the **real** current Signal Noir semantic tokens from `docs/superpowers/specs/change-requests/2026-08-08-totality-beacon-program-control-plane.md` §10.2 (merged PR #518) — not the superseded minimum-brief version. Palette used: canvas `#09090B`, foreground-primary `#FAFAFA`, foreground-secondary `#D4D4D8`, accent/focus cyan `#22D3EE`, proposed/violet `#C9A8FF`, warning `#FBBF24`, danger `#FB7185`.

Every asset traces to a real, verified fact from the TBP control-plane CR doc and its superseding-errata table — not invented content. No public claim, no runtime, no shipped-system framing (the CR itself is PROPOSED, not yet accepted).

## Assets

| File | Angle | Source |
|---|---|---|
| `card-01-g1-metric.png` | The current best "quality" proxy is `Math.ceil(text.length / 4)` — literally character count, not correctness. The nearest available signal, `containsAnswer`, is monotone in packet size. | CR doc, superseding-errata table row 3: "G1 uses `Math.ceil(text.length / 4)`... those receipts support the criticism of size-only/answer-presence metrics." Verbatim from `scripts/bench/north-star-g1-lib.ts:26`. |
| `card-02-cursorbot.png` (v2 — v1 discarded, had a text-rendering glitch on "satisfied", re-verified this session) | `cursor[bot]` issues real GitHub APPROVED reviews and satisfies branch protection alone — PR #507 merged this way with no CodeRabbit approval. | CR doc §"Two facts that change your assumptions", item 1. Live branch-protection observation dated 2026-08-08. |
| `motion-01-spine.mp4` (5s, 1:1, loopable) | "Salience is the spine" — one score computed once at write time, consumed by three separate systems (decay, the reflector, Beacon) at read time. The three branch points lighting in sequence are that fan-out. | CR doc §1 problem statement + the design-system dispatch's "Context" section: three consumers of the one score. |

## Notes for whoever uses these next

- These are content/marketing assets, not the internal board UI itself — that's Prompt D's job in the CR's peer-agent execution pack (§21), a code-lane task. These support build-in-public content *about* the system.
- The CR is PROPOSED architecture, not yet accepted. Any copy paired with these assets should say "the quality-measurement problem we're solving," not "the system we shipped."
- Card 2's fact (`cursor[bot]` approvals) is real but sensitive — it's a description of how branch protection currently works, not a criticism aimed at anyone. Keep the framing calm/observational if published, per the generation brief.
