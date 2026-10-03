#!/usr/bin/env node
// Negative test for the hierarchy-aware usage check (scripts/usage.mjs).
//
//   node design-system/tests/usage-hierarchy.test.mjs
//
// Writes scratch .tsx fixtures to a temp dir, runs build.mjs with
// --usage-dir pointed at them, and asserts that parent/child violations fail
// the build while the safe patterns (bg-band reset, opaque className, sibling
// on the same line, hidden input) do not.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts", "build.mjs");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ds-usage-"));

const BAD = `import { cn } from "@/lib/cn";
export function Bad({ open }: { open: boolean }) {
  return (
    <div>
      <section className="bg-bg-2 py-12">
        <div className="max-w-xl">
          <p className="font-mono text-clay">clay on bg-2, two levels down</p>
        </div>
      </section>
      <div className="text-gold">
        <div className={\`px-4 \${open ? "bg-surface-2" : "bg-band"}\`}>
          <span>inherited gold on a surface-2 branch</span>
        </div>
      </div>
      <aside className={cn("bg-bg-2", open && "py-4")}>
        <h2 className="eyebrow">eyebrow on bg-2</h2>
      </aside>
      <textarea className="bg-surface border border-border focus:border-clay" />
      <label className="flex border border-border focus-within:border-clay">
        <input type="email" className="border-0 bg-transparent" />
      </label>
    </div>
  );
}
`;

const GOOD = `export function Good({ styles, rest }: { styles: string; rest: object }) {
  return (
    <div>
      <section className="bg-bg-2">
        <div className="bg-band">
          <p className="text-clay">band resets the ground</p>
        </div>
        <div className={styles}>
          <p className="text-clay">opaque ground: not judged</p>
        </div>
        <div {...rest}>
          <p className="text-clay">spread may carry a ground: not judged</p>
        </div>
      </section>
      <div className="bg-bg-2" /><p className="text-clay">sibling, not a child</p>
      <input type="email" className="border border-muted focus:border-clay" />
      <input type="hidden" name="list" value="x" />
      <input className={styles} />
    </div>
  );
}
`;

const run = (name, src) => {
  const dir = path.join(tmp, name);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, `${name}.tsx`), src);
  const r = spawnSync(process.execPath, [BUILD, "--usage-dir", dir], { encoding: "utf8" });
  return { status: r.status, usage: (r.stderr + r.stdout).split("\n").map((l) => l.trim()).filter((l) => l.startsWith("usage:")) };
};

let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) failed++; };

const bad = run("bad", BAD);
console.log(bad.usage.map((l) => "  " + l).join("\n"));
check(bad.status === 1, `parent/child fixture fails the build (exit ${bad.status})`);
check(bad.usage.some((l) => /bad\.tsx:7 text-clay \(line 7\) on bg-bg-2 \(line 5\)/.test(l)), "text-clay two levels under bg-bg-2");
check(bad.usage.some((l) => /bad\.tsx:11 text-gold \(line 10\) on bg-surface-2 \(line 11\)/.test(l)), "inherited text-gold over a bg-surface-2 ternary branch");
check(bad.usage.some((l) => /bad\.tsx:16 text-clay \(line 16\) on bg-bg-2 \(line 15\)/.test(l)), ".eyebrow under cn(\"bg-bg-2\")");
check(bad.usage.some((l) => /bad\.tsx:18 <textarea> boundary is border-border/.test(l)), "textarea drawn in border-border");
check(bad.usage.some((l) => /bad\.tsx:20 <input> sits in a focus-within boundary \(line 19\) drawn in border-border/.test(l)), "input inside a border-border focus-within wrapper");
check(bad.usage.length === 5, `exactly 5 usage errors (got ${bad.usage.length})`);

const good = run("good", GOOD);
if (good.usage.length) console.log(good.usage.map((l) => "  " + l).join("\n"));
check(good.status === 0 && good.usage.length === 0, `safe patterns pass (exit ${good.status}, ${good.usage.length} usage errors)`);

fs.rmSync(tmp, { recursive: true, force: true });
if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log("\nOK — hierarchy-aware usage check catches parent/child violations without flagging opaque or reset grounds.");
