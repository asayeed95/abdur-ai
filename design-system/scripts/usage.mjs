// abdur.ai Design System — hierarchy-aware usage check for .tsx files.
//
// The line-based USAGE_RULES in build.mjs only see classes that share a line.
// This walks the JSX tree with the TypeScript compiler API and tracks, for
// every element, the background its nearest ancestor sets and the text colour
// it inherits, so `bg-bg-2` on a section and `text-clay` on a child three
// lines down are checked as the pair the browser renders.
//
// Rules (DESIGN-SYSTEM.md "Contrast rules (1.1)"):
//   ground  clay/gold text (text-clay, text-gold, .eyebrow) must not sit on
//           bg-bg-2 / bg-surface-2 — use bg-band.
//   input   a text field (input/textarea/select) boundary must be
//           border-muted — on the field itself, or on the focus-within
//           wrapper that draws it.
//
// Class sources it can read: string literals, template literals, ternary and
// &&/||/?? branches, and cn()/clsx()/classNames()/twMerge()/cx() arguments
// (strings, arrays, object keys). Anything else (identifiers, props, spreads,
// other calls, `text-${x}`) is opaque. Opaque classes never fail the build:
// an element whose background is opaque resets its subtree to "unknown", and
// an opaque field with no static border colour is skipped.

import fs from "node:fs";
import ts from "typescript";

const CLASS_FNS = new Set(["cn", "clsx", "classNames", "classnames", "twMerge", "cx"]);
const FORBIDDEN_GROUNDS = new Set(["bg-2", "surface-2"]);
const NON_FIELD_TYPES = new Set(["hidden", "submit", "button", "reset", "image"]);
const BUILTIN_COLORS = ["transparent", "current", "inherit", "black", "white"];

// "md:hover:bg-bg-2" -> { variants: ["md", "hover"], base: "bg-bg-2" }; ignores ":" inside [...].
function splitVariants(cls) {
  const parts = [];
  let depth = 0, cur = "";
  for (const ch of cls) {
    if (ch === "[") depth++;
    else if (ch === "]") depth--;
    if (ch === ":" && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
  }
  return { variants: parts, base: cur.replace(/^!/, "") };
}

// Resolve a className expression to the set of class tokens it can produce.
function resolve(node) {
  const out = { classes: new Set(), opaque: false };
  const add = (s) => s.split(/\s+/).filter(Boolean).forEach((c) => out.classes.add(c));
  const merge = (r) => { r.classes.forEach((c) => out.classes.add(c)); if (r.opaque) out.opaque = true; };
  if (!node) return out;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) add(node.text);
  else if (ts.isTemplateExpression(node)) {
    // Text glued to an interpolation (`text-${tone}`) is a partial class: opaque.
    const SENT = "\u0000";
    let s = node.head.text;
    for (const span of node.templateSpans) {
      s += SENT + span.literal.text;
      merge(resolve(span.expression));
    }
    for (const tok of s.split(/\s+/).filter(Boolean)) {
      if (tok === SENT.repeat(tok.length)) continue;
      if (tok.includes(SENT)) out.opaque = true;
      else out.classes.add(tok);
    }
  } else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) merge(resolve(node.expression));
  else if (ts.isConditionalExpression(node)) { merge(resolve(node.whenTrue)); merge(resolve(node.whenFalse)); }
  else if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    if (op === ts.SyntaxKind.AmpersandAmpersandToken) merge(resolve(node.right));
    else if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) { merge(resolve(node.left)); merge(resolve(node.right)); }
    else if (op === ts.SyntaxKind.PlusToken) { merge(resolve(node.left)); merge(resolve(node.right)); }
    else out.opaque = true;
  } else if (ts.isArrayLiteralExpression(node)) node.elements.forEach((e) => merge(resolve(e)));
  else if (ts.isObjectLiteralExpression(node)) {
    for (const p of node.properties) {
      if (ts.isPropertyAssignment(p) && (ts.isStringLiteral(p.name) || ts.isIdentifier(p.name) || ts.isNoSubstitutionTemplateLiteral(p.name))) add(p.name.text);
      else out.opaque = true;
    }
  } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && CLASS_FNS.has(node.expression.text)) node.arguments.forEach((a) => merge(resolve(a)));
  else if (node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(node) && node.text === "undefined")) { /* renders nothing */ }
  else out.opaque = true;
  return out;
}

export function scanUsage(files, { colorNames, rel = (f) => f }) {
  const colors = new Set([...colorNames, ...BUILTIN_COLORS]);
  const colorOf = (prefix, base) => {
    if (!base.startsWith(prefix)) return null;
    const v = base.slice(prefix.length);
    if (v.startsWith("[")) return /^\[(#|rgba?\(|hsla?\(|color:)/.test(v) ? { name: "arbitrary", alpha: true } : null;
    const [name, alpha] = v.split("/");
    return colors.has(name) ? { name, alpha: alpha != null } : null;
  };
  const errors = [];

  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
    const where = (n) => `${rel(file)}:${lineOf(n)}`;
    const seen = new Set();

    // ctx.grounds / ctx.fgs: Map<value, originLine>. "unknown" never fails.
    // ctx.boundary: nearest focus-within wrapper that draws a border, or null.
    const ROOT = { grounds: new Map(), fgs: new Map(), boundary: null };

    function analyse(opening, ctx) {
      const tag = opening.tagName.getText(sf);
      const attrs = opening.attributes.properties;
      let cls = { classes: new Set(), opaque: false }, spread = false, type = null;
      for (const a of attrs) {
        if (ts.isJsxSpreadAttribute(a)) { spread = true; continue; }
        const name = a.name.getText(sf);
        const init = a.initializer;
        const expr = !init ? null : ts.isJsxExpression(init) ? init.expression : init;
        if (name === "className") cls = resolve(expr);
        if (name === "type" && expr && ts.isStringLiteral(expr)) type = expr.text;
      }
      const opaque = cls.opaque || spread;
      const line = lineOf(opening);

      // Backgrounds: unprefixed classes set the ground; variant ones (hover:, md:) add possible grounds.
      const baseBg = [], variantBg = [], baseFg = [], variantFg = [], borderColors = [];
      let drawsBorder = false, focusWithin = false;
      for (const c of cls.classes) {
        const { variants, base } = splitVariants(c);
        const bg = colorOf("bg-", base);
        if (bg && bg.name !== "transparent") {
          const g = bg.alpha ? "unknown" : bg.name;
          (variants.length ? variantBg : baseBg).push(g);
        }
        const fg = colorOf("text-", base);
        const fgName = fg ? fg.name : base === "eyebrow" ? "clay" : null; // .eyebrow = text-clay (app/globals.css)
        if (fgName) (variants.length ? variantFg : baseFg).push(fgName);
        if (variants.some((v) => v.startsWith("focus-within"))) focusWithin = true;
        if (!variants.length) {
          if (/^border(-[xytrbl])?(-(?!0$)\d+|-\[[^\]]+\])?$/.test(base) && !/-\[#|-\[rgb/.test(base)) drawsBorder = true;
          const bc = colorOf("border-", base) ?? colorOf("border-x-", base) ?? colorOf("border-y-", base) ?? colorOf("border-t-", base) ?? colorOf("border-b-", base) ?? colorOf("border-l-", base) ?? colorOf("border-r-", base);
          if (bc) borderColors.push(bc.alpha ? `${bc.name} with alpha` : bc.name);
        }
      }

      let grounds;
      if (baseBg.length) grounds = new Map(baseBg.map((g) => [g, line]));
      else if (opaque) grounds = new Map([["unknown", line]]);
      else grounds = new Map(ctx.grounds);
      for (const g of variantBg) grounds.set(g, line);

      let fgs;
      if (baseFg.length) fgs = new Map(baseFg.map((f) => [f, line]));
      else if (opaque) fgs = new Map([["unknown", line]]);
      else fgs = new Map(ctx.fgs);
      for (const f of variantFg) fgs.set(f, line);

      // ground rule: clay/gold text over bg-2 / surface-2, checked where either side is introduced.
      for (const [f, fLine] of fgs) {
        if (f !== "clay" && f !== "gold") continue;
        for (const [g, gLine] of grounds) {
          if (!FORBIDDEN_GROUNDS.has(g)) continue;
          if (fLine !== line && gLine !== line) continue; // already reported on the element that introduced it
          const key = `${f}@${fLine}|${g}@${gLine}`;
          if (seen.has(key)) continue;
          seen.add(key);
          errors.push(`usage: ${rel(file)}:${line} text-${f} (line ${fLine}) on bg-${g} (line ${gLine}) fails in light — use bg-band for the ground`);
        }
      }

      // input rule.
      const isField = /^(input|textarea|select)$/.test(tag) && !NON_FIELD_TYPES.has(type ?? "");
      if (isField && !(opaque && !borderColors.length)) {
        if (drawsBorder) {
          if (!borderColors.includes("muted")) errors.push(`usage: ${rel(file)}:${line} <${tag}> boundary is ${borderColors.length ? `border-${borderColors.join("/")}` : "an unset border colour"} — input boundary must be border-muted (3:1)`);
        } else if (ctx.boundary && !ctx.boundary.colors.includes("muted")) {
          errors.push(`usage: ${rel(file)}:${line} <${tag}> sits in a focus-within boundary (line ${ctx.boundary.line}) drawn in ${ctx.boundary.colors.length ? `border-${ctx.boundary.colors.join("/")}` : "an unset border colour"} — input boundary must be border-muted (3:1)`);
        }
      }

      let boundary = ctx.boundary;
      if (focusWithin && drawsBorder) boundary = { line, colors: borderColors };
      else if (focusWithin && opaque) boundary = null;
      return { grounds, fgs, boundary };
    }

    function visit(node, ctx) {
      if (ts.isJsxElement(node)) {
        const inner = analyse(node.openingElement, ctx);
        visitAttrs(node.openingElement);
        node.children.forEach((c) => visit(c, inner));
        return;
      }
      if (ts.isJsxSelfClosingElement(node)) { analyse(node, ctx); visitAttrs(node); return; }
      ts.forEachChild(node, (c) => visit(c, ctx));
    }
    // JSX passed as a prop (icon={<X/>}) renders somewhere we cannot see: start from an unknown ground.
    function visitAttrs(opening) {
      for (const a of opening.attributes.properties) if (ts.isJsxAttribute(a) && a.initializer) visit(a.initializer, ROOT);
    }
    visit(sf, ROOT);
  }
  return errors;
}
