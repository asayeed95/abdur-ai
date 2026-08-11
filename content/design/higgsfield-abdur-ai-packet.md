# Higgsfield Design-Learning Packet — abdur.ai (Clay system)

**What this file is for:** teaching any agent how to prompt Higgsfield so the output is visually indistinguishable from abdur.ai's locked design system, on the first generation, without a human re-explaining the brand every time. Read this before calling any Higgsfield generation tool for abdur.ai content.

**Who reads this:** the marketing/content lane, agents working `content/design/*-briefs/`, anyone filling `content/design/higgsfield-prompts/`.

---

## 0. Hard boundary — this is Clay, not Signal Noir

abdur.ai runs the **Clay** system below. Mnemix product content runs a separate, incompatible system — **Signal Noir** (NeuralSphere motif, `#09090b` background, Geist Mono, cyan `#22d3ee` + violet `#c9a8ff`). They do not blend. If a prompt is for Mnemix (the product), stop and use the Mnemix visual spec instead — never carry clay-orange or Playfair into a Mnemix asset, and never carry cyan/violet or NeuralSphere motifs into an abdur.ai asset. When in doubt about which system a piece belongs to: abdur.ai = the founder/operator diary (TLDR posts, blog, ship log, About/Now pages); Mnemix = the product's own marketing surfaces. This packet only covers the former.

---

## 1. Visual DNA — encode this in every abdur.ai prompt

**Palette (non-negotiable, matches `tailwind.config.ts` — do not invent a new accent color):**

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0B0A08` | primary background, almost always flat, almost never a gradient |
| `surface` | `#161310` | cards, tiles, texture layers, anything one step lighter than bg |
| `clay` (the one accent) | `#D97757` | the single accent color — rules, eyebrows, one highlighted element per image |
| `text` | `#F2EDE6` | headline color |
| `muted` | `#948B7D` | captions, mono metadata, secondary text |

Supporting tokens that exist in the codebase but are reserved for UI state, not decoration in generated visuals: `border #2C2620`, `border-2 #4A3D26`, `gold #F5C451`, `good #6FCF97`. Don't reach for these to "add variety" — one accent color per image is the rule, same as the voice rule "one clean idea at a time."

**Typography:**
- **Playfair Display** — every headline, every large-type moment. Serif, editorial, magazine-weight. This is the single most identifying visual signal of abdur.ai — if a generated image has a sans-serif or slab headline, it reads as generic SaaS and fails.
- **Inter** — body copy, when a prompt needs paragraph-length text rendered (rare; most Higgsfield outputs are headline + caption, not body text).
- **JetBrains Mono** — captions, eyebrows, metadata, slide numbers, timestamps, the abdur.ai wordmark treatment. Always lowercase or letter-spaced small-caps, always the "chrome" of the image, never the hero text.

**Mood — say this explicitly in every prompt:** editorial, operator-diary, a page out of a serious print magazine about engineering, not a tech-startup landing page. Think a New Yorker or Stripe-press-style essay layout, not a Dribbble SaaS hero. Warm, dark, dry — brass and amber undertones, not blue-black cyberpunk. Restrained composition: one focal idea, generous negative space, no clutter.

**Texture, when used:** faint paper-grain or film-grain noise (2–4% opacity) is the only texture that belongs in this system. No glossy gradients, no glass, no bokeh, no particle fields.

---

## 2. The hard rule — no orphan images

Every Higgsfield generation for abdur.ai must **name the exact post, TLDR, blog entry, or site narrative it supports** before the prompt is written. This mirrors the content OS's core rule (`content/README.md`): "no post exists without a source" — the visual equivalent is "no image exists without a destination."

Concretely:

1. **Before generating**, write (or confirm) a brief in `content/design/image-briefs/` (single image), `content/design/carousel-briefs/` (multi-tile set), or `content/design/motion-briefs/` (3D/video) naming the post slug or site section it's for.
2. **After generating**, record the executed prompt + model + output reference in `content/design/higgsfield-prompts/<date>-<slug>-<surface>.md` — this is the durable trace, same role as a `source:` field on a written draft.
3. **If a generation doesn't map to a real post/TLDR/blog/narrative**, don't run it. A pretty image with no destination is a distribution leak, not content — same failure mode as writing a draft nobody approved.
4. Check `content/ledger/` and existing files under `public/blog/<slug>/` before regenerating — don't burn a second generation on an asset that already exists for that post.
5. Final production assets land where the site/social pipeline actually reads them: `public/blog/<slug>/cover.jpg` (site OG covers, per the existing convention in `CLAUDE.md`) or `content/distribution/<slug>/` (social-ready exports for the Blotato pipeline).

---

## 3. Model cheat sheet (Higgsfield)

| Need | Tool / model |
|---|---|
| Typographic image, headline + caption (most abdur.ai visuals) | `generate_image` → GPT Image 2 (best text rendering) |
| Texture-only background tile, no text | `generate_image` → GPT Image 2 |
| 3D object / metaphor | `generate_3d` (`multi_image_to_3d`) |
| Turntable / loop motion on a 3D object | `motion_control` or `animation_actions` on the generated mesh |
| Short vertical teaser video | `generate_video` → Seedance 2.0 |
| Same asset, new aspect ratio | `reframe` — don't regenerate from scratch, it drifts off-brand |
| Final-pass sharpening before publish | `upscale_image` |

---

## 4. Prompt recipes — one per surface, each grounded in a real post

### Recipe A — TLDR / X-thread hero tile (1:1 or 4:5)
**Content angle it serves:** *"The night the doctrine failed"* (flagship postmortem — 75% false-close rate, five audit rounds, one cross-verifier, every gate green, none of them real).

```
Editorial dark-mode typographic poster, 1:1 square. Background solid #0B0A08
with a very faint warm paper-grain noise texture — no gradients, no glow.
Centered composition, left-aligned text block at roughly 80% canvas width:
large Playfair Display serif headline in #F2EDE6, two lines —
"Every gate returned green." / "None of them were real."
Below it, a thin horizontal rule in #2C2620, then a caption line in
JetBrains Mono, lowercase, color #948B7D: "75% false-close rate — five
audit rounds, one cross-verifier, zero caught."
A single flat #D97757 bar, ~4px wide, runs the full height of the left
edge like a book spine or margin mark.
No icons, no illustration, no photography, no 3D render, no people, no
abstract network/particle graphics. Reads like a page torn from a serious
print magazine about engineering failure, not a startup slide.
```

### Recipe B — Blog hero / OG cover (1200×630)
**Content angle it serves:** same flagship post — this is the literal spec already locked for `public/blog/the-night-the-doctrine-failed/cover.jpg` (see project `CLAUDE.md` §4), reproduced here as the reusable Higgsfield version of it.

```
1200x630px Open Graph cover. Flat solid background #0B0A08, no vignette,
film grain at ~3% opacity only. Large Playfair Display headline in #F2EDE6,
two stacked lines, left-aligned with a 64px margin:
"Every gate returned green." / "None of them were real."
Small mono eyebrow above the headline in #D97757, all-caps, letter-spaced:
"POSTMORTEM — AGENT-DRIVEN REPO CLEANUP"
Bottom-right corner: small JetBrains Mono wordmark "abdur.ai" in #948B7D.
Nothing else on the canvas — no icons, no photography, no decoration.
This is a title card, not an illustration.
```

### Recipe C — Site content graphic (texture behind an evergreen module)
**Content angle it serves:** the Ship Log module on the homepage (evergreen operator-diary narrative, not tied to one post) — a background texture that sits behind the daily ship entries.

```
Seamless tileable texture, 1024x1024, base color #161310 (surface).
Extremely subtle irregular grain like uncoated paper or fine linen — no
visible repeat seams. Occasional near-invisible flecks in #2C2620, one
faint diagonal scratch in #4A3D26 at low opacity crossing the frame.
No gradient, no vignette, no directional light, no logo, no text.
This is a texture layer meant to sit behind UI — it must read as almost
flat at small sizes and only reveal grain up close.
```

### Recipe D — 3D motion idea
**Content angle it serves:** *"The latency objection for voice-AI memory is a dead argument"* (Mnemix warm path, sub-300ms — "the warm path fits inside silence you're already paying for"). This is abdur.ai *editorial coverage of* the Mnemix idea, so it stays in Clay, not Signal Noir.

```
[3D object, generate_3d] A minimalist analog stopwatch, matte editorial-
illustration finish (flat, woodcut-like — no chrome, no glass reflection,
no photoreal metal). Case in #161310, a single #D97757 second hand, face
plate in #F2EDE6 with no numerals — just two hairline tick marks 300
milliseconds apart, highlighted in clay. Silhouette must read clearly from
any angle for turntable animation.

[motion, motion_control] Orbit the object slowly 360° over 6 seconds; the
clay-orange second hand sweeps once through the highlighted 300ms gap and
settles. Used as a loop under the line "the warm path fits inside silence
you're already paying for."
```

### Recipe E — Short video teaser (9:16)
**Content angle it serves:** *"Shipping solo with AI: who owns the architecture when the AI writes the code"* — X/IG short-form teaser driving to the post.

```
9:16 vertical, 6 seconds, solid background #0B0A08, hard fades only (no
motion-graphics transitions, no camera movement, no particles/glow).
0–2s: Playfair Display text fades in, centered, #F2EDE6:
  "The AI wrote the code."
2–4s: crossfades to #D97757: "I own every decision."
4–6s: small JetBrains Mono line fades in below, #948B7D:
  "abdur.ai — who owns the architecture when AI writes the code"
No music sting, no stock footage. This is a title-card video, like a
print pull-quote in motion, not a template.
```

### Recipe F — Image batch / carousel set (5 tiles, consistent brand)
**Content angle it serves:** *"Cross-video pattern detection: the YouTube signal everyone ignores"* (Retention Lab) — an IG carousel / X-thread walking the retention-curve idea across tiles.

```
Generate a 5-tile consistent set, 4:5 each, identical shared style: flat
#0B0A08 background, Playfair headline top-left in #F2EDE6, thin #D97757
rule beneath it, JetBrains Mono slide number bottom-right in #948B7D
("1/5" through "5/5"). Keep margin, kerning, and baseline identical across
all five tiles — this is a slide deck, not five unrelated posters.

Tile 1 headline: "Retention curves are gold."
Tile 2 headline: "And trapped per-video."
Tile 3: a single flat line-chart glyph in #D97757 on #161310, no axis
  labels — one retention curve. No headline text on this tile.
Tile 4: three overlaid flat line-chart glyphs (#D97757, #948B7D, and
  #F2EDE6 at reduced opacity) — the same structural drop repeating across
  videos. No headline text on this tile.
Tile 5 headline: "Same mistake, different video, nobody notices."
```

---

## 5. Anti-generic-AI-imagery checklist (the visual version of banned phrases)

Reject a generation and rewrite the prompt if it produces any of these:

- Neon blue/violet gradient soup, glowing orbs, cyberpunk grid lines — that's Mnemix's Signal Noir, not Clay. Never here.
- Glassmorphism dashboards, floating glass panels, fake-depth drop shadows/bevels.
- Stock-photo humans (typing on a laptop, shaking hands, pointing at a whiteboard, lightbulb-over-head).
- Generic "robot brain" or circuit-board-face clipart, or any literal robot as the subject.
- Confetti, checkmarks, rocket-ship, or other launch-cliché iconography.
- More than one accent color doing decorative work in a single image — clay `#D97757` is the one accent.
- Any rendered text inside the image making a claim the post doesn't actually make — the same "trace to real work" and banned-phrase rules from `content/voice/banned-phrases.md` apply to text baked into an image, not just to written copy.
- Cluttered, multi-focal compositions. If the image needs a caption to explain what it's about, the composition failed — one clear idea, generous negative space.

---

## 6. Copy-paste prompt template (for a post not yet covered above)

```
[SURFACE]: <TLDR tile / blog hero / site graphic / 3D motion / short video / carousel>
[POST/NARRATIVE IT SUPPORTS]: <exact slug from content/posts/, or "evergreen — <site section>">

Background: flat #0B0A08 (or #161310 for a card/tile surface). No gradient
unless explicitly specified. Grain/noise at 2-4% opacity only, if any.

Headline (Playfair Display, #F2EDE6): "<the real line from the post title,
dek, or a direct quote — never an invented tagline>"

Caption/eyebrow (JetBrains Mono, lowercase or letter-spaced caps, #948B7D
or #D97757): "<a real fact/number from the post, or omit>"

Accent: one use of #D97757 — a rule, a highlighted mark, a single glyph.
Nothing else gets the accent color.

Composition: one focal idea, generous negative space, editorial/print-
magazine mood, not a startup landing page.

Explicitly exclude: gradients, glow, glass, particles, stock photography,
robots/circuit clipart, more than one accent color, cyberpunk/neon palette.
```

Before running it, save the brief to the matching `content/design/*-briefs/` folder and, after generation, log the executed prompt + output path to `content/design/higgsfield-prompts/`. That log entry is the receipt — same discipline as a sourced draft.
