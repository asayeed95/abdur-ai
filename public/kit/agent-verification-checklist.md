# Agent verification checklist

Part of the Agent Reliability Kit from abdur.ai. Taken from the how-to guide
"How do you verify an AI agent's work before you trust it?" on abdur.ai/writing.

The rule behind every item: the agent's summary tells you where to look. It is
never the thing you look at.

The loop is **claim -> exact revision -> primary artifact -> executed check -> decision**.
A failure or missing evidence sends the work back for investigation. A pass
establishes only what that check measured; after a code or base change, rerun
the affected checks against the new revision.

Seven checks, in the order I run them. Copy the ones you need. The commands use
`git`, `gh`, `jq` and `curl`; swap in your own stack's equivalents.

---

## [ ] 1. Read the diff, not the summary

The summary is the agent's opinion of the diff. Read the diff itself.

```bash
git fetch origin || exit 1
REVIEW_SHA=$(git rev-parse --verify 'HEAD^{commit}') || exit 1
BASE_SHA=$(git rev-parse --verify 'origin/main^{commit}') || exit 1
git diff --stat "$BASE_SHA...$REVIEW_SHA"
git diff "$BASE_SHA...$REVIEW_SHA"
git diff "$BASE_SHA...$REVIEW_SHA" -- lib/  # Then focus on one directory.
```

Run these in the checkout you intend to review. They compare committed
revisions; inspect `git diff` and `git diff --cached` separately for uncommitted
changes. Keep `REVIEW_SHA` and `BASE_SHA` in the same shell for the later
checks. If the summary says "small refactor" and the stat shows forty files,
you've learned something before reading a line.

## [ ] 2. Re-run the gate yourself and read the exit code

"Tests pass" is a claim. An exit code is evidence.

```bash
if ./scripts/check-phase.sh --hard; then
  echo "gate passed"
else
  result=$?
  echo "gate failed: exit=$result" >&2
  exit "$result"
fi
```

Use your project's actual gate command. Watch for pipelines that hide the
producer's failure: without `pipefail`, `cmd | grep -q ok` can return success
if `cmd` prints "ok" and then fails. Inspect both the producer and the script's
final exit status.

## [ ] 3. Confirm the check actually ran

A green check and a check that never executed can look the same.

```bash
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner) || exit 1
gh api --paginate "repos/$REPO/commits/$REVIEW_SHA/check-runs?per_page=100" \
  --jq '.check_runs[] | "\(.name)\t\(.status)\t\(.conclusion)"' || exit 1
```

`skipped` is not `success`. This lists check runs; it does not assert that an
expected job exists. Match the expected job names and revision, then read their
logs for the actual test command and result. No output is missing evidence, not
a pass.

## [ ] 4. Trace every claim to a primary source

"This PR is superseded by main" is a claim about git history. Check it against
git history.

```bash
if git merge-base --is-ancestor "$REVIEW_SHA" "$BASE_SHA"; then
  echo "reviewed commit is an ancestor of the captured base"
else
  result=$?
  if [ "$result" -eq 1 ]; then
    echo "reviewed commit is not an ancestor of the captured base"
  else
    echo "ancestry check failed: exit=$result" >&2
    exit "$result"
  fi
fi
git show "$REVIEW_SHA:lib/posts.ts"   # replace with the claimed file
# Read the corresponding file on the base too:
git show "$BASE_SHA:lib/posts.ts"
```

Ancestry proves commit inclusion, not equivalent content: a squash or
cherry-pick changes the commit identity, and a later commit can revert an
included change. Inspect the claimed behavior on the captured base even when
the ancestry check passes.

## [ ] 5. Reject verification artifacts without provenance

If a gate consumes a verification file, check each row for who verified it,
when, and against what source. A row missing any of those is data shaped like a
verification.

```bash
jq -e -s '
  def nonblank: if type == "string" then test("\\S") else false end;
  def utc_time:
    if type == "string" then
      . as $value | try ((fromdateiso8601 | todateiso8601) == $value) catch false
    else false end;
  def full_sha:
    if type == "string" then test("^([0-9a-f]{40}|[0-9a-f]{64})$") else false end;
  length > 0 and all(.[];
    type == "object" and
    (.verifier | nonblank) and
    (.timestamp | utc_time) and
    (.source_sha | full_sha)
  )
' verify.jsonl >/dev/null || {
  echo "Invalid or empty verification artifact" >&2
  exit 1
}
```

This requires a nonblank verifier, a UTC timestamp in `YYYY-MM-DDTHH:MM:SSZ`
form, and a full lowercase Git object ID. It rejects empty input, missing
fields, wrong types and malformed JSON with a nonzero exit. It reads the whole
artifact, so use it for small review manifests.

Passing this shape check is only the first step. Resolve each SHA in the
intended repository, compare it with the reviewed revision, check the timestamp
against the run, and follow the verifier identity to actual logs or a signed
receipt. Well-formatted invented fields are still invented evidence.

## [ ] 6. Measure what shipped, not the source

Source files are intentions. Rendered pages, built bundles and deployed
responses are facts.

```bash
PAGE=$(mktemp) || exit 1
trap 'rm -f "$PAGE"' EXIT
curl --fail --silent --show-error --location \
  --connect-timeout 10 --max-time 30 \
  https://abdur.ai/writing/the-night-the-doctrine-failed -o "$PAGE" || exit 1
grep -Fq 'The night the doctrine failed' "$PAGE" || {
  echo "Expected article text missing" >&2
  exit 1
}
```

Replace the URL and the expected text with your own. This proves reachability
and an expected text match, not the deployed revision or a complete user
journey. For a release claim, verify an immutable build identifier or the exact
changed behavior too. A login redirect ending in HTTP 200 is not the intended
page; a successful API response is not proof of downstream delivery.

## [ ] 7. Make sure your checks don't share one input

Three checks that all read the same agent-written table are one check wearing
three hats. If that table is wrong, all three agree with it. For each gate, ask
what it reads. If two gates read the same upstream artifact, at least one of
them should read the primary source instead.

---

## The rule that does the most work

Don't write "done," "deployed," or a number unless a command you ran this turn
produced it. It turns "the agent said so" into "show me the command."

## What this checklist can't catch

Whether the change was the right one. Every check above catches false claims:
the file didn't change, the test didn't run, the commit isn't on main. None of
them tells you the design was sound. That part is still judgment.

---

Agent Reliability Kit · abdur.ai/kit · Abdur Rahman Sayeed
