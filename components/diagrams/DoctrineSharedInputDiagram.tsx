import { Box, Diagram, Down, NODE_STATE } from "./parts";

/**
 * P-012 from "The night the doctrine failed": N safety layers that consume the
 * same upstream artifact are one gate wearing N hats. The prescription is a
 * source-independence check on every multi-gate verification.
 *
 * Nodes for <StepThrough highlight="…">: table, feeds, gates, merge, one,
 * check.
 */
export function DoctrineSharedInputDiagram() {
  return (
    <Diagram
      height={404}
      title="One gate wearing N hats"
      desc="One upstream artifact, the disposition table, feeds gate 1, gate 2 and gate N. Because they share that input, they act as one gate wearing N hats: corrupt the input and every gate agrees. The check: do gates 1 to N share an input that, if corrupted, corrupts them all? If yes, they are one gate."
    >
      <Box node="table" x={40} y={12} w={240} h={56} title="Disposition table" sub="one upstream artifact" />

      <g data-node="feeds" aria-hidden="true" className={NODE_STATE}>
        <line x1={160} y1={68} x2={160} y2={84} strokeWidth={1.5} className="stroke-muted" />
        <line x1={56} y1={84} x2={264} y2={84} strokeWidth={1.5} className="stroke-muted" />
      </g>
      <Down node="feeds" x={56} y1={84} y2={116} />
      <Down node="feeds" x={160} y1={84} y2={116} />
      <Down node="feeds" x={264} y1={84} y2={116} />

      <Box node="gates" x={12} y={116} w={88} h={48} title="Gate 1" />
      <Box node="gates" x={116} y={116} w={88} h={48} title="Gate 2" />
      <Box node="gates" x={220} y={116} w={88} h={48} title="Gate N" />

      <g data-node="merge" aria-hidden="true" className={NODE_STATE}>
        <line x1={56} y1={164} x2={56} y2={184} strokeWidth={1.5} className="stroke-muted" />
        <line x1={264} y1={164} x2={264} y2={184} strokeWidth={1.5} className="stroke-muted" />
        <line x1={56} y1={184} x2={264} y2={184} strokeWidth={1.5} className="stroke-muted" />
      </g>
      <Down node="merge" x={160} y1={164} y2={212} />

      <Box node="one" x={40} y={212} w={240} h={56} title="One gate" sub="wearing N hats" />

      <g data-node="check" aria-hidden="true" className={NODE_STATE}>
        <rect
          x={20}
          y={296}
          width={280}
          height={100}
          rx={6}
          fill="none"
          strokeWidth={1.25}
          strokeDasharray="5 4"
          className="stroke-muted group-data-[active]/node:stroke-clay"
        />
        <text x={36} y={318} fontSize={11} letterSpacing="0.12em" className="font-mono fill-meta">
          SOURCE-INDEPENDENCE CHECK
        </text>
        <text x={36} y={341} fontSize={13} className="fill-text-soft">
          Do gates 1..N share an input that,
        </text>
        <text x={36} y={360} fontSize={13} className="fill-text-soft">
          if corrupted, corrupts them all?
        </text>
        <text x={36} y={379} fontSize={13} className="fill-text-soft">
          If yes, they are one gate.
        </text>
      </g>
    </Diagram>
  );
}
