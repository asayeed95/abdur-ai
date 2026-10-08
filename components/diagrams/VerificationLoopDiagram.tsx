import { Box, Diagram, Down, Loop, NODE_STATE, NODE_STROKE } from "./parts";

/**
 * The verification loop: an agent's "done" is a claim, not a result. Run the
 * real check, read its output as evidence, compare it to the claim. Match:
 * accept. No match: the failing output goes back to the agent, and the loop
 * runs again.
 *
 * Nodes for <StepThrough highlight="…">: claim, run, check, evidence,
 * compare, decision, yes, accept, no.
 */
export function VerificationLoopDiagram() {
  return (
    <Diagram
      height={484}
      title="The verification loop"
      desc="The agent claims done. Run the check, meaning the real command. Its output is the evidence. Does the evidence match the claim? Yes: accept. No: the failing output goes back to the agent, which tries again, and the loop repeats."
    >
      <Box node="claim" x={60} y={12} w={220} h={48} title="Agent claims “done”" />
      <Down node="run" x={170} y1={60} y2={96} />
      <Box node="check" x={60} y={96} w={220} h={60} title="Run the check" sub="the real command" />
      <Down node="evidence" x={170} y1={156} y2={192} />
      <Box node="evidence" x={60} y={192} w={220} h={60} title="Evidence" sub="the command's output" />
      <Down node="compare" x={170} y1={252} y2={284} />

      <g
        data-node="decision"
        aria-hidden="true"
        className={NODE_STATE}
      >
        <path
          d="M 170 284 L 262 330 L 170 376 L 78 330 Z"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className={`fill-surface stroke-border-2 group-data-[active]/node:stroke-clay ${NODE_STROKE}`}
        />
        <text x={170} y={321} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={500} className="fill-text">
          Matches
        </text>
        <text x={170} y={340} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={500} className="fill-text">
          the claim?
        </text>
      </g>

      <Down node="yes" x={170} y1={376} y2={420} label="yes" tone="good" />
      <Box node="accept" x={60} y={420} w={220} h={48} title="Accept" />

      <Loop
        node="no"
        d="M 78 330 L 26 330 L 26 36 L 52 36"
        tip={[60, 36]}
        head="right"
        label="no: failing output to agent"
        labelX={13}
        labelY={183}
      />
      <g data-node="no" aria-hidden="true" className={NODE_STATE}>
        <text x={66} y={316} textAnchor="end" fontSize={12} className="font-mono fill-clay">
          no
        </text>
      </g>
    </Diagram>
  );
}
