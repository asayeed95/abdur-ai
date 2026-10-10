import { Box, Diagram, Down, Loop } from "./parts";

/**
 * Who owns what when AI writes the code ("Shipping solo with AI: who owns the
 * architecture when the AI writes the code"). I decide the architecture before
 * any code is generated, the AI writes the implementation, I check it against
 * what "correct" means and redirect it when it's wrong, and when it breaks in
 * production I debug it: the AI isn't on call.
 *
 * Nodes for <StepThrough highlight="…">: decide, generate, correct,
 * redirect, ship, prod, debug.
 */
export function ArchitectureOwnershipDiagram() {
  return (
    <Diagram
      height={412}
      title="Who owns what when AI writes the code"
      desc="Mine: decide the architecture before any code is generated. The AI's: write the code, fast hands. Mine: check it against what correct means, the eval and the test. If it's wrong, redirect: reject the answer and the AI writes again. If it's right, it goes to production. When it breaks at 2am, I debug it, because I'm on call and the AI isn't."
    >
      <Box node="decide" x={60} y={12} w={240} h={52} title="Decide the architecture" sub="mine · before any code" />
      <Down node="decide" x={180} y1={64} y2={92} />
      <Box node="generate" x={60} y={92} w={240} h={52} title="Write the code" sub="the AI's · fast hands" />
      <Down node="generate" x={180} y1={144} y2={172} />
      <Box node="correct" x={60} y={172} w={240} h={52} title="Check it’s correct" sub="mine · the eval, the test" />

      <Loop
        node="redirect"
        d="M 60 198 L 26 198 L 26 118 L 52 118"
        tip={[60, 118]}
        head="right"
        label="no: redirect"
        labelX={13}
        labelY={158}
      />

      <Down node="ship" x={180} y1={224} y2={264} label="yes" tone="good" />
      <Box node="prod" x={60} y={264} w={240} h={44} title="In production" />
      <Down node="prod" x={180} y1={308} y2={348} label="breaks at 2am" />
      <Box node="debug" x={60} y={348} w={240} h={52} title="Debug it" sub="mine · the AI isn’t on call" />
    </Diagram>
  );
}
