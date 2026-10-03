import { Box, Diagram, Down, NODE_STATE } from "./parts";

/**
 * "Your pager is not your customer": a synthetic health cron pings Redis; the
 * client abort (about 100ms) is tighter than the documented slow-warn
 * (2000ms), so the probe fatals and the pager fires. That page is a signal, a
 * fact about a check. Customer impact stays unknown until a user-path probe
 * exists that does not share that abort. Numbers are the two the post states;
 * the timeline is drawn to that scale.
 *
 * Nodes for <StepThrough highlight="…">: cron, probe, abort, warn, page,
 * signal, impact.
 */
const AXIS_X0 = 44;
const AXIS_X1 = 276;
const ABORT_X = AXIS_X0 + Math.round((AXIS_X1 - AXIS_X0) * (100 / 2000));

export function PagerIsNotCustomerDiagram() {
  return (
    <Diagram
      height={436}
      title="Alert signal versus customer impact"
      desc="A synthetic health cron pings Redis. The client abort, about 100ms, is far tighter than the check's documented slow-warn of 2000ms, so the probe is killed long before the warn budget is reached. The probe fatals and the pager fires. That page is a signal: a fact about a check. It does not prove customer impact, which stays unknown until a user-path probe exists that does not share that abort."
    >
      <Box node="cron" x={30} y={12} w={260} h={60} title="Synthetic health cron" sub="Redis ping" />
      <Down node="probe" x={160} y1={72} y2={104} />

      <g data-node="abort" aria-hidden="true" className={NODE_STATE}>
        <text x={AXIS_X0} y={122} fontSize={12} className="font-mono fill-clay">
          abort ≈100ms
        </text>
        <line x1={ABORT_X} y1={138} x2={ABORT_X} y2={162} strokeWidth={2} className="stroke-clay" />
        <line x1={AXIS_X0} y1={150} x2={ABORT_X} y2={150} strokeWidth={6} strokeLinecap="round" className="stroke-clay" />
      </g>
      <g data-node="warn" aria-hidden="true" className={NODE_STATE}>
        <line x1={ABORT_X} y1={150} x2={AXIS_X1} y2={150} strokeWidth={1.5} strokeDasharray="4 4" className="stroke-muted" />
        <line x1={AXIS_X1} y1={138} x2={AXIS_X1} y2={162} strokeWidth={1.5} className="stroke-muted" />
        <text x={AXIS_X1} y={122} textAnchor="end" fontSize={12} className="font-mono fill-meta">
          slow-warn 2000ms
        </text>
      </g>
      <text x={160} y={182} textAnchor="middle" fontSize={13} className="fill-text-soft" aria-hidden="true">
        Abort is tighter than warn.
      </text>

      <Down node="page" x={160} y1={194} y2={234} label="fatals, pages" />
      <Box node="signal" x={30} y={234} w={260} h={60} title="Pager fires" sub="signal: a fact about a check" />

      <text x={160} y={318} textAnchor="middle" fontSize={12} className="font-mono fill-meta" aria-hidden="true">
        does not prove
      </text>

      <g data-node="impact" aria-hidden="true" className={NODE_STATE}>
        <rect
          x={30}
          y={340}
          width={260}
          height={84}
          rx={6}
          fill="none"
          strokeWidth={1.25}
          strokeDasharray="5 4"
          className="stroke-muted group-data-[active]/node:stroke-clay"
        />
        <text x={46} y={362} fontSize={11} letterSpacing="0.12em" className="font-mono fill-meta">
          CUSTOMER IMPACT · UNKNOWN
        </text>
        <text x={46} y={385} fontSize={13} className="fill-text-soft">
          Until a user-path probe exists
        </text>
        <text x={46} y={404} fontSize={13} className="fill-text-soft">
          that does not share that abort.
        </text>
      </g>
    </Diagram>
  );
}
