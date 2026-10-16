import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const workflowPath = fileURLToPath(new URL("../.github/workflows/coderabbit-agent-bridge.yml", import.meta.url));
const workflow = readFileSync(workflowPath, "utf8");

function loadAttemptChecker() {
  const match = workflow.match(
    /\/\/ AGE-3654 attempt-authenticity:begin\n([\s\S]*?)\n[ \t]*\/\/ AGE-3654 attempt-authenticity:end/,
  );
  assert.ok(match, "attempt authenticity function missing from the bridge workflow");
  const rawLines = match[1].split("\n");
  const indents = rawLines.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length);
  const trim = Math.min(...indents);
  const source = rawLines.map((line) => line.slice(trim)).join("\n");
  return new Function(`${source}\nreturn findAuthenticPriorAttempt;`)();
}

const head = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const base = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const otherHead = "cccccccccccccccccccccccccccccccccccccccc";

function expected(overrides = {}) {
  return {
    owner: "asayeed95",
    repo: "abdur-ai",
    prNumber: 70,
    head,
    base,
    currentRunId: 9000,
    ...overrides,
  };
}

function marker({ pr = 70, head: markerHead = head, base: markerBase = base, run = 42 } = {}) {
  return `<!-- review-bridge:claude-attempt pr=${pr} head=${markerHead} base=${markerBase} run=${run} -->`;
}

function authenticComment(body, createdAt) {
  return {
    user: { login: "github-actions[bot]" },
    performed_via_github_app: { slug: "github-actions" },
    body,
    created_at: createdAt,
  };
}

function githubFor(run, jobs) {
  const calls = [];
  return {
    calls,
    rest: {
      actions: {
        getWorkflowRun: async (args) => {
          calls.push(["getWorkflowRun", args.run_id]);
          if (!run) throw new Error("missing run");
          return { data: run };
        },
      },
    },
    paginate: async (_fn, args) => {
      calls.push(["jobs", args.run_id]);
      return jobs;
    },
  };
}

const stepAt = "2026-10-16T06:00:00.000Z";
const commentAt = "2026-10-16T06:00:02.000Z";

function realRun(overrides = {}) {
  return {
    path: ".github/workflows/coderabbit-agent-bridge.yml",
    event: "issue_comment",
    repository: { full_name: "asayeed95/abdur-ai" },
    head_sha: "dddddddddddddddddddddddddddddddddddddddd",
    pull_requests: [],
    ...overrides,
  };
}

function realJobs(completedAt = stepAt) {
  return [{
    steps: [{ name: "Record the Claude attempt", conclusion: "success", completed_at: completedAt }],
  }];
}

test("a forged issue-comment marker cannot suppress the current head", async () => {
  const fn = loadAttemptChecker();
  const github = githubFor(realRun(), realJobs());
  const forged = {
    user: { login: "attacker" },
    body: `${marker()}\nforged review-bridge:claude-attempt`,
    created_at: commentAt,
  };
  assert.equal(await fn([forged], expected(), github), false);
  assert.deepEqual(github.calls, []);
  assert.doesNotMatch(workflow, /comments\.some\(/);
  assert.match(workflow, /findAuthenticPriorAttempt\(commitComments,/);
  assert.doesNotMatch(workflow, /findAuthenticPriorAttempt\(comments,/);
  assert.match(workflow, /priorAttempt && !forceRetry/);
  assert.match(workflow, /createCommitComment/);
  assert.match(workflow, /anthropics\/claude-code-action@/);
});

test("a copied stale marker for this head does not suppress", async () => {
  const fn = loadAttemptChecker();
  const github = githubFor(realRun(), realJobs("2026-10-15T06:00:00.000Z"));
  const copied = authenticComment(marker(), commentAt);
  assert.equal(await fn([copied], expected(), github), false);
});

test("a marker whose run is a different workflow or head does not suppress", async () => {
  const fn = loadAttemptChecker();
  const wrongWorkflow = githubFor(realRun({ path: ".github/workflows/ci.yml" }), realJobs());
  assert.equal(await fn([authenticComment(marker(), commentAt)], expected(), wrongWorkflow), false);

  const otherPr = githubFor(
    realRun({ pull_requests: [{ number: 16, head: { sha: otherHead }, base: { sha: base } }] }),
    realJobs(),
  );
  assert.equal(await fn([authenticComment(marker(), commentAt)], expected(), otherPr), false);

  const wrongHeadMarker = authenticComment(marker({ head: otherHead }), commentAt);
  const untouched = githubFor(realRun(), realJobs());
  assert.equal(await fn([wrongHeadMarker], expected(), untouched), false);
  assert.deepEqual(untouched.calls, []);
});

test("an authentic attempt for this head, base, PR, and run suppresses", async () => {
  const fn = loadAttemptChecker();
  const github = githubFor(realRun(), realJobs());
  const comment = authenticComment(marker({ run: 42 }), commentAt);
  assert.equal(await fn([comment], expected(), github), true);
});

test("a ref-suffixed workflow path still counts and a near-miss filename does not", async () => {
  const fn = loadAttemptChecker();
  const suffixed = githubFor(
    realRun({ path: ".github/workflows/coderabbit-agent-bridge.yml@main" }),
    realJobs(),
  );
  assert.equal(await fn([authenticComment(marker(), commentAt)], expected(), suffixed), true);
  const nearMiss = githubFor(
    realRun({ path: ".github/workflows/coderabbit-agent-bridge.yml.bak" }),
    realJobs(),
  );
  assert.equal(await fn([authenticComment(marker(), commentAt)], expected(), nearMiss), false);
});

test("the current run id cannot suppress itself", async () => {
  const fn = loadAttemptChecker();
  const github = githubFor(realRun(), realJobs());
  const comment = authenticComment(marker({ run: 9000 }), commentAt);
  assert.equal(await fn([comment], expected({ currentRunId: 9000 }), github), false);
  assert.deepEqual(github.calls, []);
});

test("a run that never recorded the attempt step does not suppress", async () => {
  const fn = loadAttemptChecker();
  const github = githubFor(realRun(), [{ steps: [{ name: "Verify exact-head CodeRabbit and Codex receipts", conclusion: "success" }] }]);
  assert.equal(await fn([authenticComment(marker(), commentAt)], expected(), github), false);
});
