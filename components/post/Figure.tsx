import type { ReactNode } from "react";

/**
 * In-post figure: a diagram (or any visual) on a banded panel with a required
 * caption. Usage in MDX:
 *
 *   <Figure label="Figure 1" caption="What survives a restart.">
 *     <AppendOnlyMemoryDiagram />
 *   </Figure>
 *
 * - `caption` is required. A figure without one fails the build (this throws
 *   at render, and every post renders at build time).
 * - `label` is optional ("Figure 1"): mono, `text-meta`, set before the caption.
 * - `size="narrow"` caps the figure at `--aitldr-figure-max` (28rem) for small
 *   visuals; the default fills the 65ch prose column and never breaks out of it.
 * - `not-prose`, so the post's prose rules don't restyle the panel. Tokens only.
 */
export function Figure({
  label,
  caption,
  size = "column",
  children,
}: {
  label?: string;
  caption: string;
  size?: "column" | "narrow";
  children: ReactNode;
}) {
  if (!caption || !caption.trim()) {
    throw new Error(
      `<Figure${label ? ` label="${label}"` : ""}> needs a caption: every figure in a post is captioned.`,
    );
  }
  return (
    <figure
      className={`not-prose my-12 mx-auto w-full ${size === "narrow" ? "aitldr-figure" : ""}`}
    >
      <div className="bg-band border border-border rounded-lg p-3 sm:p-6 text-text">
        {children}
      </div>
      <figcaption className="mt-3 text-sm leading-relaxed text-meta">
        {label && (
          <span className="font-mono text-[11px] tracking-widest uppercase text-meta mr-2">
            {label} ·
          </span>
        )}
        {caption}
      </figcaption>
    </figure>
  );
}
