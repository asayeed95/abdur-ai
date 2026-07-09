# Template: X Image

A single attached image for an X post or one tweet inside a thread. Unlike a carousel, this is a standalone visual — it has to carry the whole idea in one frame, because there's no next-slide to lean on.

**Text reliability:** diffusion models spell headlines and numbers wrong often enough that you shouldn't trust them with the words — and a stat-callout or quote-card is entirely words. Prefer rendering `{{headline}}` / `{{data_points}}` yourself in HTML/CSS over the tokens below and using the raw prompt block only to generate the background/motif layer you composite it onto. If you generate a full image in one Higgsfield pass instead (fine for a `terminal-capture` where a real screenshot may be more accurate than either), proof every word and digit against the slot values before it ships. See `README.md` → "Before you generate: how Higgsfield handles text" for the full pattern.

## Format-specific slots

In addition to the shared slots in [`README.md`](./README.md) (`{{project}}`, `{{palette}}`, `{{angle}}`, `{{aspect_ratio}}`, `{{headline}}`, `{{model}}`, `{{negative_prompt}}`):

| Slot | What goes here |
|---|---|
| `{{image_role}}` | `stat-callout` · `terminal-capture` · `quote-card` · `diagram` |
| `{{data_points}}` | For `stat-callout` / `diagram`: the real number(s) and their source (a command, a log line, a doc) — required, not optional |
| `{{body_copy}}` | Optional supporting line under the headline; often blank for a `terminal-capture` where the code itself is the content |
| `{{source_attribution}}` | Small-type credit line if the image is a screenshot of real output (e.g. a file path + line, a query, a date) |

## Fill checklist

- [ ] `{{angle}}` copied close to verbatim from a draft, source, or published post
- [ ] If `{{image_role}}` = `stat-callout` or `diagram`, `{{data_points}}` names a real, verifiable number — never a placeholder or estimate
- [ ] `{{headline}}` is short and clean of every banned phrase in `voice/banned-phrases.md`
- [ ] Palette block matches `{{project}}`; the unused block is deleted before generating
- [ ] Mnemix-only: no fabricated latency number, no enrichment vendor besides Trestle/Twilio Lookup, no invented price — only "designed for sub-300ms voice recall" and "contact sales"
- [ ] Negative-prompt boilerplate included

## Raw prompt block

```
Design a {{aspect_ratio}} single social image (X post attachment), role: {{image_role}} — for {{project}}.

CONTENT ANGLE THIS IMAGE SUPPORTS (verbatim from source, do not paraphrase):
"{{angle}}"

DESIGN SYSTEM: {{palette}}
[paste the matching palette block from below; delete the other]

HEADLINE (primary type): "{{headline}}"
SUPPORTING LINE (optional): "{{body_copy}}"
DATA POINTS (required for stat-callout / diagram, source must be real): {{data_points}}
SOURCE ATTRIBUTION (small type, optional): "{{source_attribution}}"

Composition: this image stands alone with no next slide to lean on — it has to carry the full
idea in one frame. One dominant visual element, headline set in the design system's display
font, any number/data set in its code font at a size that reads on a phone-width timeline
without zooming.

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

### CLAY — abdur.ai (real angle: `content/posts/who-owns-the-architecture-when-ai-writes-the-code.mdx`)

```
Design a 1:1 single social image (X post attachment), role: quote-card — for abdur-ai.

CONTENT ANGLE THIS IMAGE SUPPORTS (verbatim from source, do not paraphrase):
"Writing the code and owning the system are not the same job. The test that separates them:
explain a decision, then change it. If the answer is 'the AI chose it,' you're a passenger."

DESIGN SYSTEM: CLAY
Background #0B0A08, surface panel #161310, single accent #D97757 used only on the headline
or one graphic element, primary text #F2EDE6, secondary/meta text #948B7D.
Display type: Playfair Display (headline). Body type: Inter. Code/data type: JetBrains Mono.
Mood: warm editorial dark, operator-diary, hand-annotated feel — not glossy, not corporate.

HEADLINE (primary type): "Explain a decision, then change it. If the answer is 'the AI chose
it,' you're a passenger."
SUPPORTING LINE (optional): ""
DATA POINTS: (none — this is a quote-card, not a stat-callout)
SOURCE ATTRIBUTION (small type, optional): "abdur.ai — Shipping solo with AI"

Composition: this image stands alone with no next slide to lean on. One dominant visual
element (the quote set large, centered, generous margin), headline set in Playfair Display,
attribution set small in Inter at the bottom edge.

NEGATIVE PROMPT: generic AI imagery, glowing brain, robot handshake, stock circuit board,
motivational-poster gradient, generic corporate stock photo people, fake "AI" sparkle icons,
watermarks, logo distortion, misspelled or garbled text, warped hands, extra fingers,
low-contrast text-on-background, neon rainbow gradient not in the named palette, off-brand
fonts, stray drop shadows
```

### SIGNAL NOIR — Mnemix (real angle: `content/posts/voice-ai-memory-latency-is-a-dead-argument.mdx`)

```
Design a 16:9 single social image (X post attachment), role: stat-callout — for mnemix.

CONTENT ANGLE THIS IMAGE SUPPORTS (verbatim from source, do not paraphrase):
"Voice agents already wait 200–500ms for voice activity detection on every turn. Memory
that returns inside that window adds zero perceived latency."

DESIGN SYSTEM: SIGNAL NOIR
Background #09090b (panels step to #0c0c0e / #111113 / #161618), primary text #fafafa,
muted text #a1a1aa, signal accent cyan #22d3ee (primary), violet #c9a8ff (differentiator,
use sparingly), rose #fb7185 (alert/danger only, rare).
Display/body type: Manrope. Code/data/mono type: Geist Mono.
Mood: technical, precise, dark product UI — NeuralSphere motif where relevant, zero
generic-AI imagery.

HEADLINE (primary type): "200–500ms of silence you're already paying for."
SUPPORTING LINE (optional): "Mnemix returns caller memory inside that window — designed for
sub-300ms voice recall."
DATA POINTS (source: standard VAD silence window cited in the linked post; Mnemix's own
figure is the locked public claim, not a benchmark number): "200–500ms VAD window / designed
for sub-300ms recall"
SOURCE ATTRIBUTION (small type, optional): "mnemix.ai"

Composition: this image stands alone with no next slide to lean on. One dominant visual
element — a simple horizontal timeline bar in cyan showing the VAD window with the memory
return marked inside it — headline set in Manrope, the timeline labels set in Geist Mono.

NEGATIVE PROMPT: generic AI imagery, glowing brain, robot handshake, stock circuit board,
motivational-poster gradient, generic corporate stock photo people, fake "AI" sparkle icons,
watermarks, logo distortion, misspelled or garbled text, warped hands, extra fingers,
low-contrast text-on-background, neon rainbow gradient not in the named palette, off-brand
fonts, stray drop shadows
```

## Output routing

File the filled prompt + generated asset reference in `design/image-briefs/`, named after the slug of the draft or tweet it supports.
