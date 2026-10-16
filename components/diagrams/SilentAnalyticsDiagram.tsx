import { Box, Diagram } from "./parts";
import { Arrow, Decision, SideNote } from "./decision";

/**
 * The analytics call that couldn't fail: a CTA click calls track(name), which
 * calls window.plausible?.(name). With no provider script loaded the global
 * never exists, so optional chaining returns undefined: no error, no event.
 * Side note: @ts-expect-error kept the compiler quiet about the undeclared
 * globals, and every build passed.
 *
 * Nodes for <StepThrough highlight="…">: click, to-call, call, check, decide,
 * yes, sent, no, noop, ts.
 */
export function SilentAnalyticsDiagram() {
  return (
    <Diagram
      height={512}
      title="Why every analytics event was a silent no-op"
      desc="A CTA click calls track(name), which calls the provider global only if it exists: window.plausible?.(name). Is the global defined? Yes: the event is sent, a path never taken here. No: the expression is undefined, with no error and no event. Side note, the compiler: TypeScript knew the globals were undeclared, the @ts-expect-error directive kept it quiet, and every build passed."
    >
      <Box node="click" x={30} y={12} w={260} h={60} title="CTA click" sub="track(name)" />
      <Arrow node="to-call" x={160} y1={72} y2={108} />
      <Box node="call" x={30} y={108} w={260} h={60} title="Call the global, if it exists" sub="window.plausible?.(name)" />
      <Arrow node="check" x={160} y1={168} y2={200} />
      <Decision node="decide" cx={160} y={200} hw={78} hh={44} lines={["Global", "defined?"]} />

      <Arrow node="yes" x={82} y1={244} y2={320} label="yes" side="left" />
      <Box node="sent" x={10} y={320} w={145} h={60} title="Event sent" sub="never taken" />

      <Arrow node="no" x={238} y1={244} y2={320} label="no" tone="clay" />
      <Box node="noop" x={165} y={320} w={145} h={60} title="undefined" sub="no error, no event" />

      <SideNote
        node="ts"
        x={10}
        y={404}
        w={300}
        eyebrow="COMPILER · @ts-expect-error"
        lines={["TypeScript knew the globals were", "undeclared. The directive kept it", "quiet, and every build passed."]}
      />
    </Diagram>
  );
}
