import { Box, Diagram, Down, NODE_STATE, NODE_STROKE } from "./parts";

/**
 * "The number is not the person": two different people call from one shared
 * number. Memory is keyed by the number (ANI), so what Call A left on the
 * contact is injected when Call B connects, and the agent greets Call B about
 * Call A's issue. The fix the post argues for: key memory by a principal, not
 * by the number. No numbers by design.
 *
 * Nodes for <StepThrough highlight="…">: callA, callB, number, match,
 * contact, inject, greet, principal.
 */
export function NumberIsNotThePersonDiagram() {
  return (
    <Diagram
      height={476}
      title="The number is not the person"
      desc="Call A and Call B are two different people on one shared phone number. The number, the ANI, is a channel, not a person. Call A's name, issue and preferences are written onto a contact keyed by that number. When Call B comes in, the number matches, the stored fields are injected, and the agent greets Call B about Call A's issue. The fix: key memory by a principal, such as a user id, an account key or a verified member, not by the phone number."
    >
      <Box node="callA" x={20} y={12} w={130} h={56} title="Call A" sub="person 1" />
      <Box node="callB" x={170} y={12} w={130} h={56} title="Call B" sub="person 2" />
      <Down node="callA" x={85} y1={68} y2={108} label="writes" />
      <Down node="callB" x={235} y1={68} y2={108} label="calls in" />

      <Box node="number" x={20} y={108} w={280} h={60} title="One shared phone number" sub="ANI: a channel, not a person" />
      <Down node="match" x={160} y1={168} y2={208} label="number matches" />
      <Box node="contact" x={20} y={208} w={280} h={60} title="Contact keyed by number" sub="Call A's name, issue, prefs" />
      <Down node="inject" x={160} y1={268} y2={308} label="injected on Call B" />
      <Box node="greet" x={20} y={308} w={280} h={60} title="Agent greets Call B" sub="about Call A's issue" />

      <g data-node="principal" aria-hidden="true" className={NODE_STATE}>
        <rect
          x={20}
          y={388}
          width={280}
          height={80}
          rx={6}
          fill="none"
          strokeWidth={1.25}
          strokeDasharray="5 4"
          className={`stroke-muted group-data-[active]/node:stroke-clay ${NODE_STROKE}`}
        />
        <text x={36} y={410} fontSize={11} letterSpacing="0.12em" className="font-mono fill-meta">
          THE FIX · KEY BY A PRINCIPAL
        </text>
        <text x={36} y={432} fontSize={13} className="fill-text-soft">
          A user id, an account key, a verified
        </text>
        <text x={36} y={451} fontSize={13} className="fill-text-soft">
          member. Not the phone number.
        </text>
      </g>
    </Diagram>
  );
}
