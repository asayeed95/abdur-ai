# Design / Higgsfield routine — visuals that serve content

Turns **approved content** into carousels, X images, videos, site graphics, and motion assets. The hard rule: **Higgsfield never makes random pretty images. Every visual supports a named content angle and project narrative.**

## Trigger

A visual is produced when a piece of content is approved (or when a brief in `../design/*-briefs/` is greenlit). Never produce visuals for content that doesn't exist yet.

## Owner & tools

Design loop (agent or founder), driving **Higgsfield** via the `higgsfield-*` skills:
- `higgsfield-generate` — images, video, 3D, audio, motion.
- `higgsfield-product-photoshoot` / `higgsfield-marketplace-cards` — only if a product-shot context arises.
- Prompt library: `../design/higgsfield-prompts/`. Design systems: `../design/abdur-ai-design-system.md` (Clay) + `../design/mnemix-design-system.md` (Signal Noir).

## The two brand systems — never mix them

- **Mnemix → Signal Noir** (near-black #09090b, cyan #22d3ee, violet #c9a8ff, NeuralSphere, Geist Mono).
- **abdur.ai → Clay** (bg #0B0A08, clay #D97757, Playfair + Inter + JetBrains Mono, editorial).

Every Higgsfield prompt encodes the correct system's palette + mood. A Mnemix carousel in Clay colors is a bug.

## Loop

1. Take an approved post / greenlit brief. Identify the **content angle** it supports.
2. Pull the matching brief from `../design/carousel-briefs/` · `image-briefs/` · `motion-briefs/`, or write one. The brief states the angle, the copy, the system, and the per-asset visual note.
3. Fill the matching Higgsfield prompt template (`../design/higgsfield-prompts/`) with the angle + palette.
4. Generate. Save the output ref + the prompt used to `../sources/design-refs/` (traceability — which prompt made which asset for which post).
5. Attach the asset to the post's draft (Blotato `mediaUrls`, or the blog hero).

## Batch discipline (founder gate)

**Do not mass-produce.** For carousels especially: build the first 1–2 designs, get founder approval on the look, *then* batch the rest. The Mnemix carousel batch brief carries this warning in its header. Approved look first, volume second.

## Every brief answers one question

*"What post, TLDR, blog, or product narrative does this visual support?"* If a brief can't answer it, it doesn't get made.
