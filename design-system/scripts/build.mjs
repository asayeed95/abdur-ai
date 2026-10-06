#!/usr/bin/env node
// abdur.ai Design System 1.0 — build.
//
//   node design-system/scripts/build.mjs                 build + checks
//   node design-system/scripts/build.mjs --artifact DIR  also export the
//                                                        Design System artifact tree to DIR/project/
//
// 1. Parses tokens/*.css into tokens/tokens.json.
// 2. Drift check: tokens must equal app/globals.css + tailwind.config.ts (exit 1 if not).
// 3. Hex check: no colour hex outside tokens/ (exit 1 if found).
// 4. Writes components/<slug>.html, templates/<slug>.html, index.html.
// 5. Prints the contrast pass (assets/contrast.js, the same engine the browser test runs).

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { COMPONENTS } from "./components.mjs";
import { TEMPLATES } from "./templates.mjs";
import { scanUsage } from "./usage.mjs";

const DS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(DS, "..");
const read = (p) => fs.readFileSync(p, "utf8");
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
};
const VERSION = "1.1.0";
const UPDATED = "2026-10-02";
const errors = [];

// ---------- 1. Parse token CSS ----------
function parseBlocks(css) {
  const out = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{}@]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean))) {
    // Drop anything before the last statement end (e.g. "@tailwind utilities;").
    const selector = m[1].split(";").pop().trim().replace(/\s+/g, " ");
    const decls = {};
    for (const d of m[2].split(";")) {
      const i = d.indexOf(":");
      if (i < 0) continue;
      const k = d.slice(0, i).trim();
      if (k.startsWith("--")) decls[k] = d.slice(i + 1).trim();
    }
    if (Object.keys(decls).length) out.push({ selector, decls });
  }
  return out;
}
const scopeOf = (sel) =>
  sel === ':root, [data-theme="dark"]' ? "dark"
  : sel === '[data-theme="light"]' ? "light"
  : sel === ":root" ? "all"
  : sel === ':root[data-theme="dark"]' ? "dark-only"
  : sel;

const tokenFiles = ["colors", "type", "spacing", "motion"];
const parsed = Object.fromEntries(tokenFiles.map((f) => [f, parseBlocks(read(path.join(DS, "tokens", `${f}.css`)))]));

const channels = (v) => v.split(/\s+/).map(Number);
const hexOf = (c) => "#" + c.map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();

const color = { themes: ["dark", "light"], note: "RGB channel triples; consume as rgb(var(--c-<name>) / <alpha>).", tokens: {} };
for (const b of parsed.colors) {
  const scope = scopeOf(b.selector);
  for (const [k, v] of Object.entries(b.decls)) {
    const name = k.replace(/^--c-/, "");
    color.tokens[name] ??= { var: k };
    const alias = v.match(/^var\(--c-([a-z0-9-]+)\)$/)?.[1];
    const entry = alias ? { alias, raw: v } : { channels: v, hex: hexOf(channels(v)) };
    if (scope === "all") color.tokens[name].all = entry;
    else color.tokens[name][scope] = entry;
  }
}
// Resolve semantic aliases (--c-meta: var(--c-muted)) to the target's value in the same theme.
for (const t of Object.values(color.tokens)) {
  for (const th of ["dark", "light"]) {
    const e = t[th];
    if (!e?.alias) continue;
    const target = color.tokens[e.alias];
    const src = target?.[th] ?? target?.all;
    if (!src?.channels) errors.push(`alias ${t.var} (${th}) points at unknown --c-${e.alias}`);
    else Object.assign(e, { channels: src.channels, hex: src.hex });
  }
}
const flat = (file) => {
  const out = {};
  for (const b of parsed[file]) {
    const scope = scopeOf(b.selector);
    for (const [k, v] of Object.entries(b.decls)) {
      if (scope === "all") out[k] = v;
      else (out[`@${scope}`] ??= {})[k] = v;
    }
  }
  return out;
};
const pick = (obj, re) => Object.fromEntries(Object.entries(obj).filter(([k]) => re.test(k)));
const spacingAll = flat("spacing");
const tokensJson = {
  name: "abdur.ai",
  version: VERSION,
  updated: UPDATED,
  owner: "Abdur",
  generatedFrom: tokenFiles.map((f) => `design-system/tokens/${f}.css`),
  source: ["app/globals.css", "tailwind.config.ts", "app/layout.tsx"],
  color,
  type: flat("type"),
  spacing: pick(spacingAll, /^--space-/),
  radius: pick(spacingAll, /^--radius/),
  shadow: pick(spacingAll, /^--shadow-/),
  layout: pick(spacingAll, /^--(content|prose|nav|gutter|rule|focus)/),
  aitldr: pick(spacingAll, /^--aitldr-/),
  motion: flat("motion"),
};
write(path.join(DS, "tokens", "tokens.json"), JSON.stringify(tokensJson, null, 2) + "\n");

// ---------- 2. Drift check against the app ----------
const globals = read(path.join(REPO, "app", "globals.css"));
const gBlocks = parseBlocks(globals);
const gDark = gBlocks.find((b) => b.selector === ":root")?.decls ?? {};
const gLight = gBlocks.find((b) => b.selector === ':root[data-theme="light"]')?.decls ?? {};
const gAitldr = gBlocks.find((b) => b.selector === ":root" && b.decls["--aitldr-measure"])?.decls ?? {};
for (const [name, t] of Object.entries(color.tokens)) {
  if (t.all) {
    // good* (and any theme-independent token) must still match the app when the app declares it.
    for (const [th, g] of [["dark", gDark], ["light", gLight]]) if (t.var in g && g[t.var] !== (t.all.raw ?? t.all.channels)) errors.push(`drift: ${t.var} ${th} = "${t.all.raw ?? t.all.channels}", app = "${g[t.var]}"`);
    continue;
  }
  if (!t.dark || !t.light) { errors.push(`token ${t.var} is declared for ${t.dark ? "dark" : "light"} only in tokens/colors.css; declare both themes or move it to the theme-independent block`); continue; }
  const want = (e) => e?.raw ?? e?.channels;
  if (gDark[t.var] !== want(t.dark)) errors.push(`drift: ${t.var} dark = "${want(t.dark)}", app = "${gDark[t.var]}"`);
  if (gLight[t.var] !== want(t.light)) errors.push(`drift: ${t.var} light = "${want(t.light)}", app = "${gLight[t.var]}"`);
}
for (const k of new Set([...Object.keys(gDark), ...Object.keys(gLight)])) if (k.startsWith("--c-") && !color.tokens[k.slice(4)]) errors.push(`drift: ${k} exists in app/globals.css but not in tokens/colors.css`);
if (!Object.keys(tokensJson.aitldr).length) errors.push("drift: --aitldr-* tokens missing from tokens/spacing.css :root");
for (const [k, v] of Object.entries(tokensJson.aitldr)) {
  if (gAitldr[k] !== v) errors.push(`drift: ${k} = "${v}", app :root = "${gAitldr[k]}"`);
}
const tw = read(path.join(REPO, "tailwind.config.ts"));
for (const n of ["good", "good-2", "good-3"]) {
  const m = tw.match(new RegExp(`"?${n}"?:\\s*"(#[0-9A-Fa-f]{6})"`));
  const want = color.tokens[n]?.all?.hex;
  if (!m || m[1].toUpperCase() !== want) errors.push(`drift: ${n} = ${want}, tailwind.config.ts = ${m?.[1]}`);
}
if (!tw.includes('"heroIn 0.6s cubic-bezier(0.2, 0.7, 0.2, 1)"')) errors.push("drift: hero-in animation string changed in tailwind.config.ts");
if (!tw.includes('"pulseClay 2.4s ease-in-out infinite"')) errors.push("drift: pulse-clay animation string changed in tailwind.config.ts");
if (!/transition: opacity 0\.6s cubic-bezier\(0\.2, 0\.7, 0\.2, 1\)/.test(globals)) errors.push("drift: data-reveal transition changed in app/globals.css");

// ---------- 4. Generate pages ----------
const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
const head = (title, depth) => {
  const up = "../".repeat(depth);
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — abdur.ai Design System</title>
${FONTS}
<link rel="stylesheet" href="${up}tokens/colors.css">
<link rel="stylesheet" href="${up}tokens/type.css">
<link rel="stylesheet" href="${up}tokens/spacing.css">
<link rel="stylesheet" href="${up}tokens/motion.css">
<link rel="stylesheet" href="${up}components/components.css">
<link rel="stylesheet" href="${up}assets/preview.css">
</head>`;
};
const crumbs = (depth) => {
  const up = "../".repeat(depth);
  return `<nav class="ds-crumbs" aria-label="Design system"><a href="${up}index.html">Index</a><a href="${up}foundations.html">Foundations</a><a href="${up}tests/contrast.test.html">Contrast test</a></nav>`;
};
const md = (s) => s.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

for (const c of COMPONENTS) {
  const body = c.html();
  write(path.join(DS, "components", `${c.slug}.html`), `${head(c.name, 1)}
<body>
<div class="ds-shell">
  <div class="ds-head">
    <div>${crumbs(1)}<h1>${c.name}</h1><p>${md(c.summary)}</p><p class="ds-src">Source: ${c.source}</p></div>
  </div>
  <div class="ds-panels${c.wide ? " stacked" : ""}">
    <section class="ds-panel" data-theme="dark"><span class="ds-state ds-panel-label">Dark (default)</span>${body}</section>
    <section class="ds-panel" data-theme="light"><span class="ds-state ds-panel-label">Light</span>${body}</section>
  </div>
  <ul class="ds-guide">${c.guide.map((g) => `<li>${md(g)}</li>`).join("")}</ul>
</div>
</body>
</html>
`);
}

// Post visuals (Figure, diagrams, interactive blocks): rendered from the real
// components, styled by a generated assets/post-visuals.css. See post-visuals.mjs.
const { buildPostVisuals } = await import("./post-visuals.mjs");
const VISUALS = await buildPostVisuals({ REPO, DS });
for (const c of VISUALS) {
  const body = c.html();
  write(path.join(DS, "components", `${c.slug}.html`), `${head(c.name, 1).replace("</head>", '<link rel="stylesheet" href="../assets/post-visuals.css">\n</head>')}
<body>
<div class="ds-shell">
  <div class="ds-head">
    <div>${crumbs(1)}<h1>${c.name}</h1><p>${md(c.summary)}</p><p class="ds-src">Source: ${c.source} · rendered from the component by scripts/post-visuals.mjs</p></div>
  </div>
  <div class="ds-panels">
    <section class="ds-panel" data-theme="dark"><span class="ds-state ds-panel-label">Dark (default)</span><div style="max-width:var(--prose-max)">${body}</div></section>
    <section class="ds-panel" data-theme="light"><span class="ds-state ds-panel-label">Light</span><div style="max-width:var(--prose-max)">${body}</div></section>
  </div>
  <ul class="ds-guide">${c.guide.map((g) => `<li>${md(g)}</li>`).join("")}</ul>
</div>
</body>
</html>
`);
}

const postCount = fs.readdirSync(path.join(REPO, "content", "posts")).filter((f) => f.endsWith(".mdx")).length;
const templates = TEMPLATES({ postCount });
for (const t of templates) {
  write(path.join(DS, "templates", `${t.slug}.html`), `${head(`${t.name} (${t.route})`, 1)}
<body>
${t.html}
<script src="../assets/theme.js"></script>
</body>
</html>
`);
}

write(path.join(DS, "index.html"), `${head("Index", 0)}
<body>
<div class="ds-shell">
  <div class="ds-head"><div>${crumbs(0)}<h1>abdur.ai Design System ${VERSION}</h1><p>Tokens, components and templates extracted from the abdur.ai codebase. Owner: Abdur. Last updated ${UPDATED}. Rules and token table: DESIGN-SYSTEM.md.</p></div></div>
  <p class="eyebrow" style="margin:var(--space-8) 0 var(--space-4)">/// Foundations</p>
  <ul class="ds-index"><li><a class="card" href="foundations.html"><h3 class="card-title">Foundations</h3><p class="card-body">Colour, contrast, type, spacing, radius, shadow, motion.</p></a></li>
  <li><a class="card" href="tests/contrast.test.html"><h3 class="card-title">Contrast test</h3><p class="card-body">Every text-on-surface pair, both themes, plus the known risks.</p></a></li></ul>
  <p class="eyebrow" style="margin:var(--space-12) 0 var(--space-4)">/// Components</p>
  <ul class="ds-index">${COMPONENTS.map((c) => `<li><a class="card" href="components/${c.slug}.html"><h3 class="card-title">${c.name}</h3><p class="card-body">${md(c.summary)}</p></a></li>`).join("")}</ul>
  <p class="eyebrow" style="margin:var(--space-12) 0 var(--space-4)">/// Post visuals</p>
  <ul class="ds-index">${VISUALS.map((c) => `<li><a class="card" href="components/${c.slug}.html"><h3 class="card-title">${c.name}</h3><p class="card-body">${md(c.summary)}</p></a></li>`).join("")}</ul>
  <p class="eyebrow" style="margin:var(--space-12) 0 var(--space-4)">/// Templates</p>
  <ul class="ds-index">${templates.map((t) => `<li><a class="card" href="templates/${t.slug}.html"><h3 class="card-title">${t.name}</h3><p class="card-body"><code class="code-inline">${t.route}</code> · ${t.source}</p></a></li>`).join("")}</ul>
</div>
</body>
</html>
`);

// ---------- DESIGN-SYSTEM.md token table (between markers; channels, never hex) ----------
{
  const ROLE = {
    bg: "Page ground", "bg-2": "Recessed section", surface: "Card, input, code", "surface-2": "Menu hover",
    border: "Hairline", "border-2": "Strong hairline", text: "Primary text", "text-soft": "Prose body",
    muted: "Borders, input boundary (not text)", "muted-2": "Rules, dots (not text)", "muted-3": "Rules, dots (not text)", "muted-4": "Non-text only",
    clay: "The accent", gold: "Highlight only, on surface", good: "Status fill (not text)", "good-2": "Status (unused)", "good-3": "Status border",
    meta: "Alias: all secondary text", "good-text": "Alias: success text", band: "Alias: section/aside ground",
  };
  const rowsMd = Object.entries(color.tokens).map(([n, t]) =>
    `| \`${t.var}\` | ${t.all ? t.all.channels : t.dark?.raw ?? t.dark?.channels ?? "MISSING"} | ${t.all ? "(same)" : t.light?.raw ?? t.light?.channels ?? "MISSING"} | ${ROLE[n] ?? ""} |`);
  const kv = (o) => Object.entries(o).map(([k, v]) => `\`${k}\` ${v}`).join(" · ");
  const table = [
    "| Colour | Dark | Light | Role |", "| --- | --- | --- | --- |", ...rowsMd, "",
    "| Family | Tokens |", "| --- | --- |",
    `| Type | ${kv(pick(tokensJson.type, /^--font-(display|body|mono)$/))} |`,
    `| Type scale | ${kv(pick(tokensJson.type, /^--text-/))} |`,
    `| Spacing | ${kv(tokensJson.spacing)} |`,
    `| Radius | ${kv(tokensJson.radius)} |`,
    `| Shadow | ${kv(tokensJson.shadow)} |`,
    `| Layout | ${kv(tokensJson.layout)} |`,
    `| Motion | ${kv(pick(tokensJson.motion, /^--(ease-clay|motion-(hero-in|reveal|pulse)-(duration|distance))$/))} · pulse-clay \`2.4s ease-in-out infinite\` |`,
  ].join("\n");
  const mdPath = path.join(DS, "DESIGN-SYSTEM.md");
  const doc = read(mdPath).replace(/<!-- tokens:start -->[\s\S]*<!-- tokens:end -->/, `<!-- tokens:start -->\n${table}\n<!-- tokens:end -->`);
  write(mdPath, doc);
}

// ---------- Usage scan: the 1.1 contrast rules, enforced in the app ----------
// Each rule names a class pattern that would put a token on a ground it fails on.
// `pair` rules need two classes in a parent/child relationship; in .tsx they are
// checked across the JSX tree by scripts/usage.mjs, and line-based elsewhere.
// --usage-dir DIR (repeatable) replaces the default dirs (used by tests/usage-hierarchy.test.mjs).
const USAGE_RULES = [
  { re: /(?<![\w-])text-muted(-[234])?(?![\w-])/, msg: "muted ramp used for text — use text-meta" },
  { re: /(?<![\w-])text-good(?![\w-])/, msg: "text-good fails in light (1.56–1.87:1) — use text-good-text" },
  { pair: true, re: /(?<![\w-])bg-(bg-2|surface-2)(?![\w-]).*(?<![\w-])(text-clay|text-gold|eyebrow)(?![\w-])|(?<![\w-])(text-clay|text-gold|eyebrow)(?![\w-]).*(?<![\w-])bg-(bg-2|surface-2)(?![\w-])/, msg: "clay/gold text on bg-2/surface-2 fails in light — use bg-band" },
  { pair: true, re: /focus:border-clay/, also: /(?<![\w-])border-border(?![\w-])/, msg: "input boundary in border fails 3:1 — use border-muted" },
];
const usageDirs = process.argv.flatMap((a, i) => (a === "--usage-dir" && process.argv[i + 1] ? [path.resolve(process.argv[i + 1])] : []));
const tsxFiles = [];
for (const dir of usageDirs.length ? usageDirs : ["app", "components", "lib"].map((d) => path.join(REPO, d))) {
  for (const f of walk(dir)) {
    if (!/\.(tsx?|css|mdx?)$/.test(f)) continue;
    const isTsx = f.endsWith(".tsx");
    if (isTsx) tsxFiles.push(f);
    read(f).split("\n").forEach((line, i) => {
      for (const r of USAGE_RULES) {
        if (r.pair && isTsx) continue;
        if (r.re.test(line) && (!r.also || r.also.test(line))) errors.push(`usage: ${path.relative(REPO, f)}:${i + 1} ${r.msg}`);
      }
    });
  }
}
errors.push(...scanUsage(tsxFiles, { colorNames: Object.keys(color.tokens), rel: (f) => path.relative(REPO, f) }));

// ---------- 3. Hex check ----------
const HEX = /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g;
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
for (const f of walk(DS)) {
  const rel = path.relative(DS, f);
  if (rel.startsWith("tokens" + path.sep) || !/\.(html|css|js|mjs|md)$/.test(f)) continue;
  const lines = read(f).split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(HEX)) errors.push(`hex outside the token file: ${rel}:${i + 1} ${m[0]}`);
  });
}

// ---------- 5. Contrast ----------
const ctx = {};

vm.runInNewContext(read(path.join(DS, "assets", "contrast.js")), ctx);
const C = ctx.DSContrast;
const live = { dark: {}, light: {} };
for (const [name, t] of Object.entries(color.tokens)) {
  for (const th of ["dark", "light"]) { const src = t.all ?? t[th]; live[th][name] = src?.channels ? channels(src.channels) : null; }
}
const layout = {
  dark: { ...tokensJson.aitldr },
  light: { ...tokensJson.aitldr },
};
const rows = C.evaluate(live);
const risks = C.riskResults(rows, layout);
const text = rows.filter((r) => r.kind === "text"), ui = rows.filter((r) => r.kind === "ui");
const count = (rs) => `${rs.filter((r) => r.pass).length} pass / ${rs.filter((r) => !r.pass).length} fail`;
console.log(`\nContrast — text 4.5:1: ${count(text)} · non-text 3:1: ${count(ui)}`);
for (const r of rows.filter((r) => !r.pass)) {
  console.log(`  FAIL ${r.theme.padEnd(5)} ${r.fg.padEnd(9)} on ${r.bg.padEnd(9)} ${r.ratio == null ? "missing" : r.ratio.toFixed(2) + ":1"} (min ${r.min}${r.kind === "text" && r.large ? ", passes 3:1 large" : ""})`);
}
console.log("Not for text (reference only):");
const nft = C.notForText(live);
for (const t of nft) console.log(`  ${t.fg.padEnd(8)} dark ${t.dark} · light ${t.light} — ${t.rule}`);
console.log("Known risks:");
for (const k of risks) console.log(`  ${k.pass ? "PASS" : "FAIL"} ${k.label} — ${k.detail}`);
write(path.join(DS, "tests", "contrast-results.json"), JSON.stringify({ generated: UPDATED, summary: { text: count(text), ui: count(ui) }, rows, notForText: nft, risks }, null, 2) + "\n");

// ---------- 6. Artifact export ----------
const ai = process.argv.indexOf("--artifact");
if (ai > -1) {
  if (!process.argv[ai + 1]) {
    console.error("--artifact needs a directory");
    process.exit(1);
  }
  const { exportArtifact } = await import("./artifact.mjs");
  exportArtifact({ out: path.resolve(process.argv[ai + 1]), DS, visuals: VISUALS, REPO, color, tokensJson, rows, risks, C, templates, VERSION, UPDATED, liveTokens: live });
}

if (errors.length) {
  console.error(`\n${errors.length} error(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log(`\nOK — tokens.json, ${COMPONENTS.length} component previews, ${VISUALS.length} post-visual previews, ${templates.length} templates, index.html. No drift, no stray hex.`);
