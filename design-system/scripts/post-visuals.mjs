// abdur.ai Design System 1.2 — post visuals previews (Figure, diagrams,
// interactive blocks). Called by build.mjs.
//
// Unlike the hand-mirrored previews in components.mjs, these render the real
// components, so a preview cannot drift from the code:
//   1. TypeScript (a devDependency) transpiles components/post/Figure.tsx,
//      components/diagrams/*.tsx and components/interactive/*.{ts,tsx} into
//      node_modules/.cache/ds-post-visuals/ (git-ignored with node_modules).
//   2. react-dom/server renders each one to static HTML: exactly what a reader
//      with JS off, a feed or a crawler gets.
//   3. A second copy is transpiled with `enhanced` starting true, to show the
//      hydrated UI (the first state after the client effect runs).
//   4. Tailwind (the app's own config, preflight off) compiles only the
//      utilities that markup uses into assets/post-visuals.css. The hex check
//      in build.mjs scans that file like every other file here.
// Every file in components/diagrams/ except parts.tsx/index.ts gets a preview.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Client components whose hydrated state is previewed by starting `enhanced` true.
const ENHANCED = ["StepThrough", "Tabs", "Checklist", "Quiz"].map((n) => `components/interactive/${n}.tsx`);
const ENHANCED_FROM = "const [enhanced, setEnhanced] = useState(false)";

function listSources(REPO) {
  const files = ["components/post/Figure.tsx"];
  for (const dir of ["components/diagrams", "components/interactive"]) {
    for (const f of fs.readdirSync(path.join(REPO, dir))) if (/\.(tsx?|ts)$/.test(f)) files.push(`${dir}/${f}`);
  }
  return files;
}

async function transpileAll(REPO, outRoot, { enhanced }) {
  const ts = (await import("typescript")).default;
  const files = listSources(REPO);
  for (const rel of files) {
    let src = fs.readFileSync(path.join(REPO, rel), "utf8");
    if (enhanced && ENHANCED.includes(rel)) {
      if (!src.includes(ENHANCED_FROM)) throw new Error(`post-visuals: ${rel} no longer declares \`${ENHANCED_FROM}\`; update the enhanced preview`);
      src = src.replace(ENHANCED_FROM, "const [enhanced, setEnhanced] = useState(true)");
    }
    let js = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      fileName: rel,
    }).outputText;
    const fromDir = path.dirname(path.join(outRoot, rel));
    js = js.replace(/from "(\.{1,2}\/[^"]+|@\/[^"]+)"/g, (_, spec) => {
      const target = spec.startsWith("@/") ? path.join(outRoot, spec.slice(2)) : path.join(fromDir, spec);
      let r = path.relative(fromDir, target);
      if (!r.startsWith(".")) r = "./" + r;
      return `from "${r}.mjs"`;
    });
    const out = path.join(outRoot, rel.replace(/\.tsx?$/, ".mjs"));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, js);
  }
  return files;
}

const load = (root, rel) => import(pathToFileURL(path.join(root, rel.replace(/\.tsx?$/, ".mjs"))).href);

export async function buildPostVisuals({ REPO, DS }) {
  const cache = path.join(REPO, "node_modules", ".cache", "ds-post-visuals");
  fs.rmSync(cache, { recursive: true, force: true });
  const nojs = path.join(cache, "nojs"), enh = path.join(cache, "enhanced");
  await transpileAll(REPO, nojs, { enhanced: false });
  await transpileAll(REPO, enh, { enhanced: true });

  const React = (await import("react")).default;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const h = React.createElement;
  const render = (el) => renderToStaticMarkup(el);

  const mods = async (root) => ({
    Figure: (await load(root, "components/post/Figure.tsx")).Figure,
    slots: await load(root, "components/interactive/slots.tsx"),
    StepThrough: (await load(root, "components/interactive/StepThrough.tsx")).StepThrough,
    Tabs: (await load(root, "components/interactive/Tabs.tsx")).Tabs,
    Checklist: await load(root, "components/interactive/Checklist.tsx"),
    Quiz: (await load(root, "components/interactive/Quiz.tsx")).Quiz,
    diagrams: await load(root, "components/diagrams/index.ts"),
  });
  const N = await mods(nojs), E = await mods(enh);

  // Sample copy is neutral and describes the mechanism; no numbers or claims.
  const p = (t) => h("p", null, t);
  const stepThrough = (M) =>
    h(M.StepThrough, { label: "Walk the loop" },
      h(M.diagrams.VerificationLoopDiagram),
      h(M.slots.Step, { title: "The claim", highlight: "claim" }, p("The agent says it is done. That is a claim, not a result.")),
      h(M.slots.Step, { title: "Run the check", highlight: "run check" }, p("Run the real command, this turn.")),
      h(M.slots.Step, { title: "Read the evidence", highlight: "evidence compare decision" }, p("The output is the evidence. Compare it to the claim.")));
  const tabs = (M) =>
    h(M.Tabs, { label: "Before and after" },
      h(M.slots.Tab, { title: "Before" }, p("The report says the work is done.")),
      h(M.slots.Tab, { title: "After" }, p("The report quotes the command and its output.")));
  const checklist = (M) =>
    h(M.Checklist.Checklist, { label: "Before you report done" },
      h(M.Checklist.Check, null, "I ran the check myself, this turn."),
      h(M.Checklist.Check, null, "I read the output, not a summary of it."),
      h(M.Checklist.Check, null, "The output matches the claim."));
  const quiz = (M) =>
    h(M.Quiz, { question: "The suite is green. What goes in the report?" },
      h(M.slots.Choice, null, "Done."),
      h(M.slots.Choice, { correct: true }, "The command, its output, and that it matches the claim."),
      h(M.slots.Answer, null, p("A green suite is evidence only if it ran this turn, against this change.")));
  const prompt = (M) =>
    h(M.Quiz, { question: "Why keep the log append-only?" },
      h(M.slots.Answer, null, p("So a restart rebuilds context from what happened, not from what was last summarized.")));

  const S = (label) => `<span class="ds-state">${label}</span>`;
  const both = (make) => `<div class="ds-stack">${S("no JS · feeds · crawlers")}${render(make(N))}${S("enhanced (after hydration)")}${render(make(E))}</div>`;

  const diagramNames = Object.keys(N.diagrams).filter((k) => /Diagram$/.test(k));
  const entries = [
    {
      slug: "figure", name: "Figure", source: "components/post/Figure.tsx",
      summary: "The in-post figure: a banded panel, an optional mono label and a required caption.",
      guide: [
        "`Figure` (`label=\"Figure 1\" caption=\"…\"`) wraps one visual. `caption` is required: a figure without one throws at render, so the build fails.",
        "Panel: `band` ground, `border` hairline, `radius-lg`. Label: mono 11px uppercase `meta`. Caption: `sm` `meta`.",
        "Width: the 65ch prose column, never wider. `size=\"narrow\"` caps it at `--aitldr-figure-max` (28rem) for small visuals.",
        "`not-prose`, so the post's element rules don't restyle what's inside.",
      ],
      html: () => render(h(N.Figure, { label: "Figure 1", caption: "Done is a claim until the check's output matches it." }, h(N.diagrams.VerificationLoopDiagram))),
    },
    ...diagramNames.map((name) => ({
      slug: name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(), name, source: `components/diagrams/${name}.tsx`,
      summary: "A post diagram: inline SVG on a 320-wide viewBox, coloured only by token classes, readable at 360px.",
      guide: [
        "`role=\"img\"` with a `title` and a `desc` element; the desc says in words everything the drawing shows.",
        "Boxes: `surface` fill, `border-2` stroke. Arrows and rules: `muted` (non-text). Labels: `text`, mono sublabels `meta`. The loop path is `clay`, the one accent.",
        "Groups carry `data-node` names; inside a StepThrough the current step's names stay lit and the rest dim to 40%.",
        "No numbers. A diagram shows a mechanism, never a measurement.",
      ],
      html: () => render(h(N.Figure, { label: "Figure 1", caption: "Preview caption." }, h(N.diagrams[name]))),
    })),
    {
      slug: "step-through", name: "StepThrough", source: "components/interactive/StepThrough.tsx, components/interactive/slots.tsx",
      summary: "A walkthrough, one step at a time once hydrated, that can light the parts of a diagram each step is about.",
      guide: [
        "No JS: every step renders, numbered, in order. Enhanced: one step, Prev / Next, a numbered step list (`aria-current=\"step\"`), arrow keys, Home, End, and a polite live region.",
        "`Step` takes `highlight=\"a b\"`: diagram node names that stay lit while the rest dim to 40%. (The dimming runs in an effect, so this static preview shows the diagram undimmed.)",
        "Step titles are Playfair `xl`. The step counter is mono `meta`.",
      ],
      html: () => both(stepThrough),
    },
    {
      slug: "tabs", name: "Tabs", source: "components/interactive/Tabs.tsx, components/interactive/slots.tsx",
      summary: "Before/after or option A/B, read one panel at a time once hydrated.",
      guide: [
        "No JS: every panel renders under its mono title. Enhanced: a WAI-ARIA tablist with roving tabindex; arrows, Home and End move.",
        "Selected tab: `clay` label over a 2px `clay` rule. Others: `meta` → `text` on hover.",
      ],
      html: () => both(tabs),
    },
    {
      slug: "checklist", name: "Checklist", source: "components/interactive/Checklist.tsx",
      summary: "A tick-through list. Native checkboxes, so it works with JS off; hydrated, it counts and resets.",
      guide: [
        "Checkboxes use `accent-clay`. A checked row's text steps up from `text-soft` to `text`.",
        "Enhanced adds `n of m checked` (live, mono `meta`) and Reset. Nothing is stored or sent.",
      ],
      html: () => both(checklist),
    },
    {
      slug: "quiz", name: "Quiz", source: "components/interactive/Quiz.tsx, components/interactive/slots.tsx",
      summary: "Try to answer, then reveal: a one-question quiz, or a think-first prompt with no choices.",
      guide: [
        "The answer sits in a native `details` element, so it opens with JS off and is in the HTML for feeds and crawlers.",
        "Enhanced: Check marks the pick. Right is `good-text` with a `good-text` border; wrong is `clay`. No red exists.",
        "Mark exactly one `Choice` with the bare `correct` attribute; the reveal repeats it before the `Answer`.",
      ],
      html: () => `${both(quiz)}<div class="ds-stack" style="margin-top:var(--space-8)">${S("no choices: think first")}${render(prompt(N))}</div>`,
    },
  ];

  // Compile the utilities the rendered markup uses, from the app's own config.
  const all = entries.map((e) => e.html()).join("\n");
  const ts = (await import("typescript")).default;
  const cfgOut = path.join(cache, "tailwind.config.mjs");
  fs.writeFileSync(cfgOut, ts.transpileModule(fs.readFileSync(path.join(REPO, "tailwind.config.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText);
  const appConfig = (await import(pathToFileURL(cfgOut).href)).default;
  const tailwindcss = (await import("tailwindcss")).default;
  const postcss = (await import("postcss")).default;
  // The app's tailwind config has the three theme-independent good* hexes; only
  // `good-text` (a var) is used here, so none should reach the output.
  const css = await postcss([
    tailwindcss({ ...appConfig, content: [{ raw: all, extension: "html" }], corePlugins: { preflight: false } }),
  ]).process("@tailwind utilities;", { from: undefined });
  const header = "/* GENERATED by design-system/scripts/post-visuals.mjs from the app's tailwind.config.ts.\n   The utilities the post-visuals previews use. Do not edit. */\n";
  // Utilities that compose --tw-* vars need their defaults (set by @tailwind base in the app).
  const defaults = "*,::before,::after{--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1}\n";
  const panel = ".ds-panel{color:rgb(var(--c-text));font-family:var(--font-body)}.ds-panel svg text{font-family:var(--font-body)}.ds-panel svg .font-mono{font-family:var(--font-mono)}\n" +
    // The slice of the app's preflight these blocks rely on (preflight itself is off: it carries hex defaults).
    ".ds-panel button{background:transparent;color:inherit;font:inherit;cursor:pointer}.ds-panel button:disabled{cursor:default}.ds-panel fieldset{margin:0}.ds-panel summary{display:block}\n";
  fs.writeFileSync(path.join(DS, "assets", "post-visuals.css"), header + defaults + panel + css.css + "\n");

  return entries;
}

