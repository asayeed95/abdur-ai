import { Box, Diagram } from "./parts";
import { Arrow, Decision, SideNote } from "./decision";

/**
 * The build-plan path authorization gate, wired into CI: its own job with its
 * own required context and no job-level `if:`. The step decides the event:
 * a pull request runs the gate (materialized from origin/main) and the
 * verifier's exit code decides the check; anything else is refused and the
 * check fails. Side note: before the fix, a job-level `if:` let a manual
 * dispatch skip the job, and a skipped job satisfies a required check.
 *
 * Nodes for <StepThrough highlight="…">: event, noif, job, step, decide, yes,
 * run, to-verdict, verdict, no, refuse, to-red, red, bypass.
 */
export function NothingRanGateDiagram() {
  return (
    <Diagram
      height={626}
      title="The CI gate, with the decision inside the step"
      desc="An event runs on the PR's head SHA: pull_request or workflow_dispatch. With no job-level if, the Build-plan path authorization job always runs, as its own job with its own required context. Inside the step: is the event pull_request? Yes: run the gate, copied from origin/main, and the verifier's exit code decides the check. No: refuse with not-a-pull-request, and the check fails. Side note, before: a job-level if made a manual dispatch skip the job, and a skipped job satisfies a required check, with no commit and no diff."
    >
      <Box node="event" x={30} y={12} w={260} h={60} title="Event on the PR's head SHA" sub="pull_request, workflow_dispatch" />
      <Arrow node="noif" x={160} y1={72} y2={108} label="no job-level if:" />
      <Box node="job" x={30} y={108} w={260} h={60} title="Build-plan path authorization" sub="own job, own required context" />
      <Arrow node="step" x={160} y1={168} y2={200} label="the step decides" />
      <Decision node="decide" cx={160} y={200} hw={78} hh={44} lines={["Event is", "pull_request?"]} />

      <Arrow node="yes" x={82} y1={244} y2={320} label="yes" side="left" tone="good" />
      <Box node="run" x={10} y={320} w={145} h={60} title="Run the gate" sub="origin/main copy" />
      <Arrow node="to-verdict" x={82} y1={380} y2={416} tone="good" />
      <Box node="verdict" x={10} y={416} w={145} h={60} title="Exit code" sub="decides the check" />

      <Arrow node="no" x={238} y1={244} y2={320} label="no" tone="clay" />
      <Box node="refuse" x={165} y={320} w={145} h={60} title="Refuse" sub="not-a-pull-request" />
      <Arrow node="to-red" x={238} y1={380} y2={416} tone="clay" />
      <Box node="red" x={165} y={416} w={145} h={60} title="Check fails" sub="red, not skipped" />

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
