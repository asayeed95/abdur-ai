import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publisher = path.join(root, "scripts", "tldr-publish.mjs");

test("adversarial JS frontmatter is rejected without executing", () => {
  const cases = ["---js", "---javascript", "--- js"];
  for (const [index, opener] of cases.entries()) {
    const slug = `zz-age3654-js-sentinel-${index}`;
    const draft = path.join(root, "content", "posts", "_drafts", `${slug}.mdx`);
    const published = path.join(root, "content", "posts", `${slug}.mdx`);
    const dir = mkdtempSync(path.join(tmpdir(), "age3654-js-"));
    const sentinel = path.join(dir, "executed");
    const payload = [
      opener,
      `({ title: require("node:fs").writeFileSync(${JSON.stringify(sentinel)}, "executed") || "t" })`,
      "---",
      "",
      "body",
      "",
    ].join("\n");
    writeFileSync(draft, payload);
    try {
      const result = spawnSync(process.execPath, [publisher, slug], { encoding: "utf8" });
      assert.notEqual(result.status, 0, result.stdout + result.stderr);
      assert.equal(existsSync(sentinel), false, `${opener} executed frontmatter`);
      assert.equal(existsSync(published), false);
      assert.equal(existsSync(draft), true);
      assert.match(result.stderr, /frontmatter/i);
    } finally {
      rmSync(draft, { force: true });
      rmSync(published, { force: true });
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test("recovery command replays adversarial titles as argv without substitution", async () => {
  const { formatManualRecoveryCommand, receiptSummary } = await import("../scripts/tldr-publish.mjs");
  const dir = mkdtempSync(path.join(tmpdir(), "age3654-sh-"));
  const bin = path.join(dir, "bin");
  const sentinel = path.join(dir, "pwned");
  const argvOut = path.join(dir, "argv.json");
  mkdirSync(bin);
  const stub = path.join(bin, "node");
  writeFileSync(
    stub,
    "#!/usr/bin/env python3\nimport json, os, sys\nopen(os.environ['ARGV_OUT'], 'w').write(json.dumps(sys.argv[1:]))\n",
  );
  chmodSync(stub, 0o755);
  const scriptPath = path.join(dir, "receipt's dir", "receipt.mjs");
  const title = `cost $(touch ${sentinel}) \`touch ${sentinel}\` 'single' "double" and spaces`;
  const summary = receiptSummary("sample-slug", title);
  assert.match(summary, /\$\(touch /);
  assert.match(summary, /`touch /);
  assert.doesNotMatch(summary, /\n/);
  const command = formatManualRecoveryCommand({
    receiptScript: scriptPath,
    idempotencyKey: "abdurai:content_publish:writing:sample-slug",
    summary,
  });
  try {
    const result = spawnSync("sh", ["-c", command], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ARGV_OUT: argvOut },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(sentinel), false);
    assert.deepEqual(JSON.parse(readFileSync(argvOut, "utf8")), [
      scriptPath,
      "--kind",
      "content_publish",
      "--status",
      "success",
      "--key",
      "abdurai:content_publish:writing:sample-slug",
      "--summary",
      summary,
      "--channel",
      "manual",
      "--agent",
      "tldr-publish.mjs",
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("YAML envelope parses ordinary frontmatter and does not eval a JS tag", async () => {
  const { extractYamlEnvelope, parseYamlFrontmatter } = await import("../scripts/tldr-publish.mjs");
  const ordinary = [
    "---",
    "title: A plain title",
    "date: 2026-01-02",
    "description: A dek",
    "register: argued",
    "---",
    "",
    "Body",
    "",
  ].join("\n");
  const envelope = extractYamlEnvelope(ordinary);
  const data = parseYamlFrontmatter(envelope.yaml);
  assert.equal(data.title, "A plain title");
  assert.equal(data.register, "argued");
  assert.ok(!Number.isNaN(new Date(data.date).getTime()));

  const quotedSentinel = ["---", 'title: "---js"', "---", "", "x", ""].join("\n");
  assert.equal(parseYamlFrontmatter(extractYamlEnvelope(quotedSentinel).yaml).title, "---js");

  const dir = mkdtempSync(path.join(tmpdir(), "age3654-tag-"));
  const sentinel = path.join(dir, "executed");
  const tagged = [
    "---",
    `title: !!js/function 'function () { require("node:fs").writeFileSync(${JSON.stringify(sentinel)}, "x") }'`,
    "---",
    "",
  ].join("\n");
  try {
    assert.throws(() => parseYamlFrontmatter(extractYamlEnvelope(tagged).yaml));
    assert.equal(existsSync(sentinel), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publisher source keeps the argv spawn and stays off gray-matter dispatch", () => {
  const source = readFileSync(publisher, "utf8");
  assert.match(source, /spawnSync\(\s*\n?\s*process\.execPath,/);
  assert.doesNotMatch(source, /shell:\s*true/);
  assert.doesNotMatch(source, /\bmatter\s*\(/);
  assert.match(source, /engines\.yaml\.parse/);
  assert.match(source, /formatManualRecoveryCommand/);
});
