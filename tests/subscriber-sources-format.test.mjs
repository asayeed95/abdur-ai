import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const { escapeReportField, formatTable } = await import("../scripts/subscriber-sources.mjs");

function controlsIn(text) {
  const found = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp <= 0x1f || cp === 0x7f || (cp >= 0x80 && cp <= 0x9f)) found.push(cp);
  }
  return found;
}

test("synthetic attribution rows are one physical line and contain no raw controls", () => {
  const raw = `home\ninjected\r\u001b[2J\u0000\u007f\u0080\u009b\u009f`;
  const out = formatTable("By source_path", new Map([[raw, 2], ["plain", 1]]), 3);
  const lines = out.split("\n");
  assert.equal(lines.length, 5);
  const rows = lines.filter((line) => line.startsWith("  "));
  assert.equal(rows.length, 2);
  for (const line of lines) assert.deepEqual(controlsIn(line), []);
  assert.match(out, /\\x0a/);
  assert.match(out, /\\x0d/);
  assert.match(out, /\\x1b/);
  assert.match(out, /\\x00/);
  assert.match(out, /\\x7f/);
  assert.match(out, /\\x80/);
  assert.match(out, /\\x9b/);
  assert.match(out, /\\x9f/);
  assert.equal(escapeReportField("\n"), "\\x0a");
  const widthRow = formatTable("T", new Map([["\n", 3]]), 3).split("\n").at(-1);
  assert.equal(widthRow, `  ${"\\x0a".padEnd(7)}      3  100.0%`);
});

test("a symlinked report script still runs instead of exiting 0", () => {
  const script = fileURLToPath(new URL("../scripts/subscriber-sources.mjs", import.meta.url));
  const dir = mkdtempSync(path.join(tmpdir(), "age3654-sources-"));
  const link = path.join(dir, "subscriber-sources.mjs");
  symlinkSync(script, link);
  try {
    const result = spawnSync(process.execPath, [link], {
      encoding: "utf8",
      env: { ...process.env, RESEND_API_KEY: "" },
    });
    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stderr, /RESEND_API_KEY/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("empty report stays a single data line", () => {
  const out = formatTable("By utm_source", new Map(), 1);
  assert.equal(out.split("\n").at(-1), "  (no data)");
  assert.deepEqual(controlsIn(out.replaceAll("\n", "")), []);
});
