import { Box, Diagram, Down, NODE_STATE } from "./parts";

/**
 * One voice turn, two ways ("The latency objection for voice-AI memory is a
 * dead argument"). `variant="objection"`: the memory lookup runs after
 * end-of-turn detection, as a separate pause. `variant="design"` (default):
 * the lookup is designed to run inside the VAD silence the agent already
 * waits through. No timings by design: the post's figure is a target, not a
 * measurement.
 *
 * Nodes for <StepThrough highlight="…">: speak, vad, lookup, response,
 * synth, transport.
 */

function Lookup({ x, y, w, h, sub }: { x: number; y: number; w: number; h: number; sub: string }) {
  const cx = x + w / 2;
  return (
    <g data-node="lookup" aria-hidden="true" className={NODE_STATE}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        strokeWidth={1.5}
        strokeDasharray="5 4"
        className="fill-surface stroke-clay"
      />
      <text x={cx} y={y + h / 2 - 7} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={500} className="fill-text">
        Memory lookup
      </text>
      <text x={cx} y={y + h / 2 + 12} textAnchor="middle" dominantBaseline="central" fontSize={12} className="font-mono fill-meta">
        {sub}
      </text>
    </g>
  );
}

export function VoiceMemoryLatencyDiagram({ variant = "design" }: { variant?: string }) {
  if (variant === "objection") {
    return (
      <Diagram
        height={444}
        title="The objection: memory as a separate pause"
        desc="The caller stops speaking. End-of-turn detection waits through the VAD silence. Then a memory lookup runs as a separate pause. Only then come the model response, synthesis and transport."
      >
        <Box node="speak" x={20} y={12} w={280} h={44} title="Caller stops speaking" />
        <Down x={160} y1={56} y2={84} />
        <Box node="vad" x={20} y={84} w={280} h={52} title="End-of-turn detection" sub="VAD silence" />
        <Down x={160} y1={136} y2={164} />
        <Lookup x={20} y={164} w={280} h={52} sub="a separate pause" />
        <Down x={160} y1={216} y2={244} />
        <Box node="response" x={20} y={244} w={280} h={44} title="Model response" />
        <Down x={160} y1={288} y2={316} />
        <Box node="synth" x={20} y={316} w={280} h={44} title="Synthesis" />
        <Down x={160} y1={360} y2={388} />
        <Box node="transport" x={20} y={388} w={280} h={44} title="Transport" />
      </Diagram>
    );
  }
  return (
    <Diagram
      height={424}
      title="The design: memory inside the silence"
      desc="The caller stops speaking. End-of-turn detection waits through the VAD silence, and the memory lookup is designed to run inside that same silence on the warm path, so it adds no separate pause. Then come the model response, synthesis and transport."
    >
      <Box node="speak" x={20} y={12} w={280} h={44} title="Caller stops speaking" />
      <Down x={160} y1={56} y2={84} />
      <g data-node="vad" aria-hidden="true" className={NODE_STATE}>
        <rect
          x={20}
          y={84}
          width={280}
          height={112}
          rx={6}
          strokeWidth={1.5}
          className="fill-surface stroke-border-2 group-data-[active]/node:stroke-clay"
        />
        <text x={160} y={104} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={500} className="fill-text">
          End-of-turn detection
        </text>
        <text x={160} y={123} textAnchor="middle" dominantBaseline="central" fontSize={12} className="font-mono fill-meta">
          VAD silence
        </text>
      </g>
      <Lookup x={44} y={138} w={232} h={48} sub="warm path, same silence" />
      <Down x={160} y1={196} y2={224} />
      <Box node="response" x={20} y={224} w={280} h={44} title="Model response" />
      <Down x={160} y1={268} y2={296} />
      <Box node="synth" x={20} y={296} w={280} h={44} title="Synthesis" />
      <Down x={160} y1={340} y2={368} />
      <Box node="transport" x={20} y={368} w={280} h={44} title="Transport" />
    </Diagram>
  );
}
