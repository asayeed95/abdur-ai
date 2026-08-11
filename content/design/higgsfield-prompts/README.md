# Higgsfield Prompt Library

Parametric, copy-and-fill Higgsfield prompts for every visual abdur.ai and Mnemix ship. One library, two design systems, three formats. Nobody free-hands a prompt from memory — copy a template, fill the slots, generate, file the output next to the content it supports.

## Why this exists

Every visual in this content OS should look like it came from the same operator, not a random AI-image roulette. Without fixed inputs, "generate a carousel card" means re-deciding the palette, the type pairing, and the AI-slop guardrails from scratch each time — and that's how a Mnemix post ends up with a glowing-brain stock render, or an abdur.ai card lands in the wrong warmth of black. These templates lock the inputs that shouldn't move (palette, type, motif, negative prompts) and leave open only the slots that are actually content-specific.

**Hard rule, same tier as the voice contract: a visual with no content angle behind it doesn't get generated.** `content/README.md` rule #5 — "every idea is traceable to a real source" — applies to images and video exactly like it applies to copy. If `{{angle}}` can't point at a real line in `drafts/<project>/`, `posts/_drafts/`, or `sources/`, stop and go find (or write) the draft first. A visual is an illustration of a real post, not a standalone decoration.

## Templates in this library

| Template | Use for | Native formats | Default Higgsfield engine |
|---|---|---|---|
| [`carousel-card.md`](./carousel-card.md) | IG/LinkedIn carousel slides — one card per beat of a narrative (hook → build → receipt → close) | 4:5, 1:1 | Nano Banana Pro/2 (image, MCP) |
| [`x-image.md`](./x-image.md) | A single attached image for an X post or one tweet in a thread — stat callout, terminal capture, quote card, diagram | 16:9, 1:1 | Nano Banana Pro/2 (image, MCP) |
| [`motion-loop.md`](./motion-loop.md) | Looping ambient B-roll for Reels/Shorts, site hero background, NeuralSphere-style motif animation | 9:16, 1:1, 16:9 | Kling 3.0 (video, MCP) |

Each file is self-contained: purpose, slot table, fill checklist, the raw parametric prompt block, both palette blocks (so you never have to hunt for a hex value), negative-prompt boilerplate, and one worked example per design system pulled from real, published posts — so you can see a correct fill before you write your own.

Deeper per-project design rules (extended palette, type hierarchy, brief frontmatter format, the full "don't" list) live in the sibling docs this library defers to: `../abdur-ai-design-system.md` (CLAY) and `../mnemix-design-system.md` (SIGNAL NOIR, once written). This library is the Higgsfield-prompt layer on top of those systems — read the design-system doc first if a rule here seems incomplete.

## Before you generate: how Higgsfield handles text

Diffusion image models render exact words and numbers unreliably — and a headline or a stat is exactly the thing a carousel card or X image can't afford to get wrong. Two working patterns, same discipline `../abdur-ai-design-system.md` §6 already locks for CLAY and this library extends to both systems:

1. **Typography-led compositions (most carousel cards, most X images): render the text yourself, don't ask the model to.** Build the headline/stat layer as HTML/CSS with the real hex tokens and named fonts hard-coded (the `artifact-design` skill's approach works well here), export to PNG, and use the `{{headline}}` / `{{data_points}}` slots in each template as the composition spec for that layer — not as words you're trusting Higgsfield to spell correctly.
2. **Photographic, textural, or motif elements: generate with Higgsfield, then composite the real text on top.** Use the raw prompt blocks below to generate *only* the background/texture/motif layer — state the exact hex values in the prompt and explicitly ban stray text ("no lettering, no numerals, no logo") — then lay the verified headline over it in the HTML/CSS pass.

If you do generate a full card straight through Higgsfield for a fast draft (skipping the composite step), **proof every word and number against the `{{headline}}` / `{{data_points}}` slot before it ships.** Regenerate rather than ship a misspelling or a wrong digit — this is the same "no receipt, no ship" rule the voice contract runs on, just applied to pixels.

Motion loops (`motion-loop.md`) sidestep this entirely by design: no text is ever baked into a loop — overlay copy is added as a separate layer in the edit tool.

## How to fill a template (every time)

1. **Confirm the angle is real.** Open `drafts/<project>/` (or `sources/`, or a published post) and find the actual line this visual illustrates. Copy it close to verbatim into `{{angle}}` — don't paraphrase into something vaguer than the source.
2. **Pick `{{project}}`** — `abdur-ai` or `mnemix`. This decides `{{palette}}` for you (see below). Never mix systems on one asset.
3. **Copy the raw prompt block** from the template file into a scratch note.
4. **Fill every `{{slot}}`.** Paste in the palette block that matches `{{project}}` and delete the other — each template ships both, inline.
5. **Lint the on-image text against the voice contract** (below) before you generate. A banned phrase baked into a PNG is exactly as bad as one in a tweet.
6. **Generate via the named Higgsfield engine.** Confirm it's still the live default first — `CREATIVE_STACK.md` model defaults drift as Higgsfield ships new versions; when unsure, call `models_explore(action:'recommend')` or `higgsfield model list` rather than assuming.
7. **File the result.** Save the filled prompt plus the output reference in the matching brief folder — `design/carousel-briefs/`, `design/image-briefs/`, or `design/motion-briefs/` — and link the asset from the draft it supports.

Full engine/access routing (MCP vs CLI vs browser, unlimited-model windows, sibling tools): `../../../../CREATIVE_STACK.md` (portfolio root, last verified 2026-06-11 — re-verify live models before a big batch run).

## The two design systems

### CLAY — abdur.ai (warm, editorial, operator-diary)

| Token | Value |
|---|---|
| Background | `#0B0A08` |
| Surface | `#161310` |
| Accent (clay) | `#D97757` |
| Text | `#F2EDE6` |
| Muted | `#948B7D` |
| Display font | Playfair Display |
| Body font | Inter |
| Code/data font | JetBrains Mono |

Locked in `abdur-ai/tailwind.config.ts` + `abdur-ai/app/globals.css` — do not invent new tones or swap the pairing. Mood: warm dark, editorial magazine crossed with a terminal, one accent used sparingly, real screenshots and hand-annotated diagrams over stock photography.

### SIGNAL NOIR — Mnemix (technical, precise, dark)

| Token | Value |
|---|---|
| Background | `#09090b` |
| Background steps | `#0c0c0e` / `#111113` / `#161618` |
| Text (ink) | `#fafafa` |
| Muted (ink2 / ink3 / ink4) | `#a1a1aa` / `#71717a` / `#52525b` |
| Cyan (primary signal accent) | `#22d3ee` |
| Violet (differentiator accent) | `#c9a8ff` |
| Rose (danger/alert accent) | `#fb7185` |
| Display/body font | Manrope |
| Code/data/mono font | Geist Mono |

Pulled from `mnemix/web/src/components/ui/tokens.ts` + `globals.css` — the same tokens the live product UI runs, so exports match the site instead of drifting from it. **Motif: NeuralSphere** (rotating neural-network sphere) is the canonical Mnemix visual identity — reuse it, don't invent a competing icon system. **No generic AI imagery**: no glowing brains, no robot handshakes, no stock circuit boards, no "AI" typographic clichés.

## Voice contract applies to on-image text too

Any headline, stat, or caption baked into a generated image answers to the exact same rules as post copy (`voice/abdur-voice.md`, `voice/banned-phrases.md`):

- Banned: game-changer, revolutionary, cutting-edge, "the future of", world-class, best-in-class, supercharge, unlock, unleash, empower, seamless, frictionless, disrupt, paradigm shift, "let's dive in", "here's the thing", "grateful/excited/thrilled to announce", "move the needle", leverage (as a verb), utilize, "blazing fast", "trusted by thousands", "studies show", "buckle up", "stop scrolling", fake thread-bait.
- Every number or claim rendered as text-in-image traces to real work — a repo change, a bug, a decision, a demo, a doc. No fabricated latency, benchmark, customer, or integration figure.
- Mnemix-specific locks apply to on-image copy too: enrichment vendors are Trestle + Twilio Lookup only; latency is only ever "designed for sub-300ms voice recall" (never a fabricated number); pricing is Hobby $0 / paid tiers "contact sales", never a quota or invented price.
- If a line could sit on any SaaS landing page, it's slop — rewrite it specific to this work before it goes into the prompt.

## Shared slot reference

Every template uses this base set; each template file adds its own format-specific slots on top.

| Slot | What goes here |
|---|---|
| `{{project}}` | `abdur-ai` or `mnemix` |
| `{{palette}}` | `CLAY` or `SIGNAL-NOIR` — must match `{{project}}` |
| `{{angle}}` | The real content angle this visual supports, copied from a draft, source, or published post — never invented |
| `{{format}}` | `carousel-card`, `x-image`, or `motion-loop` |
| `{{aspect_ratio}}` | Per the template's native-formats table |
| `{{headline}}` | The on-visual headline, short, voice-contract clean |
| `{{model}}` | Higgsfield engine override — leave the template default unless you've confirmed a better fit via `models_explore` |
| `{{negative_prompt}}` | Paste the shared boilerplate below; extend per-asset if the draft output needs it |

### Negative-prompt boilerplate (paste into every `{{negative_prompt}}` slot)

```
generic AI imagery, glowing brain, robot handshake, stock circuit board, motivational-poster gradient,
generic corporate stock photo people, fake "AI" sparkle icons, watermarks, logo distortion,
misspelled or garbled text, warped hands, extra fingers, low-contrast text-on-background,
neon rainbow gradient not in the named palette, off-brand fonts, stray drop shadows
```

## Where finished briefs live

Save the filled-prompt-plus-output-reference brief next to its sibling folder, not inside this library:

- `design/carousel-briefs/` — filled `carousel-card.md` runs
- `design/image-briefs/` — filled `x-image.md` runs
- `design/motion-briefs/` — filled `motion-loop.md` runs
- `sources/design-refs/` — raw reference assets pulled into a prompt (screenshots, existing brand shots)

Link the final asset (Higgsfield output URL or local path) from the draft in `drafts/<project>/` it supports, so the loop in `content/README.md` — capture → dedupe → draft → approve → schedule → publish → record — stays traceable end to end.

*Last updated 2026-07-09.*
