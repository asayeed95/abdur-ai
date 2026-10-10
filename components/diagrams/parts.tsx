import { useId, type ReactNode } from "react";

/**
 * Shared SVG parts for post diagrams (components/diagrams/*). Every colour is a
 * Tailwind token class (fill-surface, stroke-clay, fill-meta …), which compiles
 * to rgb(var(--c-…)), so a diagram follows the theme with no hex anywhere.
 *
 * Diagrams are drawn on a narrow viewBox (320 wide) and capped at 440px, so the
 * smallest label still reads at ~11px on a 360px phone and the figure never
 * outgrows the prose column. Flows run top to bottom for the same reason.
 *
 * Any group carrying `node="…"` becomes a `data-node` that <StepThrough> can
 * highlight: while a step names it, every other node dims.
 */

export const VIEW_W = 320;

/**
 * Classes that let <StepThrough> dim the rest and light the active node.
 * Dimmed is 75%, not lower: the faintest dimmed label (light clay on band)
 * still clears 3.20:1, and dark meta on surface 3.58:1. Opacity alone is
 * then a weak cue, so strokes carry a second one (NODE_STROKE).
 */
export const NODE_STATE =
  "group/node transition-opacity duration-300 motion-reduce:transition-none " +
  "group-data-[stepping]/steps:opacity-75 data-[active]:!opacity-100";

/**
 * Stroke weight as the second state cue, for a node's outline or line: thin
 * (1) while dimmed, heavy (2.5) while lit. Unchanged when nothing is stepping.
 */
export const NODE_STROKE =
  "group-data-[stepping]/steps:[stroke-width:1] group-data-[active]/node:![stroke-width:2.5]";

export function Diagram({
  title,
  desc,
  height,
  children,
}: {
  title: string;
  desc: string;
  height: number;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${height}`}
      role="img"
      aria-labelledby={`${id}-t ${id}-d`}
      className="block w-full h-auto max-w-[440px] mx-auto text-text font-body"
    >
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{desc}</desc>
      {children}
    </svg>
  );
}

/** A labelled box. `sub` is a mono second line (a file name, a command). */
export function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  node,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  node?: string;
}) {
  const cx = x + w / 2;
  return (
    <g data-node={node} className={NODE_STATE} aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        strokeWidth={1.5}
        className={`fill-surface stroke-border-2 group-data-[active]/node:stroke-clay ${NODE_STROKE}`}
      />
      <text
        x={cx}
        y={sub ? y + h / 2 - 7 : y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={500}
        className="fill-text"
      >
        {title}
      </text>
      {sub && (
        <text
          x={cx}
          y={y + h / 2 + 12}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          className="fill-meta font-mono"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

/** A vertical arrow from y1 down to y2 at x, with an optional mono label to its right. */
export function Down({
  x,
  y1,
  y2,
  label,
  node,
  tone = "muted",
}: {
  x: number;
  y1: number;
  y2: number;
  label?: string;
  node?: string;
  tone?: "muted" | "good";
}) {
  return (
    <g data-node={node} className={NODE_STATE} aria-hidden="true">
      <line x1={x} y1={y1} x2={x} y2={y2 - 7} strokeWidth={1.5} className={`stroke-muted ${NODE_STROKE}`} />
      <path d={`M ${x - 5} ${y2 - 8} L ${x + 5} ${y2 - 8} L ${x} ${y2} Z`} className="fill-muted" />
      {label && (
        <text
          x={x + 10}
          y={(y1 + y2) / 2}
          dominantBaseline="central"
          fontSize={12}
          className={`font-mono ${tone === "good" ? "fill-good-text" : "fill-meta"}`}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * A return path (the loop in a loop diagram): `d` is an open polyline ending
 * at the arrow tip; `head` is the tip direction. Drawn in clay, the one accent.
 */
export function Loop({
  d,
  tip,
  head,
  label,
  labelX,
  labelY,
  node,
}: {
  d: string;
  tip: [number, number];
  head: "left" | "right";
  label: string;
  labelX: number;
  labelY: number;
  node?: string;
}) {
  const [tx, ty] = tip;
  const back = head === "left" ? tx + 8 : tx - 8;
  return (
    <g data-node={node} className={NODE_STATE} aria-hidden="true">
      <path d={d} fill="none" strokeWidth={1.5} strokeLinejoin="round" className={`stroke-clay ${NODE_STROKE}`} />
      <path d={`M ${back} ${ty - 5} L ${back} ${ty + 5} L ${tx} ${ty} Z`} className="fill-clay" />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        transform={`rotate(-90 ${labelX} ${labelY})`}
        className="font-mono fill-clay"
      >
        {label}
      </text>
    </g>
  );
}
