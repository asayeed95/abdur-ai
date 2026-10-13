import { Box, Diagram, Down, Loop, NODE_STATE, NODE_STROKE } from "./parts";

/**
 * Append-only agent memory: the run appends events to a log that is never
 * rewritten; on restart the log is loaded and compacted into working context,
 * which feeds the agent again. Side note: a vector index earns its place only
 * when recall over a large corpus is the bottleneck. No numbers by design.
 *
 * Nodes for <StepThrough highlight="…">: run, append, log, load, compact,
 * context, loop, index.
 */
export function AppendOnlyMemoryDiagram() {
  return (
    <Diagram
      height={452}
      title="Append-only agent memory"
      desc="An agent run appends events to an append-only log, events.jsonl. On restart the log is loaded, summarized or compacted into working context, and that context goes back to the agent. Side note: add a vector index only when recall over a large corpus is the bottleneck."
    >
      <Box node="run" x={30} y={12} w={220} h={48} title="Agent run" />
      <Down node="append" x={140} y1={60} y2={100} label="appends events" />
      <Box node="log" x={30} y={100} w={220} h={60} title="Append-only log" sub="events.jsonl" />
      <Down node="load" x={140} y1={160} y2={204} label="on restart: load" />
      <Box node="compact" x={30} y={204} w={220} h={48} title="Summarize / compact" />
      <Down node="compact" x={140} y1={252} y2={292} />
      <Box node="context" x={30} y={292} w={220} h={48} title="Working context" />
      <Loop
        node="loop"
        d="M 250 316 L 290 316 L 290 36 L 258 36"
        tip={[250, 36]}
        head="left"
        label="back to the agent"
        labelX={304}
        labelY={176}
      />

      <g data-node="index" aria-hidden="true" className={NODE_STATE}>
        <rect
          x={30}
          y={364}
          width={260}
          height={80}
          rx={6}
          fill="none"
          strokeWidth={1.25}
          strokeDasharray="5 4"
          className={`stroke-muted group-data-[active]/node:stroke-clay ${NODE_STROKE}`}
        />
        <text x={46} y={386} fontSize={11} letterSpacing="0.12em" className="font-mono fill-meta">
          SIDE NOTE · VECTOR INDEX
        </text>
        <text x={46} y={408} fontSize={13} className="fill-text-soft">
          Only when recall over a large
        </text>
        <text x={46} y={427} fontSize={13} className="fill-text-soft">
          corpus is the bottleneck.
        </text>
      </g>
    </Diagram>
  );
}
