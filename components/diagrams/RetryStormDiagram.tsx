import { Box, Diagram } from "./parts";
import { Arrow, Decision, SideNote } from "./decision";

/**
 * The Linear webhook's claim path: a delivery is claimed in Redis (SETNX, with
 * retries), awaited against Linear's 5-second deadline, then classified. Only
 * a null reply means duplicate; everything else fails open and goes to Sentry.
 * Bookkeeping writes are detached and run after the ack. Side note: design
 * one's static fuse, shared by every request, fired inside those writes.
 *
 * Nodes for <StepThrough highlight="…">: delivery, await, claim, reply,
 * decide, yes, dup, no, open, ack, bookkeeping, fuse.
 */
export function RetryStormDiagram() {
  return (
    <Diagram
      height={626}
      title="The webhook claim path and its fuse"
      desc="A Linear delivery arrives with a 5-second deadline. The webhook claims it in Redis with SETNX, with retries, and awaits the claim. Is the SETNX reply null? Yes: duplicate, dropped. No: fail open, and any non-OK reply goes to Sentry. After the ack, detached bookkeeping writes run. Side note, design one: one static AbortSignal.timeout(), created at setup and shared by every request, fired late inside the detached bookkeeping writes."
    >
      <Box node="delivery" x={30} y={12} w={260} h={60} title="Linear delivery" sub="5s deadline" />
      <Arrow node="await" x={160} y1={72} y2={108} label="claim, awaited" />
      <Box node="claim" x={30} y={108} w={260} h={60} title="Claim in Redis" sub="SETNX, with retries" />
      <Arrow node="reply" x={160} y1={168} y2={200} label="reply" />
      <Decision node="decide" cx={160} y={200} hw={78} hh={44} lines={["SETNX reply", "is null?"]} />

      <Arrow node="yes" x={82} y1={244} y2={320} label="yes" side="left" />
      <Box node="dup" x={10} y={320} w={145} h={60} title="Duplicate" sub="dropped" />

      <Arrow node="no" x={238} y1={244} y2={320} label="no" tone="good" />
      <Box node="open" x={165} y={320} w={145} h={60} title="Fail open" sub="non-OK to Sentry" />
      <Arrow node="ack" x={238} y1={380} y2={416} label="after ack" />
      <Box node="bookkeeping" x={165} y={416} w={145} h={60} title="Bookkeeping" sub="detached writes" />

      <SideNote
        node="fuse"
        x={10}
        y={500}
        w={300}
        eyebrow="DESIGN ONE · SHARED FUSE"
        lines={[
          "One static AbortSignal.timeout(),",
          "created at setup, shared by every",
          "request. It fired late, inside the",
          "detached bookkeeping writes.",
        ]}
      />
    </Diagram>
  );
}
