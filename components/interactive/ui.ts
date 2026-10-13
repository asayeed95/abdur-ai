/**
 * Shared class strings for the interactive post blocks. Token classes only.
 * The blocks sit inside `.prose-clay`, whose element rules (p, h3, ul, ol)
 * outrank a single utility, so chrome uses div/span and the content slot
 * scales prose down to the block's size.
 */

/** The block panel: banded ground (clay and gold text are allowed on band). */
export const BLOCK = "not-prose my-12 bg-band border border-border rounded-lg p-4 sm:p-6";

/** "/// Label" eyebrow at the top of a block. */
export const EYEBROW = "font-mono text-[11px] tracking-widest uppercase text-clay mb-4";

/** Mono meta line: counters, step numbers, hints. */
export const META = "font-mono text-[11px] tracking-widest uppercase text-meta";

/** Block heading (a step title, a question): Playfair, never body type. */
export const HEADING = "font-display text-xl leading-snug text-text tracking-tight";

/** Slot for author markdown inside a block: one step down from post body size. */
export const CONTENT =
  "text-base leading-relaxed text-text-soft [&_p]:!text-base [&_p]:!mb-3 [&_p:last-child]:!mb-0 " +
  "[&_ul]:!text-base [&_ol]:!text-base [&_ul]:!mb-3 [&_ol]:!mb-3";

/** Secondary button (design-system .btn-secondary). */
export const BUTTON =
  "inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-text " +
  "border border-border rounded-sm px-4 py-2 transition-colors motion-reduce:transition-none " +
  "hover:border-clay hover:text-clay disabled:opacity-40 disabled:pointer-events-none";
