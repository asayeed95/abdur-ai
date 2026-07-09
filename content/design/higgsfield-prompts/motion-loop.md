# Template: Motion Loop

A short, seamlessly-looping ambient video — Reels/Shorts B-roll, a site hero background, or a NeuralSphere-style motif animation. This is not a narrative clip with a beginning and end; it's a loop meant to sit behind text or play on repeat without a visible seam.

Two ways to source it:

1. **Text-to-video** — describe the loop directly and generate with Kling 3.0.
2. **Image-to-video** — generate a still first with the [`x-image.md`](./x-image.md) or [`carousel-card.md`](./carousel-card.md) template (same palette, same angle), then animate that still. This keeps a hero loop visually locked to a still asset you've already approved, and is the more reliable path when the loop needs to match an existing card exactly.

## Format-specific slots

In addition to the shared slots in [`README.md`](./README.md) (`{{project}}`, `{{palette}}`, `{{angle}}`, `{{aspect_ratio}}`, `{{headline}}`, `{{model}}`, `{{negative_prompt}}`):

| Slot | What goes here |
|---|---|
| `{{duration}}` | Loop length in seconds — `3–5s` for Reels/Shorts B-roll, `6–10s` for a site hero background |
| `{{motion_type}}` | `slow-rotate` (e.g. NeuralSphere) · `parallax-drift` · `subtle-pulse` (accent color breathing) · `camera-push` (slow dolly-in on a still scene) |
| `{{camera}}` | `static` (motion is in the subject, not the camera) or `slow-push` / `slow-pull` — motion loops almost never use a moving handheld camera |
| `{{loop_seam}}` | `must-be-seamless` (default — frame 1 and the last frame need to match for a true loop) or `single-play` (plays once, no loop needed — B-roll cut into an edit rather than looped behind text) |
| `{{source_still}}` | If using image-to-video: the path/ref of the approved still this loop animates. Blank if pure text-to-video |
| `{{overlay_headline}}` | If this loop plays behind on-screen text in the final edit, leave it out of the generated video itself — text goes on as a separate overlay layer in the edit tool, not baked into the loop |

## Fill checklist

- [ ] `{{angle}}` copied close to verbatim from a draft, source, or published post — a motion loop still needs a reason to exist, not just "it looks nice"
- [ ] `{{loop_seam}}` is set correctly for where this asset is going (looping background vs. one-time B-roll cut)
- [ ] Palette block matches `{{project}}`; the unused block is deleted before generating
- [ ] Mnemix loops reuse the NeuralSphere motif rather than inventing a new icon system, unless the brief explicitly calls for something else
- [ ] No text is baked into the loop itself unless it's meant to be permanent (prefer overlay text in the edit tool for anything that might need a copy change later)
- [ ] Confirmed the live default engine before generating — Kling 3.0 unlimited-window status drifts; check `CREATIVE_STACK.md` §1b or `higgsfield model list`. For a premium hero clip that needs native audio/dialogue, the Gemini Ultra Veo 3.1 web lane (browser-only, zero Higgsfield credits) is the escalation path — see `CREATIVE_STACK.md` §5.
- [ ] Negative-prompt boilerplate included

## Raw prompt block

```
Generate a {{aspect_ratio}} looping motion video, {{duration}}, for {{project}}.

CONTENT ANGLE THIS LOOP SUPPORTS (verbatim from source, do not paraphrase):
"{{angle}}"

DESIGN SYSTEM: {{palette}}
[paste the matching palette block from below; delete the other]

MOTION TYPE: {{motion_type}}
CAMERA: {{camera}}
LOOP SEAM: {{loop_seam}}
SOURCE STILL (blank if pure text-to-video): {{source_still}}

Composition: ambient, not narrative — this loop sits behind text or plays on repeat, it does
not tell a beginning-middle-end story. Motion should be slow and hypnotic, not attention-
grabbing; the content in front of it (headline, caption) is the point, not the loop itself.
No on-screen text baked in unless explicitly required.

NEGATIVE PROMPT: {{negative_prompt}}, visible loop seam/jump-cut, camera shake, fast motion,
strobing, flashing, motion blur artifacts, text baked into frame
```

## Palette blocks

**CLAY** (paste into `{{palette}}` when `{{project}}` = `abdur-ai`):

```
Background #0B0A08, surface panel #161310, single accent #D97757 used only on the moving
element or one highlight, ambient text #F2EDE6 / #948B7D if any lettering is visually part
of the scene (e.g. a terminal window in the background, not overlay copy).
Mood: warm editorial dark, operator-diary — think a dim desk lamp over a terminal at 2am,
not a glossy product-launch render.
```

**SIGNAL NOIR** (paste into `{{palette}}` when `{{project}}` = `mnemix`):

```
Background #09090b (panels step to #0c0c0e / #111113 / #161618), signal accent cyan #22d3ee
(primary moving element), violet #c9a8ff (secondary highlight, sparing), rose #fb7185 used
only for a rare alert-state pulse, never as the base motion color.
Mood: technical, precise, dark product UI. NeuralSphere motif (rotating neural-network
sphere, nodes connected by thin cyan/violet lines) is the default subject unless the brief
calls for something else. Zero generic-AI imagery — no glowing brain, no circuit board.
```

## Worked examples

### CLAY — abdur.ai (real angle: `content/posts/the-night-the-doctrine-failed.mdx`, Reels/Shorts B-roll)

```
Generate a 9:16 looping motion video, 4s, for abdur-ai.

CONTENT ANGLE THIS LOOP SUPPORTS (verbatim from source, do not paraphrase):
"Every gate returned green. None of them were real. A 75% false-close rate."

DESIGN SYSTEM: CLAY
Background #0B0A08, surface panel #161310, single accent #D97757 used only on the moving
element or one highlight, ambient text #F2EDE6 / #948B7D if any lettering is visually part
of the scene (e.g. a terminal window in the background, not overlay copy).
Mood: warm editorial dark, operator-diary — think a dim desk lamp over a terminal at 2am,
not a glossy product-launch render.

MOTION TYPE: subtle-pulse — a terminal cursor blinking in #D97757 against a dim, mostly-
static log-scroll background
CAMERA: static
LOOP SEAM: must-be-seamless
SOURCE STILL: (none — pure text-to-video)

Composition: ambient, not narrative — this loop sits behind Reels/Shorts overlay text, it
does not tell a beginning-middle-end story. Motion should be slow and hypnotic, not
attention-grabbing. No on-screen text baked in — the hook and caption go on as an overlay
in the edit tool.

NEGATIVE PROMPT: generic AI imagery, glowing brain, robot handshake, stock circuit board,
motivational-poster gradient, generic corporate stock photo people, fake "AI" sparkle icons,
watermarks, logo distortion, misspelled or garbled text, warped hands, extra fingers,
low-contrast text-on-background, neon rainbow gradient not in the named palette, off-brand
fonts, stray drop shadows, visible loop seam/jump-cut, camera shake, fast motion, strobing,
flashing, motion blur artifacts, text baked into frame
```

### SIGNAL NOIR — Mnemix (real angle: canonical positioning — "memory + enrichment layer for AI agents"; site hero loop)

```
Generate a 1:1 looping motion video, 8s, for mnemix.

CONTENT ANGLE THIS LOOP SUPPORTS (verbatim from source, do not paraphrase):
"Mnemix is the memory and enrichment layer for AI agents. Voice is the wedge, not the full
product identity."

DESIGN SYSTEM: SIGNAL NOIR
Background #09090b (panels step to #0c0c0e / #111113 / #161618), signal accent cyan #22d3ee
(primary moving element), violet #c9a8ff (secondary highlight, sparing), rose #fb7185 used
only for a rare alert-state pulse, never as the base motion color.
Mood: technical, precise, dark product UI. NeuralSphere motif (rotating neural-network
sphere, nodes connected by thin cyan/violet lines) is the default subject unless the brief
calls for something else. Zero generic-AI imagery — no glowing brain, no circuit board.

MOTION TYPE: slow-rotate — the NeuralSphere motif rotating on a fixed axis, nodes pulsing
cyan/violet at irregular intervals to suggest live recall, not decoration
CAMERA: static
LOOP SEAM: must-be-seamless
SOURCE STILL: (none — pure text-to-video; reuse existing NeuralSphere component reference
in `mnemix/web/src/components/NeuralSphere.jsx` for node-density/line-style guidance if
regenerating rather than reusing the live WebGL asset)

Composition: ambient, not narrative — this loop sits behind the site hero headline, it does
not tell a beginning-middle-end story. Motion should be slow and hypnotic, not attention-
grabbing. No on-screen text baked in — hero copy is a separate layer in the site.

NEGATIVE PROMPT: generic AI imagery, glowing brain, robot handshake, stock circuit board,
motivational-poster gradient, generic corporate stock photo people, fake "AI" sparkle icons,
watermarks, logo distortion, misspelled or garbled text, warped hands, extra fingers,
low-contrast text-on-background, neon rainbow gradient not in the named palette, off-brand
fonts, stray drop shadows, visible loop seam/jump-cut, camera shake, fast motion, strobing,
flashing, motion blur artifacts, text baked into frame
```

## Output routing

File the filled prompt + generated asset reference in `design/motion-briefs/`, named after the slug of the draft or page it supports. If the loop replaces or updates the live NeuralSphere hero asset, also note the R2/`mnemix-assets` path per the Mnemix living-brain asset convention before treating it as shipped.
