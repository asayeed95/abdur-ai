import { Box, Diagram } from "./parts";
import { Arrow, Decision, SideNote } from "./decision";

/**
 * The build-plan path authorization gate, wired into CI: its own job with its
 * own required context and no job-level `if:`. The step decides the event,
 * three ways, as the post's YAML does: a pull request runs the gate
 * (materialized from origin/main) and the verifier's exit code decides the
 * check; a push to main prints a named skip and exits 0; any other event,
 * such as a manual workflow_dispatch, errors and the check fails. Side note:
 * before the fix, a job-level `if:` let a manual dispatch skip the job, and a
 * skipped job satisfies a required check.
 *
 * Nodes for <StepThrough highlight="…">: event, noif, job, step, decide, yes,
 * run, to-verdict, verdict, push, skip, to-pass, pass, no, refuse, to-red,
 * red, bypass.
 */
export function NothingRanGateDiagram() {
  return (
    <Diagram
      height={626}
      title="The CI gate, with the decision inside the step"
      desc="A workflow event arrives: pull_request, push, or workflow_dispatch. With no job-level if, the Build-plan path authorization job always runs, as its own job with its own required context. Inside the step: which event is it? pull_request: run the gate, copied from origin/main, and the verifier's exit code decides the check. push to main: print a named skip, VERDICT: skip reason=not-a-pull-request, and exit 0, so the check passes. Any other event, such as a manual workflow_dispatch: error and exit 1, so the check fails instead of being skipped. Side note, before: a job-level if made a manual dispatch skip the job, and a skipped job satisfies a required check, with no commit and no diff."
    >
      <Box node="event" x={10} y={12} w={300} h={60} title="A workflow event" sub="pull_request, push, workflow_dispatch" />
      <Arrow node="noif" x={160} y1={72} y2={108} label="no job-level if:" />
      <Box node="job" x={30} y={108} w={260} h={60} title="Build-plan path authorization" sub="own job, own required context" />
      <Arrow node="step" x={160} y1={168} y2={200} label="the step decides" />
      <Decision node="decide" cx={160} y={200} hw={105} hh={40} lines={["Which event?"]} />

      <Arrow node="yes" x={55} y1={240} y2={320} tone="good" />
      <Box node="run" x={5} y={320} w={100} h={60} title="pull_request" sub="run the gate" />
      <Arrow node="to-verdict" x={55} y1={380} y2={416} tone="good" />
      <Box node="verdict" x={5} y={416} w={100} h={60} title="Exit code" sub="decides" />

      <Arrow node="push" x={160} y1={280} y2={320} />
      <Box node="skip" x={110} y={320} w={100} h={60} title="push to main" sub="named skip" />
      <Arrow node="to-pass" x={160} y1={380} y2={416} />
      <Box node="pass" x={110} y={416} w={100} h={60} title="Check passes" sub="exit 0" />

      <Arrow node="no" x={265} y1={240} y2={320} tone="clay" />
      <Box node="refuse" x={215} y={320} w={100} h={60} title="Other event" sub="e.g. dispatch" />
      <Arrow node="to-red" x={265} y1={380} y2={416} tone="clay" />
      <Box node="red" x={215} y={416} w={100} h={60} title="Check fails" sub="exit 1" />

      <SideNote
        node="bypass"
        x={10}
        y={500}
        w={300}
        eyebrow="BEFORE · JOB-LEVEL if:"
        lines={["A manual dispatch made the job", "skipped, and a skipped job", "satisfies a required check. No", "commit, no diff."]}
      />
    </Diagram>
  );
}
