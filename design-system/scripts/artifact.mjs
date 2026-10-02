// abdur.ai Design System 1.0 — export to the Design System artifact format.
// Called by build.mjs --artifact DIR. Writes DIR/project/… : tokens.json (the
// artifact's list-shaped grammar), README.md, components/bundle.css, one
// components/<Name>/{README.md,preview.html} per component, the templates as
// showcase cards, the cover, and the index design-system.json.
//
// The artifact page compiles tokens.json into full-colour custom properties
// named after the Tailwind classes (--clay, --bg-2 …), so the CSS is rewritten:
//   rgb(var(--c-x))        → var(--x)
//   rgb(var(--c-x) / 0.4)  → color-mix(in srgb, var(--x) 40%, transparent)

import fs from "node:fs";
import path from "node:path";
import { COMPONENTS } from "./components.mjs";

const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
};

export function toArtifactCss(s) {
  return s
    .replace(/rgb\(var\(--c-([a-z0-9-]+)\)\s*\/\s*([0-9.]+)\)/g, (_, n, a) => `color-mix(in srgb, var(--${n}) ${+(parseFloat(a) * 100).toFixed(1)}%, transparent)`)
    .replace(/rgb\(var\(--c-([a-z0-9-]+)\)\)/g, (_, n) => `var(--${n})`);
}

const COLOR_USAGE = {
  bg: "Page ground. Default for every route.",
  "bg-2": "Recessed sections: Subscribe, flagship card, quiet callout.",
  surface: "Cards, inputs, code, prev/next cards, row hover fill.",
  "surface-2": "Menu row hover (HireActions). Same value as bg-2 in light. No clay or gold text.",
  band: "Alias. Alternating sections, asides, flagship card: bg-2 in dark, surface in light. The only banded ground clay and gold text may sit on.",
  muted: "Not for text since 1.1 (light 3.68–4.41:1). Borders: input boundary (3:1+ on every ground).",
  "muted-2": "Not for text since 1.1. Rules and dots.",
  "muted-3": "Not for text since 1.1. Rules and dots.",
  "muted-4": "Non-text only.",
  good: "Not for text since 1.1 (light 1.56–1.87:1). Fills and dots; text uses good-text.",
  border: "Hairlines: dividers, card and input borders, footer rules.",
  "border-2": "Stronger hairline: status-near pill border.",
  "good-2": "Defined in tailwind.config.ts; no use in app code today.",
  "good-3": "status-flight pill border; NowPanel running fill (30%).",
};

export function exportArtifact({ out, DS, color, tokensJson, rows, risks, C, templates, VERSION, UPDATED, liveTokens }) {
  const P = (...p) => path.join(out, "project", ...p);
  const read = (p) => fs.readFileSync(path.join(DS, p), "utf8");
  const files = [];
  const put = (rel, s) => { write(P(rel), s); files.push(`project/${rel}`); };

  // ---- tokens.json ----
  const fmt = (r) => r.toFixed(2);
  const usageFor = (name) => {
    const t = C.TEXT_TOKENS.find((x) => x.fg === name);
    if (!t) return COLOR_USAGE[name] ?? "";
    const parts = ["dark", "light"].map((th) => {
      const rs = rows.filter((r) => r.kind === "text" && r.theme === th && r.fg === name);
      const lo = Math.min(...rs.map((r) => r.ratio)), hi = Math.max(...rs.map((r) => r.ratio));
      return `${th} ${fmt(lo)}–${fmt(hi)}:1`;
    });
    return `Text: ${t.use}. Allowed on ${t.grounds.join(", ")}: ${parts.join("; ")}.`;
  };
  const order = ["bg", "bg-2", "band", "surface", "surface-2", "border", "border-2", "text", "text-soft", "meta", "muted", "muted-2", "muted-3", "muted-4", "clay", "gold", "good-text", "good", "good-2", "good-3"];
  const colorTokens = order.map((name) => {
    const t = color.tokens[name];
    const v = (e) => (e.alias ? `{${e.alias}}` : e.hex.toLowerCase());
    const value = t.all ? v(t.all) : { dark: v(t.dark), light: v(t.light) };
    let usage = usageFor(name);
    if (name === "clay") usage = `The only accent: primary buttons, eyebrows, links, focus ring, selection, active nav. ${usage}`;
    if (name === "gold") usage = `Highlights only, never buttons. ${usage}`;
    if (t.all) usage = `Theme-independent (tailwind.config.ts). ${usage}`;
    return { name, value, usage: `${usage} Code: rgb(var(${t.var})).` };
  });
  const px = (rem) => `${parseFloat(rem) * 16}px`;
  const ty = tokensJson.type;
  const style = (name, size, lh, extra = {}) => ({ name, fontSize: size, lineHeight: lh, ...extra });
  const artifactTokens = {
    name: "abdur.ai",
    version: 1,
    meta: {
      source: "github",
      repo: "asayeed95/abdur-ai",
      ref: "main@4e7891a",
      paths: { tokens: ["app/globals.css", "tailwind.config.ts"], fonts: ["app/layout.tsx"], docs: ["design-system/DESIGN-SYSTEM.md"] },
      synced: UPDATED,
      note: `Design System ${VERSION}. Mirrors design-system/tokens/*.css in the repo.`,
    },
    color: {
      themes: [{ id: "dark", name: "Dark (default)" }, { id: "light", name: "Light" }],
      tokens: colorTokens,
    },
    type: {
      fonts: [],
      families: {
        display: '"Playfair Display", ui-serif, Georgia, serif',
        body: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
        mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      },
      groups: [
        {
          name: "Display", family: "display",
          styles: [
            style("hero", "116px", 0.96, { letterSpacing: "-0.02em", fontWeight: 800, sample: "I ship AI things", usage: "Home hero h1 only. Fluid: clamp(48px, 8.5vw, 116px)." }),
            style("page-h1", px(ty["--text-7xl"]), 1, { letterSpacing: "-0.025em", fontWeight: 400, sample: "The logbook.", usage: "Index and page h1: text-5xl, text-7xl from md." }),
            style("post-h1", px(ty["--text-6xl"]), 1.04, { letterSpacing: "-0.025em", fontWeight: 400, sample: "What is an agent memory layer?", usage: "Post title: text-4xl, text-6xl from md." }),
            style("h2", px(ty["--text-4xl"]), "40px", { letterSpacing: "-0.025em", fontWeight: 400, sample: "A second-level heading", usage: "Prose h2: text-3xl, text-4xl from md." }),
            style("h3", px(ty["--text-2xl"]), "32px", { letterSpacing: "-0.025em", fontWeight: 400, sample: "A third-level heading", usage: "Prose h3, empty-state line." }),
            style("card-title", px(ty["--text-xl"]), "28px", { fontWeight: 400, sample: "Northsun", usage: "Card titles." }),
          ],
        },
        {
          name: "Text", family: "body",
          styles: [
            style("body-lg", px(ty["--text-lg"]), 1.625, { fontWeight: 400, sample: "When I learn it the hard way, you get the TLDR the same week.", usage: "Prose paragraphs and ledes; text-soft in prose, muted in ledes." }),
            style("body", px(ty["--text-base"]), "24px", { fontWeight: 400, sample: "Every piece declares what kind of claim it is making.", usage: "Default body, deks." }),
            style("small", px(ty["--text-sm"]), "20px", { fontWeight: 400, sample: "Made in NJ. Shipped at 2am.", usage: "Card body, footer tagline." }),
          ],
        },
        {
          name: "Mono", family: "mono",
          styles: [
            style("eyebrow", px(ty["--text-xs"]), "16px", { letterSpacing: "0.1em", fontWeight: 400, sample: "/// WRITING", usage: "Uppercase, clay (.eyebrow) or muted (.eyebrow-muted). Also buttons and post dates." }),
            style("nav", "11px", "16px", { letterSpacing: "0.1em", fontWeight: 400, sample: "SHIP LOG", usage: "Nav links and the nav CTA, uppercase." }),
            style("micro", "10px", "15px", { letterSpacing: "0.05em", fontWeight: 400, sample: "TESTFLIGHT", usage: "Status pills, #tags, register badges, footer legal. Uppercase." }),
            style("code", px(ty["--text-sm"]), "20px", { fontWeight: 400, sample: "rgb(var(--c-clay) / 0.4)", usage: "Inline code and code blocks." }),
          ],
        },
      ],
    },
    spacing: { tokens: Object.entries(tokensJson.spacing).map(([k, v]) => ({ name: k.slice(2), value: v, usage: { "--space-1": "Pill vertical rhythm, tight gaps.", "--space-2": "Tag gaps, badge padding.", "--space-3": "Button vertical padding, form gap.", "--space-4": "Button horizontal padding, card grid gap.", "--space-6": "Card padding, gutter.", "--space-8": "Callout padding, footer column gap.", "--space-12": "Footer vertical padding, section heading gap.", "--space-16": "Subscribe section padding, h2 top margin in prose." }[k] })) },
    radius: { tokens: Object.entries(tokensJson.radius).map(([k, v]) => ({ name: k.slice(2), value: v, usage: { "--radius-sm": "Buttons, inputs, pills, badges (most used).", "--radius": "Inline code.", "--radius-md": "Mid-size controls (HireActions).", "--radius-lg": "Cards, code blocks, callouts, prev/next.", "--radius-full": "Dots, theme toggle." }[k] })) },
    shadow: {
      note: "The site is border-first; only two components cast a shadow.",
      tokens: Object.entries(tokensJson.shadow).map(([k, v]) => ({ name: k.slice(2), value: v.replace(/rgba\(([^)]+)\)/g, (_, a) => `rgba(${a.replace(/\s+/g, "")})`), usage: k === "--shadow-pop" ? "Floating menus (HireActions)." : "Card hover glow (ToolsGrid). Dark clay in both themes, as in code." })),
    },
  };
  put("tokens.json", JSON.stringify(artifactTokens, null, 2) + "\n");

  // ---- bundle.css ----
  const strip = (css, re) => css.split("\n").filter((l) => !re.test(l)).join("\n");
  const spacingCss = strip(read("tokens/spacing.css"), /^\s*--(space-|radius|shadow-)/);
  const bundle = [
    "@import url(https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;500;600;700;800&display=swap);",
    "/* abdur.ai Design System — component stylesheet. Generated by design-system/scripts/build.mjs; edit the repo sources, not this file. */",
    read("tokens/type.css"),
    spacingCss,
    read("tokens/motion.css"),
    read("components/components.css"),
    read("assets/preview.css"),
    ".ds-pad { padding: var(--space-6); }",
  ].map(toArtifactCss).join("\n\n");
  put("components/bundle.css", bundle);

  // ---- components ----
  const doc = (marker, title, body) => `${marker}
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
${body}
</body>
</html>
`;
  for (const c of COMPONENTS) {
    put(`components/${c.name}/preview.html`, doc(`<!-- @dsCard group="${c.group}" height=${c.height} -->`, `${c.name} — preview`, `<div class="ds-pad">${toArtifactCss(c.html())}</div>`));
    put(`components/${c.name}/README.md`, `# ${c.name}\n\n${c.summary}\n\nSource: \`${c.source}\`. Local preview with both themes side by side: \`design-system/components/${c.slug}.html\`.\n\n${c.guide.map((g) => `- ${g}`).join("\n")}\n`);
  }
  for (const t of templates) {
    const name = `Template${t.slug[0].toUpperCase()}${t.slug.slice(1)}`;
    put(`components/${name}/preview.html`, doc(`<!-- @dsCard group="Templates" height=${t.height} width=1280 subtitle="${t.route}" page -->`, `${t.name} — ${t.route}`, toArtifactCss(t.html)));
  }

  // ---- cover ----
  put("components/Cover/preview.html", `<!-- @dsCard height=288 -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>abdur.ai Design System</title>
<style>
  html, body { margin: 0; height: 100%; }
  body { background: var(--bg); color: var(--text); overflow: hidden; }
  .cover { position: relative; width: 960px; height: 288px; overflow: hidden; }
  .band { position: absolute; top: 0; left: 0; width: 960px; height: 112px; }
  .clay { fill: var(--clay); }
  .ink { fill: var(--text); }
  .gold { fill: var(--gold); }
  .muted { fill: var(--muted); }
  .cut { fill: var(--bg); font-family: var(--font-display); font-size: 176px; }
  .rule { fill: var(--clay); }
  .r { rx: var(--radius-sm); }
  .name { position: absolute; left: 40px; top: 152px; width: 880px; margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 64px; line-height: 0.95; letter-spacing: -0.025em; color: var(--text); white-space: nowrap; }
  .tagline { position: absolute; left: 40px; top: 232px; margin: 0; max-width: 440px; font-family: var(--font-body); font-size: 14px; line-height: 20px; color: var(--muted); }
</style>
</head>
<body>
<div class="cover">
  <!--
    blocks: clay 512×112 (identity), text 64×112 (ink), gold 48×64 (highlight only), muted 248×32 — sides are space-16 / space-12 / space-8 multiples, corners radius-sm.
    arrangement: top-band skeleton, a strip of unequal bands bleeding off the top and right edges; the name is too wide for the 440px zone ("abdur.ai Design System").
    pattern: distinctive display face → the hero's "AS" monogram in Playfair, cut out of the clay slab in the bg ground, as the site's watermark does.
    scales: gaps space-4 (16), inset 40 (gutter-md), rule 60×2 (rule-accent), radius-sm on every block.
  -->
  <svg class="band" viewBox="0 0 960 112" aria-hidden="true">
    <rect class="ink r" x="40" y="-8" width="64" height="120"/>
    <rect class="clay r" x="120" y="-8" width="512" height="120"/>
    <text class="cut" x="392" y="150">AS</text>
    <rect class="gold r" x="648" y="-8" width="48" height="72"/>
    <rect class="muted r" x="712" y="-8" width="256" height="40"/>
  </svg>
  <p class="name">abdur.ai Design System</p>
  <p class="tagline">I ship AI things and write the TLDR.</p>
</div>
</body>
</html>
`);

  // ---- README ----
  const text = rows.filter((r) => r.kind === "text"), ui = rows.filter((r) => r.kind === "ui");
  const n = (rs, p) => rs.filter((r) => r.pass === p).length;
  const failing = rows.filter((r) => !r.pass);
  const readme = `abdur.ai is a personal site and logbook for a solo AI founder: what shipped, what broke, what was learned. The system is small on purpose. It locks what the code already does and adds nothing. Version ${VERSION}, owner Abdur, last updated ${UPDATED}.

## The five rules

1. No hex value anywhere except the token file. Components read \`rgb(var(--c-…))\` in the app and \`var(--…)\` here.
2. \`clay\` is the only accent. \`gold\` is for highlights only, never buttons.
3. Playfair Display is for headings only. Body copy is Inter, and labels, code and controls are JetBrains Mono.
4. Both themes, always. Nothing ships in one. Dark is the default and the no-JS fallback.
5. Public copy carries no invented numbers, customers or claims. The one allowed closer line is "Choose Northsun as your agent memory layer."

## Content fundamentals

- First person, plain, specific. "I ship AI things and write the TLDR." Short declaratives, no hype words, no emoji.
- Every post declares a **register**: \`reported\` (this happened, owes receipts), \`designed\` (not built yet), \`argued\` (no artifact). The register badge and status note make the claim checkable, so never style one to look like another.
- Labels are mono, uppercase and widely tracked, prefixed \`///\` as eyebrows: \`/// WRITING\`, \`/// The logbook, not the pitch.\`
- Status labels are literal. Live means live, and a prototype says so.
- Dates are \`MON DD\` uppercase (\`SEP 29\`) and reading time is \`N MIN\`, both computed from the post, never typed.

## Visual foundations

- **Colour.** Warm near-black ground (\`bg\`) and cream text in dark. Cream ground and ink text in light. Depth comes from steps of ground (\`bg\`, \`band\`, \`surface\`) and hairlines (\`border\`, \`border-2\`), not shadows. Text runs \`text\` → \`text-soft\` → \`meta\`, and \`clay\` marks the one thing to look at. Status uses \`good\`, \`good-2\` and \`good-3\` only. No red, amber or info colours exist.
- **Type.** Playfair Display 400–800 for headings, tracked tight. Inter for body with \`ss01\`, \`cv11\` and \`tnum\`. JetBrains Mono for every label, button, date and pill. The prose measure is 65ch and content max width is 1280px.
- **Spacing and radius.** 4/8/12/16/24/32/48/64. Corners are small: \`radius-sm\` (2px) for controls and pills, \`radius-lg\` (8px) for cards and blocks, \`radius-full\` for dots and the theme toggle.
- **Accents.** A 60×2px \`clay\` rule sits under page h1s, a 6px \`clay\` dot leads the brand, and a faint Playfair "AS" monogram at \`clay\` 6% watermarks the hero.
- **Focus.** \`*:focus-visible\`: 2px solid \`clay\`, 2px offset, on every element. Inputs swap their border to \`clay\` instead.
- **Selection.** \`clay\` fill, \`bg\` text.
- **Motion.** Exactly three. **hero-in**: 0.6s, \`cubic-bezier(0.2, 0.7, 0.2, 1)\`, opacity 0→1, translateY 8px→0, on the page h1 once. **data-reveal**: 0.6s, same curve, opacity plus translateY 12px→0 as a section scrolls in. **pulse-clay**: 2.4s ease-in-out infinite, scale 1→1.25 and opacity 1→0.6, on the live dot only. Colour and border changes use 150ms state transitions. All motion stops under \`prefers-reduced-motion\`.

## Iconography

No icon set. Direction is typed as glyphs inside labels (→ ↓ ←). Status is a word in a pill, never an icon alone. The theme toggle draws its sun and moon in CSS with \`currentColor\`. There is no logo file: the brand is the word "abdur.ai" set in Playfair, led by the clay dot.

## Contrast

Measured with WCAG 2 relative luminance in both themes. Every text token appears at 10–12px somewhere, so each needs 4.5:1 on every ground it's allowed on. The focus ring and input boundary need 3:1.

- Text: **${n(text, true)} pass, ${n(text, false)} fail** of ${text.length}. Non-text: **${n(ui, true)} pass, ${n(ui, false)} fail** of ${ui.length}.
- Set secondary text in \`meta\`, never the muted ramp. Set success text in \`good-text\`, never \`good\`.
- Put \`clay\` text on \`bg\`, \`band\` or \`surface\` only. Put \`gold\` text on \`surface\` or \`band\` only. Banded sections use \`band\`, not \`bg-2\`.
- Input boundaries use \`muted\`, not \`border\`.
- The repo's \`design-system/scripts/build.mjs\` fails the build if \`app/\` or \`components/\` breaks any of these rules.

${failing.length ? `| theme | token | on | ratio | needs |\n| --- | --- | --- | --- | --- |\n${failing.map((r) => `| ${r.theme} | ${r.fg} | ${r.bg} | ${fmt(r.ratio)}:1 | ${r.min}:1 |`).join("\n")}\n\n` : ""}Known risks from 1.0: ${risks.map((k) => `${k.label}: **${k.pass ? "fixed" : "open"}** (${k.detail})`).join(". ")}.

Palette tokens that carry no text: ${C.notForText(liveTokens).map((t) => `\`${t.fg}\` (dark ${t.dark}, light ${t.light}:1)`).join(", ")}. They stay in the palette for borders, rules, dots and fills.

## Theme behaviour

The \`ThemeToggle\` cycles Auto → Light → Dark. Auto follows the visitor's clock (light 06:00–17:59) and is stored as the absence of \`localStorage["abdur-theme"]\`. A blocking script sets \`data-theme\` on \`<html>\` before first paint. Previews here follow the page's theme switch.
`;
  put("README.md", readme);

  // ---- index (last) ----
  const index = {
    v: 3,
    layout: "files",
    createdOnFiles: { v: 1, at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z") },
    title: "abdur.ai Design System",
    namespace: "AbdurAI",
    libraries: [],
    sections: {},
    groups: [],
    assetGroups: {},
    blobs: {},
    docs: { readme: "project/README.md", sections: [] },
    lastChange: { by: "Abdur", at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), via: "Claude Code · asayeed95/abdur-ai@4e7891a", note: `Design System ${VERSION} extracted from app/globals.css + tailwind.config.ts.` },
  };
  write(P("design-system.json"), JSON.stringify(index, null, 2) + "\n");
  write(path.join(out, "files.json"), JSON.stringify(files, null, 2));
  console.log(`Artifact tree: ${files.length + 1} files under ${path.join(out, "project")}`);
}
