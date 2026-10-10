import { Box, Diagram, Down, NODE_STATE, NODE_STROKE } from "./parts";

/**
 * What an agent memory layer sits between ("What is an agent memory layer?"):
 * the agent (context window) above, storage below, and the layer in the middle
 * with two doors and a rulebook. The write door gates what becomes a durable
 * fact; the read door returns what the agent needs at decision time; the
 * rulebook covers principal, two clocks, provenance and forgetting.
 *
 * Nodes for <StepThrough highlight="…">: agent, layer, write, read,
 * principal, clocks, provenance, forget, storage.
 */

/** An upward arrow from y1 (bottom) to y2 (top) at x, with an optional mono label to its left. */
function Up({ x, y1, y2, label, node }: { x: number; y1: number; y2: number; label?: string; node?: string }) {
  return (
    <g data-node={node} className={NODE_STATE} aria-hidden="true">
      <line x1={x} y1={y1} x2={x} y2={y2 + 7} strokeWidth={1.5} className="stroke-muted" />
      <path d={`M ${x - 5} ${y2 + 8} L ${x + 5} ${y2 + 8} L ${x} ${y2} Z`} className="fill-muted" />
      {label && (
        <text
          x={x - 10}
          y={(y1 + y2) / 2}
          textAnchor="end"
          dominantBaseline="central"
          fontSize={12}
          className="font-mono fill-meta"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** The memory-layer diagram described in the header comment above. */
export function MemoryLayerDiagram() {
  return (
    <Diagram
      height={444}
      title="What an agent memory layer sits between"
      desc="The agent, whose context window is where it thinks, sits on top. Storage sits at the bottom; a vector database is one option. The memory layer is the policy between them. Its write door takes events from the agent and gates what becomes a durable fact in storage. Its read door returns what the agent needs, now, at decision time. Its rulebook covers the principal each fact is about, two clocks (when it was true and when it was learned), provenance, and forgetting."
    >
      <Box node="agent" x={12} y={12} w={296} h={52} title="Agent" sub="context window: where it thinks" />

      <g data-node="layer" aria-hidden="true" className={NODE_STATE}>
        <rect
          x={4}
          y={84}
          width={312}
          height={272}
          rx={8}
          fill="none"
          strokeWidth={1.25}
          strokeDasharray="5 4"
          className={`stroke-muted group-data-[active]/node:stroke-clay ${NODE_STROKE}`}
        />
        <text
          x={160}
          y={345}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          letterSpacing="0.12em"
          className="font-mono fill-clay"
        >
          MEMORY LAYER
        </text>
      </g>

      <Down node="write" x={40} y1={64} y2={132} label="events" />
      <Up node="read" x={280} y1={132} y2={64} label="what it needs, now" />

      <Box node="write" x={12} y={132} w={120} h={52} title="Write door" sub="gate writes" />
      <Box node="read" x={188} y={132} w={120} h={52} title="Read door" sub="decision time" />

      <text
        x={160}
        y={194}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        letterSpacing="0.12em"
        aria-hidden="true"
        className="font-mono fill-meta"
      >
        RULEBOOK
      </text>
      <Box node="principal" x={56} y={204} w={208} h={28} title="Principal" />
      <Box node="clocks" x={56} y={238} w={208} h={28} title="Two clocks" />
      <Box node="provenance" x={56} y={272} w={208} h={28} title="Provenance" />
      <Box node="forget" x={56} y={306} w={208} h={28} title="Forgetting" />

      <Down node="write" x={40} y1={184} y2={380} />
      <Up node="read" x={280} y1={380} y2={184} />

      <Box node="storage" x={12} y={380} w={296} h={52} title="Storage" sub="a vector database is one option" />
    </Diagram>
  );
}
