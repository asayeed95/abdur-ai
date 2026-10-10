import { NODE_STATE, NODE_STROKE } from "./parts";

/**
 * Branching parts for incident diagrams, on top of ./parts: a decision diamond
 * and a vertical arrow whose tone marks the path. Clay is the failure path (the
 * one accent), good-text the path that works, muted everything else. Same
 * token-only, node-highlight rules as ./parts.
 */

/** A decision diamond centred on `cx`, top vertex at `y`. `lines` are its label, one per line. */
export function Decision({
  cx,
  y,
  hw,
  hh,
  lines,
  node,
}: {
  cx: number;
  y: number;
  hw: number;
  hh: number;
  lines: string[];
  node?: string;
}) {
  const cy = y + hh;
  const first = cy - ((lines.length - 1) * 18) / 2;
  return (
    <g data-node={node} className={NODE_STATE} aria-hidden="true">
      <path
        d={`M ${cx} ${y} L ${cx + hw} ${cy} L ${cx} ${y + 2 * hh} L ${cx - hw} ${cy} Z`}
        strokeWidth={1.5}
        strokeLinejoin="round"
        className={`fill-surface stroke-border-2 group-data-[active]/node:stroke-clay ${NODE_STROKE}`}
      />
      {lines.map((l, i) => (
        <text
          key={l}
          x={cx}
          y={first + i * 18}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight={500}
          className="fill-text"
        >
          {l}
        </text>
      ))}
    </g>
  );
}

const TONE = {
  muted: { line: "stroke-muted", head: "fill-muted", text: "fill-meta" },
  good: { line: "stroke-good-text", head: "fill-good-text", text: "fill-good-text" },
  clay: { line: "stroke-clay", head: "fill-clay", text: "fill-clay" },
} as const;

/**
 * A vertical arrow from y1 down to y2 at x. The optional mono label sits to the
 * right (default) or left of the line.
 */
export function Arrow({
  x,
  y1,
  y2,
  label,
  side = "right",
  tone = "muted",
  node,
}: {
  x: number;
  y1: number;
  y2: number;
  label?: string;
  side?: "left" | "right";
  tone?: keyof typeof TONE;
  node?: string;
}) {
  const t = TONE[tone];
  return (
    <g data-node={node} className={NODE_STATE} aria-hidden="true">
      <line x1={x} y1={y1} x2={x} y2={y2 - 7} strokeWidth={1.5} className={t.line} />
      <path d={`M ${x - 5} ${y2 - 8} L ${x + 5} ${y2 - 8} L ${x} ${y2} Z`} className={t.head} />
      {label && (
        <text
          x={side === "right" ? x + 10 : x - 10}
          y={(y1 + y2) / 2}
          textAnchor={side === "right" ? "start" : "end"}
          dominantBaseline="central"
          fontSize={12}
          className={`font-mono ${t.text}`}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * A dashed side note under a diagram: a mono eyebrow and up to a few short
 * lines. Same shape as the side note in AppendOnlyMemoryDiagram.
 */
export function SideNote({
  x,
  y,
  w,
  eyebrow,
  lines,
  node,
}: {
  x: number;
  y: number;
  w: number;
  eyebrow: string;
  lines: string[];
  node?: string;
}) {
  const h = 38 + lines.length * 19;
  return (
    <g data-node={node} aria-hidden="true" className={NODE_STATE}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill="none"
        strokeWidth={1.25}
        strokeDasharray="5 4"
        className={`stroke-muted group-data-[active]/node:stroke-clay ${NODE_STROKE}`}
      />
      <text x={x + 16} y={y + 22} fontSize={11} letterSpacing="0.12em" className="font-mono fill-meta">
        {eyebrow}
      </text>
      {lines.map((l, i) => (
        <text key={l} x={x + 16} y={y + 44 + i * 19} fontSize={13} className="fill-text-soft">
          {l}
        </text>
      ))}
    </g>
  );
}
