# Mnemix Design System — Signal Noir

Practical reference for every Mnemix visual: the site (`mnemix-site-v2`), IG/FB carousels, X images, and motion. If a visual doesn't come from this system, it's off-brand — fix it, don't ship it.

Source of truth for the tokens below: `~/projects/mnemix-site-v2/src/styles.css` (the running v2 site, dev on `:5273`). This doc restates those tokens for content work — if the two ever disagree, the CSS file wins and this doc is stale.

**Positioning this system serves** (do not drift from these on any visual with copy):
- Mnemix is the **memory + enrichment layer for AI agents**. Voice is the wedge, not the whole identity — don't caption every asset like a voice-only product.
- We don't build agents. Customers build voice/chat/workflow agents and call Mnemix.
- Enrichment = **Trestle + Twilio Lookup**. No other vendor names in copy.
- Latency claim, verbatim only: **"designed for sub-300ms voice recall."** Never a number pulled from nowhere ("47ms," "10x faster," etc.).
- Pricing: Hobby **$0**; paid tiers **"Contact sales."** No invented quota numbers.
- Closer, exact string when a CTA line is needed: **"Choose Mnemix as your agent memory layer."** + `mnemix.ai`.

---

## 1. Palette

Two modes exist in the codebase (`:root[data-theme="dark"]` / `[data-theme="light"]`). Dark is the default and the one nearly all content assets use — the site defaults to dark, and every carousel/X asset produced so far is dark. Use light only if a specific placement genuinely needs a white background (rare).

### Dark (default — use this for content)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#09090b` | Canvas / slide background |
| `--bg-1` | `#0c0c0e` | Slightly raised panel |
| `--bg-2` | `#111113` | Card / code-block background |
| `--bg-3` | `#161618` | Nested panel |
| `--border` | `rgba(255,255,255,0.08)` | Hairline dividers, card edges |
| `--border-2` | `rgba(255,255,255,0.14)` | Emphasized border (hover, active) |
| `--ink` | `#fafafa` | Primary text, headlines |
| `--ink-2` | `#a1a1aa` | Body copy, lead paragraphs |
| `--ink-3` | `#71717a` | Captions, footers, muted labels |
| `--ink-4` | `#52525b` | Lowest-emphasis text (timestamps, index counters) |
| `--cyan` | `#22d3ee` | Primary accent — eyebrows, links, the "signal" color |
| `--violet` | `#c9a8ff` | Secondary accent — peak/conscious state, contrast highlight |
| `--emerald` | `#34d399` | Success / verified state only |
| `--amber` | `#f59e0b` | Caution / honest-scope callouts |
| `--rose` | `#fb7185` | Error / "the wall" / what's broken |
| `--cyan-dim` | `rgba(34,211,238,0.1)` | Cyan wash background (pills, badges) |
| `--violet-dim` | `rgba(201,168,255,0.1)` | Violet wash background |

**Accent discipline:** cyan and violet are used *sparingly* in the real CSS — one eyebrow, one highlighted word, one glow, not a rainbow. Emerald/amber/rose are semantic (verified / caution / broken), not decorative. If a draft has three accent colors fighting on one slide, cut two.

### Light (rare — only for placements that require a white canvas)

| Token | Hex |
|---|---|
| `--bg` | `#ffffff` |
| `--bg-1` | `#f7f7f8` |
| `--ink` | `#09090b` |
| `--ink-2` | `#3f3f46` |
| `--cyan` | `#0891b2` |
| `--violet` | `#7c3aed` |

Light-mode accents are darker/deeper (`#0891b2` cyan, `#7c3aed` violet) — do not reuse the dark-mode cyan/violet hexes on a white background, they were tuned separately for contrast.

### What's NOT in the palette

`#39ff7a` (neon green), `#0a0e14`/`#121822` (blue-black panel grays), and Inter/SF Mono do not belong to Signal Noir. They show up in one legacy asset (`docs/content/carousel/deck.html`, pre-lock) — that deck predates the v2 system and is a cautionary example, not a template. Never pull colors from it.

---

## 2. Typography

- **Sans (body, headlines):** `Manrope` — `-apple-system, "Helvetica Neue", system-ui, sans-serif` fallback stack.
- **Mono (labels, code, kickers, footers):** `Geist Mono` — `ui-monospace, "SF Mono", Menlo, monospace` fallback stack.
- Load both via Google Fonts when generating standalone HTML for capture: `family=Geist+Mono:wght@400;500&family=Manrope:wght@400;600;700`.

Real scale from the site (`h1/h2/h3` share `font-weight: 600; letter-spacing: -0.025em; line-height: 1.05`):

| Element | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|
| `h1` | `clamp(2.5rem, 5.4vw, 3.85rem)` | 600 | `-0.025em` | headline |
| `h2` | `clamp(1.9rem, 3.6vw, 2.7rem)` | 600 | `-0.025em` | section head |
| `h3` | `clamp(1.15rem, 1.6vw, 1.4rem)` | 600 | `-0.02em` | subhead |
| `.eyebrow` / kicker | 11px | 500 | `0.28em`, uppercase | mono, cyan, the `// section-name` label |
| body | inherit | 400 | `-0.011em` | sans, `--ink-2` |

Carousel decks scale these up for 1080×1350 canvases (the working deck uses `h-xl 108px / h-lg 84px / h-md 66px`, kicker 25px tracked at `.26em`) — same ratios, bigger absolute numbers because the canvas is bigger than a browser viewport. Keep the *relationship* (kicker: tiny, tracked, mono, cyan; h1: huge, tight tracking, sans, 600 weight) even when you scale the numbers.

---

## 3. The NeuralSphere motif

NeuralSphere (`mnemix-site-v2/src/components/NeuralSphere.jsx`, code-named "Living Brain" v3) is the one signature visual mark. It is not a generic glowing-particle sphere — it's a specific, built thing with a real state machine, and content should represent what it actually does, not a generic AI-swirl.

**What it is technically:**
- A three.js wireframe node/edge mesh on a sphere, rendered with `UnrealBloomPass` for glow.
- Three size variants tuned by use: `hero` (800 nodes / 320 edge-nodes / 80 signal pulses), `logo` (380/150/36), `loader` (220/90/22).
- A five-phase breathing cycle, looped forever: **rest** (dim ghost-mesh, `k=0`) → **awaken** (eased brighten) → **conscious** (peak: hubs glow, great-circle arcs light up, signal pulses race along "highway" edges) → **return** (eased dim) → **rest again**. Default full cycle ≈ 10 seconds at `cycleSpeed=1`.
- Default shader colors: `colorRest="#7cf5ff"` (calm cyan, close to but not identical to the UI token `--cyan #22d3ee` — the component tunes its own rest color for the glow render) and `colorPeak="#c9a8ff"` (violet, matches `--violet` exactly).
- Slow autorotation + subtle mouse parallax (`parallax: 0.10` default).

**What it means (the content angle):** rest → awaken → conscious → return is memory recall, visualized — a system that's dormant until called, then briefly lights up with structure (nodes, arcs, signal) to answer, then goes quiet again. That maps directly to what Mnemix does on a call: silent until `/v1/recall_and_enrich` fires, then a burst of retrieved context, then back to standby. Don't caption it as "AI thinking" — caption it as recall.

**Where to use it:** hero panels, brand mark / logo container, loading states, carousel covers, X profile/header art. On a dark panel, it sits in a `--sphere-well` radial well: `radial-gradient(ellipse at center, #0c1024 0%, #08080c 72%)` (dark mode) — a slightly-navy pocket of black that the sphere floats inside, not flat `--bg`.

**How to capture it for content (the real pipeline, don't re-invent):**
1. Run the v2 site locally (`cd mnemix-site-v2 && npm run dev`, serves `:5273`).
2. There's a dedicated capture route: `sphere-solo.html` — an isolated `<NeuralSphere />` with no chrome, meant for recording.
3. Record with headed Chrome + Metal GPU (`--use-gl=angle --use-angle=metal --enable-gpu`), `deviceScaleFactor: 2`, viewport **1440×1440** (square — `recordVideo` ignores DSF, so set the real target size directly, don't rely on supersampling).
4. Capture ≥12.5s to guarantee one full ~10s breathing cycle is in frame.
5. This is the actual working script: `docs/content/voice-no-cookies/record-hd.cjs` → produces `sphere-hd.mp4` (already committed once as the animated brand asset).

Never generate a "neural sphere" from a prompt-based image/video model for the brand mark. Capture the real component. (Higgsfield/fal are fine for cinematic b-roll around it — see §6 — just not as a stand-in for the mark itself.)

---

## 4. Applying it: IG/FB carousels

**Canvas:** 1080×1350 (4:5, the IG/FB carousel standard). Render with Playwright headless-Chrome screenshotting individual `.slide` sections from a single `deck.html` — that's the existing pattern (`render.cjs` in both `docs/content/carousel/` and `docs/content/voice-no-cookies/`), don't build a new pipeline per post.

**Reference template (correct, on-brand):** `docs/content/voice-no-cookies/deck.html`. Its structure is the one to copy:
- `--bg:#09090b`, ink scale `#fafafa → #a1a1aa → #71717a → #52525b`, `--cyan:#22d3ee`, `--violet:#c9a8ff` — exact CSS-token hexes, no drift.
- Fonts loaded from Google Fonts CDN: Geist Mono (400/500) + Manrope (400/600/700).
- A near-invisible 48px grid overlay: `linear-gradient(rgba(255,255,255,.024) 1px, transparent 1px)` both axes — the same faint structure-without-noise texture the site uses.
- A `sphere-well` glow tucked in one corner (`radial-gradient(ellipse at center, #0c1024 0%, transparent 70%)`, positioned bottom-right, oversized and mostly off-canvas) — echoes the motif without needing the full 3D render on every slide.
- Slide anatomy: `◆ MNEMIX` wordmark top-left, tracked-mono `kicker` (cyan, `// the thing this slide is about`), one big `h1` claim, one `lead` paragraph (`--ink-2`, max-width ~840px so it doesn't run edge to edge), footer with handle + slide index (`01 / 03`).

**Anti-reference (legacy, off-brand — do not copy):** `docs/content/carousel/deck.html`. It predates the v2 lock: neon green `#39ff7a` accent, blue-black `#0a0e14`/`#121822` panels, Inter/SF Mono instead of Manrope/Geist Mono. It's kept in the repo as history, not as a pattern. If you're pattern-matching off an existing deck, check the CSS variables against §1 first — this one will fail that check.

**Cover slides:** may use a captured NeuralSphere frame or the `sphere-well` gradient as background art with a dark scrim gradient over it for text legibility (`linear-gradient(180deg, rgba(10,14,20,.18) 0%, rgba(10,14,20,.55) 52%, rgba(10,14,20,.96) 100%)` from the existing cover pattern) — never a flat stock-photo hero.

---

## 5. Applying it: X images (@mnemix_official)

X images are the same token system, single-card instead of multi-slide:

- Same palette, same fonts, same kicker/h1/lead hierarchy as a carousel slide — just one composition instead of seven, so the hierarchy has to do more work with less room. Lead with the kicker + one claim, not a wall of text.
- Standard X image canvas: 1600×900 (16:9, in-timeline card) for single images; reuse the 1080×1350 carousel canvas unchanged when a thread posts the same asset as a mini-carousel.
- Quote-card / code-snippet posts (the "here's the payload," "here's the bug" format already used in the legacy deck's `.code` panel) should sit on `--bg-2`/`--bg-3` with `--border` hairlines — not a separate visual language from the carousels.
- Profile/header art: NeuralSphere in its `sphere-well`, captured per §3 — this is the one asset that should look identical across the site favicon-equivalent, carousel covers, and the X profile, because it's the actual brand mark, not a themed variant of it.

---

## 6. Motion

Routing rules for anything moving (from `docs/marketing/mnemix-media-stack-rules.md` — read that file in full before a motion task, this is the summary):

| Need | Tool |
|---|---|
| Programmatic / API-first generation, broad model access | **fal.ai** (default backend) |
| Cinematic social-first clip (Reel, TikTok, hero video) | **Higgsfield** |
| Deterministic, editable, reproducible final render — captions, exact typography, product-UI video, brand finishing, aspect-ratio variants | **Remotion** |
| Live in-browser UI animation (not an exported video) | **Framer Motion** |
| Genuinely 3D scene (the NeuralSphere itself, spatial explainers) | **React Three Fiber** (already how NeuralSphere is built) |

Production order: generate exploratory shots with fal/Higgsfield → review → select → recompose/caption/brand/finish in Remotion. Don't ask a generative video model to do deterministic motion graphics Remotion does better; don't ask Remotion to invent cinematic footage it can't render.

Every generated video gets watched before it ships — `ffprobe` for technicals, `ffmpeg` frame extraction, visual review against the rubric in the media-stack doc (prompt adherence, subject consistency, motion quality, no hallucinated logos/text, platform fitness). No "looks probably fine" ships.

The NeuralSphere capture pipeline (§3) is the one motion asset that bypasses generative video entirely — it's a real WebGL component recorded directly, which is correct: don't route the actual brand mark through a generative model when the real thing renders live.

---

## 7. Voice contract (applies to every visual with copy on it)

Sound like Abdur: direct, specific, technical when it needs to be, plain English. Never robotic SaaS voice, never hype.

**Never write:** game-changer, revolutionary, cutting-edge, "the future of," "X will change everything," world-class, best-in-class, supercharge, unlock, unleash, empower, seamless, frictionless, disrupt, paradigm shift, "let's dive in," "here's the thing," "grateful/excited/thrilled to announce," "move the needle," leverage (as a verb), utilize, "blazing fast," "trusted by thousands," "studies show," "buckle up," "stop scrolling," fake thread-bait.

**Every claim traces to real work** — a repo change, a bug, a decision, a demo, a doc. No fabricated numbers, customers, benchmarks, or integrations. If a caption could sit on any SaaS landing page unchanged, it's slop — make it specific to what Mnemix actually is: the memory + enrichment layer for AI agents, voice as the wedge, Trestle + Twilio Lookup for enrichment, "designed for sub-300ms voice recall," never a fabricated latency number.

---

## 8. Quick-reference checklist

Before a Mnemix visual ships:

- [ ] Background is `#09090b` (dark mode) — not a legacy off-palette color.
- [ ] Accents are cyan `#22d3ee` / violet `#c9a8ff`, used sparingly (one eyebrow, one highlight — not a rainbow). Emerald/amber/rose only where they mean verified/caution/broken.
- [ ] Type is Manrope (body/headlines) + Geist Mono (kickers/labels/code) — no Inter, no SF Mono.
- [ ] If the NeuralSphere appears, it's a real capture (§3), not a prompted "glowing AI sphere."
- [ ] Copy passes the voice contract (§7) — no banned words, no invented numbers, no generic-SaaS lines.
- [ ] Product claims match the locks: memory + enrichment layer, voice = wedge (not the whole identity), Trestle + Twilio Lookup only, "designed for sub-300ms voice recall" verbatim, Hobby $0 / paid "Contact sales," no other vendor or pricing numbers.
- [ ] Canvas matches the placement: 1080×1350 for IG/FB carousel slides, 1600×900 for X single-image cards, 1440×1440 for NeuralSphere captures.

---

## Where the real system lives

- Tokens: `mnemix-site-v2/src/styles.css`
- NeuralSphere component: `mnemix-site-v2/src/components/NeuralSphere.jsx` (+ `NeuralGraph.jsx`, `SphereBoundary.jsx`)
- Capture route: `mnemix-site-v2/sphere-solo.html`
- On-brand carousel template: `mnemix/docs/content/voice-no-cookies/deck.html` + `render.cjs` + `record-hd.cjs`
- Legacy off-brand deck (reference only, don't copy): `mnemix/docs/content/carousel/deck.html`
- Motion routing rules (full version): `mnemix/docs/marketing/mnemix-media-stack-rules.md`
- Product locks (full version): `mnemix/CLAUDE.md` → "May 20, 2026 Canonical Override"
