import { Box, Diagram, Down, NODE_STATE } from "./parts";

/**
 * The PR #53 near-miss in "The night the doctrine failed": Phase A verdict,
 * cross-verifier, rescue checks and the human approval all clear the close.
 * Phase B reads main instead of the disposition table, finds #53 is the only
 * fix, and the batch is held for re-verification from primary sources.
 *
 * Nodes for <StepThrough highlight="…">: phaseA, verifier, rescue, approve,
 * gates, read, found, hold.
 */
export function DoctrineFailureDiagram() {
  return (
    <Diagram
      height={556}
      title="The PR #53 near-miss"
      desc="Phase A returns verdict R4, close-superseded. The cross-verifier returns AGREE. The rescue path clears thirteen safety checks. The human approves with 53 approve. Every gate is green. Then Phase B, Opus, reads the code in main instead of the disposition table and finds PR #53 is the only fix for AGE-82 and AGE-88. The batch is held and re-verified from primary sources."
    >
      <Box node="phaseA" x={20} y={12} w={250} h={52} title="Phase A verdict" sub="R4 close-superseded" />
      <Down x={145} y1={64} y2={92} />
      <Box node="verifier" x={20} y={92} w={250} h={52} title="Cross-verifier" sub="AGREE" />
      <Down x={145} y1={144} y2={172} />
      <Box node="rescue" x={20} y={172} w={250} h={52} title="Rescue path" sub="13 safety checks" />
      <Down x={145} y1={224} y2={252} />
      <Box node="approve" x={20} y={252} w={250} h={52} title="Human approval" sub="53 approve" />
      <Down x={145} y1={304} y2={332} />
      <Box node="read" x={20} y={332} w={250} h={52} title="Opus reads main" sub="Phase B, not the table" />
      <Down x={145} y1={384} y2={412} />
      <Box node="found" x={20} y={412} w={250} h={52} title="#53 is the only fix" sub="for AGE-82 and AGE-88" />
      <Down x={145} y1={464} y2={492} />
      <Box node="hold" x={20} y={492} w={250} h={52} title="Batch held" sub="re-verify from primary sources" />

      <g data-node="gates" aria-hidden="true" className={NODE_STATE}>
        <path
          d="M 276 14 L 286 14 L 286 302 L 276 302"
          fill="none"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className="stroke-clay"
        />
        <text
          x={302}
          y={158}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          transform="rotate(-90 302 158)"
          className="font-mono fill-clay"
        >
          every gate green
        </text>
      </g>
    </Diagram>
  );
}
