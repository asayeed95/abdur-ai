import { Box, Diagram, Down } from "./parts";

/**
 * Cross-video pattern detection, as designed (the post is register
 * `designed`, status "Design. Not shipped."): pull retention curves across the
 * whole channel instead of one video at a time, normalize them so videos of
 * different lengths are comparable, cluster the shapes to find drop-off
 * signatures that repeat, and output a short list of structural mistakes, not
 * another dashboard. Every stage is planned; the tag at the top says so and
 * never dims during a StepThrough. No numbers by design.
 *
 * Nodes for <StepThrough highlight="…">: curves, pull, normalize, cluster,
 * list.
 */
export function CrossVideoRetentionDiagram() {
  return (
    <Diagram
      height={412}
      title="Cross-video pattern detection, designed, not shipped"
      desc="Design, not shipped. Retention curves start out one video at a time. The planned pipeline pulls them across the whole channel, normalizes them so videos of different lengths are comparable, then clusters the shapes to find drop-off signatures that repeat. The output is a short list of the structural mistakes made over and over, not another dashboard."
    >
      <g aria-hidden="true">
        <rect x={66} y={4} width={188} height={22} rx={11} fill="none" strokeWidth={1.25} strokeDasharray="4 3" className="stroke-muted" />
        <text x={160} y={15} textAnchor="middle" dominantBaseline="central" fontSize={11} letterSpacing="0.12em" className="font-mono fill-meta">
          DESIGN · NOT SHIPPED
        </text>
      </g>

      <Box node="curves" x={30} y={36} w={260} h={60} title="Retention curves" sub="one video at a time" />
      <Down node="pull" x={160} y1={96} y2={136} label="across the channel" />
      <Box node="normalize" x={30} y={136} w={260} h={60} title="Normalize" sub="lengths made comparable" />
      <Down node="cluster" x={160} y1={196} y2={236} />
      <Box node="cluster" x={30} y={236} w={260} h={60} title="Cluster the shapes" sub="drop-offs that repeat" />
      <Down node="list" x={160} y1={296} y2={336} />
      <Box node="list" x={30} y={336} w={260} h={60} title="Short list of mistakes" sub="not another dashboard" />
    </Diagram>
  );
}
