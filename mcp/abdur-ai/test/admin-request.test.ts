// The /admin saveDraft request check (AGE-2974). A server action is a public
// POST endpoint, so malformed shapes must come back as problems, never reach
// validateDraft (which would throw on a non-string description) as a 500.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSaveRequest } from "../../../lib/admin/draft-request";

const input = { slug: "a-post", title: "T", description: "D", register: "argued", body: "B" };

test("a well-formed request passes and trims the task id", () => {
  const r = parseSaveRequest({ input, mode: "create", taskId: " AGE-12 " });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.taskId, "AGE-12");
});

test("malformed shapes are problems, naming the field", () => {
  const cases: [unknown, RegExp][] = [
    [{ input: { ...input, description: 123 }, mode: "create", taskId: "AGE-1" }, /input\.description/],
    [{ input: { ...input, receipts: "x" }, mode: "create", taskId: "AGE-1" }, /input\.receipts/],
    [{ input: { ...input, tags: [1] }, mode: "update", taskId: "AGE-1" }, /input\.tags\.0/],
    [{ input, mode: "publish", taskId: "AGE-1" }, /mode/],
    [{ input, mode: "create", taskId: "not-an-issue" }, /taskId/],
    [{ input: null, mode: "create", taskId: "AGE-1" }, /input/],
    ["junk", /request/],
  ];
  for (const [raw, field] of cases) {
    const r = parseSaveRequest(raw);
    assert.equal(r.ok, false, JSON.stringify(raw));
    if (!r.ok) assert.match(r.problems.join("; "), field);
  }
});

test("unknown keys are dropped, not written into frontmatter", () => {
  const r = parseSaveRequest({ input: { ...input, injected: "x" }, mode: "create", taskId: "AGE-1" });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal("injected" in r.data.input, false);
});
