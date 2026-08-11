# Template: Carousel Card

One card in a 3–8 slide IG/LinkedIn carousel that walks a single content angle through a sequence: **hook → build (1–4 slides) → receipt → close**. Generate one card at a time — each slide gets its own filled prompt — so the copy and motif stay tight per beat instead of blurring into one crowded image.

Every card must trace back to the same `{{angle}}` across the whole carousel. If slide 3 needs a different real fact, it's still in service of the same angle — don't drift into a second, unrelated story mid-carousel.

**Text reliability:** diffusion models spell headlines wrong often enough that you shouldn't trust them with the words. Prefer rendering `{{headline}}` / `{{body_copy}}` yourself in HTML/CSS over the tokens below and using the raw prompt block only to generate the background/motif layer you composite it onto. If you generate a full card in one Higgsfield pass instead, proof the on-card text against the slot values before it ships — regenerate on any misspelling. See `README.md` → "Before you generate: how Higgsfield handles text" for the full pattern.

## Format-specific slots

In addition to the shared slots in [`README.md`](./README.md) (`{{project}}`, `{{palette}}`, `{{angle}}`, `{{aspect_ratio}}`, `{{headline}}`, `{{model}}`, `{{negative_prompt}}`):

| Slot | What goes here |
|---|---|
| `{{slide_number}}` / `{{slide_count}}` | Position in the sequence, e.g. `1` of `5` |
| `{{slide_role}}` | `hook` (slide 1) · `build` (middle slides) · `receipt` (the proof slide — a real number, diff, or quote) · `close` (last slide) |
| `{{body_copy}}` | 1–2 sentence supporting text (blank on the hook slide — the headline alone carries it) |
| `{{visual_motif}}` | `terminal-capture` · `annotated-diagram` · `stat-callout` · `code-snippet` · `neuralsphere-fragment` (Mnemix only) · `margin-note` (CLAY only — a handwritten-style annotation in the clay accent) |
| `{{cta_text}}` | Optional, close slide only — for Mnemix this is the locked closer ("Choose Mnemix as your agent memory layer.") or blank; for abdur.ai usually blank or a soft "I write this up at abdur.ai" |

## Fill checklist

- [ ] `{{angle}}` copied close to verbatim from a draft, source, or published post
- [ ] `{{slide_role}}` matches its position (hook = slide 1, close = last slide)
- [ ] `{{headline}}` is short and clean of every banned phrase in `voice/banned-phrases.md`
- [ ] Palette block matches `{{project}}`; the unused block is deleted before generating
- [ ] `{{visual_motif}}` is real — a stat callout needs a real number, a terminal capture needs a real command/diff, not an invented one
- [ ] `{{cta_text}}` on the close slide follows the per-project rule in `voice/abdur-voice.md` (Mnemix closer is exact and locked; abdur.ai rarely needs one)
- [ ] Negative-prompt boilerplate included

## Raw prompt block

```
Design a {{aspect_ratio}} social carousel card — slide {{slide_number}} of {{slide_count}}, role: {{slide_role}} — for {{project}}.

CONTENT ANGLE THIS CARD SUPPORTS (verbatim from source, do not paraphrase):
"{{angle}}"

DESIGN SYSTEM: {{palette}}
[paste the matching palette block from below; delete the other]

HEADLINE (on-card, primary type): "{{headline}}"
SUBHEAD / BODY (blank if slide_role = hook): "{{body_copy}}"
VISUAL MOTIF: {{visual_motif}}
CTA (close slide only, optional, leave blank otherwise): "{{cta_text}}"

Composition: one focal element per card, generous negative space, headline set in the design
system's display font, any data/code element set in its code font. The card must read at
thumbnail size in a feed scroll — one idea, not a wall of text. No slide number or "1/5"
counter baked into the image; the platform renders that.

NEGATIVE PROMPT: {{negative_prompt}}
```

## Palette blocks

**CLAY** (paste into `{{palette}}` when `{{project}}` = `abdur-ai`):

```
Background #0B0A08, surface panel #161310, single accent #D97757 used only on the headline
or one graphic element, primary text #F2EDE6, secondary/meta text #948B7D.
Display type: Playfair Display (headline). Body type: Inter. Code/data type: JetBrains Mono.
Mood: warm editorial dark, operator-diary, hand-annotated feel — not glossy, not corporate.
```

**SIGNAL NOIR** (paste into `{{palette}}` when `{{project}}` = `mnemix`):

```
Background #09090b (panels step to #0c0c0e / #111113 / #161618), primary text #fafafa,
muted text #a1a1aa, signal accent cyan #22d3ee (primary), violet #c9a8ff (differentiator,
use sparingly), rose #fb7185 (alert/danger only, rare).
Display/body type: Manrope. Code/data/mono type: Geist Mono.
Mood: technical, precise, dark product UI — NeuralSphere motif where relevant, zero
generic-AI imagery.
```

## Worked examples

### CLAY — abdur.ai (real angle: `content/posts/the-night-the-doctrine-failed.mdx`)

```
Design a 4:5 social carousel card — slide 1 of 6, role: hook — for abdur-ai.

CONTENT ANGLE THIS CARD SUPPORTS (verbatim from source, do not paraphrase):
"Seven-rule batch protocol. Five rounds of adversarial audit. An independent cross-verifier
as the final gate. Every gate returned green. None of them were real. A 75% false-close rate."

DESIGN SYSTEM: CLAY
Background #0B0A08, surface panel #161310, single accent #D97757 used only on the headline
or one graphic element, primary text #F2EDE6, secondary/meta text #948B7D.
Display type: Playfair Display (headline). Body type: Inter. Code/data type: JetBrains Mono.
Mood: warm editorial dark, operator-diary, hand-annotated feel — not glossy, not corporate.

HEADLINE (on-card, primary type): "Every gate returned green. None of them were real."
SUBHEAD / BODY (blank on hook): ""
VISUAL MOTIF: margin-note — a single red-pen-style checkmark in #D97757 crossed out over a
faint terminal-log background
CTA (close slide only, leave blank otherwise): ""

Composition: one focal element per card, generous negative space, headline set in the design
system's display font. The card must read at thumbnail size in a feed scroll — one idea, not
a wall of text. No slide number or "1/6" counter baked into the image.

NEGATIVE PROMPT: generic AI imagery, glowing brain, robot handshake, stock circuit board,
motivational-poster gradient, generic corporate stock photo people, fake "AI" sparkle icons,
watermarks, logo distortion, misspelled or garbled text, warped hands, extra fingers,
low-contrast text-on-background, neon rainbow gradient not in the named palette, off-brand
fonts, stray drop shadows
```

### SIGNAL NOIR — Mnemix (real angle: AGE-267 P0 supersession fix)

```
Design a 4:5 social carousel card — slide 3 of 6, role: receipt — for mnemix.

CONTENT ANGLE THIS CARD SUPPORTS (verbatim from source, do not paraphrase):
"sql.begin-on-tx-client crash merged and deployed unnoticed — zero observe traffic caught
it until the AGE-267 P0 supersession fix."

DESIGN SYSTEM: SIGNAL NOIR
Background #09090b (panels step to #0c0c0e / #111113 / #161618), primary text #fafafa,
muted text #a1a1aa, signal accent cyan #22d3ee (primary), violet #c9a8ff (differentiator,
use sparingly), rose #fb7185 (alert/danger only, rare).
Display/body type: Manrope. Code/data/mono type: Geist Mono.
Mood: technical, precise, dark product UI — NeuralSphere motif where relevant, zero
generic-AI imagery.

HEADLINE (on-card, primary type): "Zero observe traffic. That's how a crash ships quiet."
SUBHEAD / BODY: "AGE-267 — sql.begin-on-tx-client, caught by the P0 supersession fix."
VISUAL MOTIF: annotated-diagram — a minimal request-path diagram with the failure node
circled in rose #fb7185, rest of the path in cyan
CTA (close slide only, leave blank otherwise): ""

Composition: one focal element per card, generous negative space, headline set in the design
system's display font, the diagram labels set in Geist Mono. The card must read at thumbnail
size in a feed scroll — one idea, not a wall of text. No slide number counter baked into the
image.

NEGATIVE PROMPT: generic AI imagery, glowing brain, robot handshake, stock circuit board,
motivational-poster gradient, generic corporate stock photo people, fake "AI" sparkle icons,
watermarks, logo distortion, misspelled or garbled text, warped hands, extra fingers,
low-contrast text-on-background, neon rainbow gradient not in the named palette, off-brand
fonts, stray drop shadows
```

## Output routing

File the filled prompt + generated asset reference in `design/carousel-briefs/`, one file per carousel (all slides together), named after the slug of the draft it supports.
