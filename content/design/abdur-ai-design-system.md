# abdur.ai Design System — Clay

Every visual that carries the abdur.ai name — a TLDR image, a blog hero, an inline diagram, an X post image — comes from this one system. It's the same palette and type as the live site (`tailwind.config.ts`), extended with the rules a designer or an image-gen prompt needs that a color token alone can't carry.

**Clay is not Mnemix's visual system.** Mnemix runs "Signal Noir" — `#09090b`, cyan `#22d3ee`, violet `#c9a8ff`, NeuralSphere motif. abdur.ai is warm, editorial, paper-and-ink-adjacent. Don't cross them. If a brief is for Mnemix, it belongs in `mnemix-design-system.md`, not here.

---

## 1. Palette — Clay tokens (exact, do not invent new ones)

These are locked in `tailwind.config.ts`. Use the hex values directly in every brief, prompt, and export — never approximate, never introduce a new color because a composition "needs a pop."

### Core five

| Token | Hex | Role |
|---|---|---|
| `bg` | `#0B0A08` | Base background. Near-black, warmed — not true black, not navy. |
| `surface` | `#161310` | Card / panel background, one step up from `bg`. |
| `clay` | `#D97757` | The accent. Burnt-orange / terracotta. One accent per composition — a number, a link, a single highlighted word. Never a wash, never a background fill. |
| `text` | `#F2EDE6` | Primary text. Warm off-white, not pure `#FFFFFF`. |
| `muted` | `#948B7D` | Secondary text — captions, labels, timestamps, the small print that makes it feel like a real log. |

### Extended (same system — already live in `tailwind.config.ts`, use before reaching for anything new)

| Token | Hex | Role |
|---|---|---|
| `bg-2` | `#0E0C0A` | Secondary background — subtle depth against `bg` without a hard edge. |
| `surface-2` | `#1C1813` | Elevated card / hover state on `surface`. |
| `border` | `#2C2620` | Hairline dividers, card edges. |
| `border-2` | `#4A3D26` | Stronger divider — section breaks, table rules. |
| `text-soft` | `#C9C0B2` | Between `text` and `muted` — body copy that isn't the headline. |
| `muted-2` / `muted-3` / `muted-4` | `#7E766A` / `#7A7264` / `#6A6256` | Graduated de-emphasis — use for metadata stacks (byline, date, reading time) where you need more than one step of fade. |
| `gold` | `#F5C451` | Second accent, sparing. Reserve for flags: "flagship," "pinned," a badge on a post — never the main highlight color. |
| `good` / `good-2` / `good-3` | `#6FCF97` / `#7FB88A` / `#26352B` | Status green — tests passed, shipped, verified. Only appears next to a real pass/fail state, never decoratively. |

**Rule:** `clay` and `gold` never appear in the same composition doing the same job. Pick one accent per image. If you're tempted to add a gradient between them, don't — Clay is flat color, not a blend.

---

## 2. Type

| Font | Role | Loaded via |
|---|---|---|
| **Playfair Display** | Display serif — headlines, pull quotes, the big number, anything that should read like a diary entry title. | `next/font/google` in `app/layout.tsx` |
| **Inter** | Body — paragraphs, captions, UI labels, anything meant to be read in full. | `next/font/google` in `app/layout.tsx` |
| **JetBrains Mono** | Code, file paths, commands, terminal output, and any number that came out of a command (a percentage, a latency figure, a count). Mono is the visual signal for "this is a receipt, not marketing copy." | `next/font/google` in `app/layout.tsx` |

**Rule of thumb for image composition:** Playfair for the claim, Inter for the explanation, Mono for the proof. A well-built Clay image usually uses at least two of the three — a headline in Playfair sitting above a stat or file path in Mono is the signature move.

---

## 3. The editorial / operator-diary feel

Clay is meant to look like a page torn out of an actual build log — not a landing-page hero generator. That comes from restraint, not decoration.

- **Mostly dark, mostly empty.** `bg` or `bg-2` covers 85–90% of the frame. One accent color, used once. Generous margin — Clay compositions breathe, they don't fill the canvas.
- **Typography carries the image.** The words are the artwork. Icons and illustration are supporting, not load-bearing — most Clay images have zero illustration and are still finished pieces.
- **One real artifact per image.** A real diff line, a real terminal command, a real number from a real post, a real date. This is the same rule as the content voice: every visual traces to real work. A Clay image with no real artifact in it is a stock photo with better colors — still wrong.
- **Sharp corners, not soft-SaaS.** Square or near-square corners on cards, dividers as hairlines (`border` / `border-2`), not pill-shaped badges and drop shadows. This is a diary, not a dashboard demo.
- **No stock imagery, no generic AI-brain art.** No glowing neural networks, no circuit-board textures, no isometric people pointing at holographic screens, no abstract gradient blobs. If a visual could illustrate any AI company's blog post, it's wrong for this system — rebuild it around the specific fact it's supposed to carry.
- **No emoji as design elements.** Emoji in body copy is a voice violation (`voice/banned-phrases.md`); the same discipline applies to imagery — no emoji stand-ins for icons.

---

## 4. Where this applies — surface by surface

Every surface below inherits the palette, type, and editorial rules above. What changes per surface is dimensions and which real artifact goes in the frame.

### TLDR post images

Paired 1:1 with a post in `content/posts/*.mdx` — one TLDR image per post, built from that post's real hook.

- **Dimensions:** `1200×630` — matches the site's existing `public/og-default.jpg` convention; also the standard OG/Twitter-card ratio, so the same export works as the post's social preview.
- **Content-angle rule:** pull directly from the post's own `dek` or opening claim. Example, grounded in a real published post — `the-night-the-doctrine-failed.mdx` carries the dek *"Every gate returned green. None of them were real."* and the frontmatter fact *75% false-close rate.* A correct TLDR image for that post is the dek in Playfair over the `75%` figure in JetBrains Mono, on `bg`, one `clay` rule beneath it. Nothing generic — if the image would still make sense bolted onto a different post, it's wrong.
- **Layout:** headline (Playfair, `text`) top-third, the one hard number or artifact (Mono, `clay` or `gold`) center, `muted` byline/date bottom-third. No photo.

### Blog hero images

Sits at the top of the MDX post itself and in `content/distribution/<slug>/` for the post's own distribution kit. More room than a TLDR card — this is where a real mechanism diagram earns its place.

- **Dimensions:** `1600×900` (16:9) for the in-post header; export a `1200×630` crop alongside it for any surface that reuses the hero as the OG image.
- **Content-angle rule:** if the post's frontmatter carries `patterns` (real posts do — e.g. `P-008 Audit vs class-sweep dichotomy`, `P-011 Potemkin verification`), the hero can visualize that pattern id as a small Mono chip row under the headline. That's a real artifact from the post, not decoration.
- **Layout:** same type hierarchy as the TLDR image, with more negative space and room for one supporting diagram element (a simple flow of 3–4 labeled boxes in `surface` / `border`, connected by thin `border-2` lines) if the post's mechanism is genuinely a flow. Don't add a diagram just to fill space — an empty frame with a strong headline beats a diagram that isn't carrying information.

### Site content graphics

Inline diagrams inside a post body, and thumbnail cards on the `/aitldr` feed itself.

- **Dimensions:** feed-card thumbnails at `800×450`; inline diagrams sized to the post's prose column (`max-w-prose`, 65ch) so they don't force horizontal scroll — export at 2x for retina, cap display width around `760px`.
- **Content-angle rule:** these exist to make one mechanism legible that the prose already describes in words — a before/after, a sequence, a small state table. If a paragraph explains it fully without the image, don't make the image; if the image would need its own explanation, it's too complex — simplify it or split it into two.
- **Style:** flat boxes on `surface`/`surface-2`, `border`/`border-2` hairlines, `clay` for the one element under discussion, `good` only next to an actual pass/fail state (e.g., a real test result being described in the post). No 3D, no drop shadow, no glow.

### X images for @abdur_sayeed

The single most-used surface — most X posts in Abdur's voice are one concrete claim plus the mechanism (`voice/abdur-voice.md` §Structure). The image is the visual version of that same rule: one real number or one real line, big.

- **Dimensions:** `1600×900` (16:9 — X's single-image display ratio) for standalone posts; `1200×1200` square only when the post is part of a Blotato-scheduled carousel and square keeps every panel consistent.
- **Content-angle rule:** this is the hook, not a summary. Take the single sharpest sentence or number from the draft — the same sentence that would open an X thread — and put only that on the frame. Example, grounded in the real voice spec's own sample hook: *"100% recall in tests, ~20% in prod, zero errors."* One line, Playfair or Mono depending on whether it reads as prose or as data, `clay` underline or bracket, nothing else on the canvas.
- **Layout:** almost entirely negative space. `bg`, the one line of type, an optional `muted` footer with the handle or a one-word source tag (`repo`, `postmortem`, `demo`). No logo lockup competing with the claim — the claim is the whole image.

---

## 5. The one rule that overrides all of the above

**Every visual maps to a specific content angle before it gets made.** Not "an image for the Mnemix post" — *this* fact, from *this* post, for *this* channel. If you can't fill in the four fields below, stop and go find the real artifact first; don't generate a placeholder and hope it reads as specific.

```
source:    <the post / commit / draft this image illustrates — a real path>
angle:     <the one claim or number this image carries, verbatim from the source>
surface:   <TLDR | blog-hero | site-graphic | x-image>
artifact:  <the specific real thing in the frame — a stat, a diff, a file path, a date>
```

This is the same discipline as `content/voice/abdur-voice.md` §"the test before you ship a draft," applied to imagery instead of copy. A Clay image with no real artifact behind it is exactly as wrong as a post with no source.

---

## 6. Brief format — `image-briefs/`, `carousel-briefs/`, `motion-briefs/`

Every file dropped in `content/design/image-briefs/` (or `carousel-briefs/`, `motion-briefs/`) should carry this frontmatter so a Higgsfield prompt or a designer can act on it without asking questions:

```yaml
---
source: content/posts/the-night-the-doctrine-failed.mdx
surface: tldr        # tldr | blog-hero | site-graphic | x-image
dims: 1200x630
headline: "Every gate returned green. None of them were real."
artifact: "75% false-close rate"
artifact_font: mono   # playfair | inter | mono
accent: clay          # clay | gold — pick one
palette: [bg, text, clay, muted]
---

Brief notes: headline top-third in Playfair on #F2EDE6, artifact stat
center in JetBrains Mono on #D97757, byline "Abdur Rahman Sayeed · abdur.ai"
bottom-third in #948B7D. Background #0B0A08, no photo, no illustration.
```

### Higgsfield / image-model prompting notes

Diffusion models are unreliable at rendering exact words and numbers — and exact words and numbers are the entire point of a Clay image (§3, §5). Two working patterns:

1. **Typography-led compositions (TLDR, X images, most blog heroes): render the text yourself, don't ask the model to.** Build these as HTML/CSS (or the `dataviz`/`artifact-design` skill's approach) with the real hex tokens and Google Fonts (`Playfair Display`, `Inter`, `JetBrains Mono`) hard-coded, then export to PNG. This guarantees the words are correct and the colors are exact — the two things a Higgsfield generation can't guarantee.
2. **Photographic or textural elements only: generate with Higgsfield, then composite text on top.** If a brief genuinely needs a photographic or generative background element (a texture, a soft depth-of-field backdrop), generate *only that background* with the Clay hex codes named explicitly in the prompt (`background #0B0A08, warm near-black, no other colors`), then lay the real headline/artifact text over it in the HTML/CSS pass. Never let the model generate the words.

When a prompt does need model-generated imagery, state explicitly in the prompt what to avoid, since the default diffusion aesthetic drifts straight into the imagery this system bans: *"no glowing neural network, no circuit board, no holographic UI, no isometric tech illustration, no stock photography — flat, dark, warm, editorial, restrained."*

---

## 7. Don't

- Don't invent a new color or font because a composition "needs something." Every token you need is in §1.
- Don't use Mnemix's Signal Noir palette (`#09090b`, cyan `#22d3ee`, violet `#c9a8ff`) on anything carrying the abdur.ai name — separate system, verified separately locked.
- Don't put a number or claim on a Clay image that doesn't trace to a real post, commit, or draft. Same rule as copy: no receipt, no ship.
- Don't reach for stock photography, glowing-brain art, circuit textures, or generic AI-SaaS illustration — see §3 and the Higgsfield note in §6.
- Don't round every corner or add drop shadows — this is a diary, not a dashboard.
- Don't use emoji as visual elements.
- Don't build a "generic Mnemix post image" or "generic abdur.ai post image" template and reuse it across posts — §5 exists specifically to prevent that.
