/* ============================================================
   abdur.ai Design System 1.0 — contrast engine
   One definition of "which pairs matter" and "what passes", shared by
   foundations.html, tests/contrast.test.html (browser, reading the live
   CSS custom properties) and scripts/build.mjs (Node, parsing
   tokens/colors.css). No colour values live here.
   ============================================================ */
(function (root) {
  "use strict";

  var THEMES = ["dark", "light"];
  var COLOR_TOKENS = [
    "bg", "bg-2", "surface", "surface-2", "border", "border-2",
    "text", "text-soft", "muted", "muted-2", "muted-3", "muted-4",
    "clay", "gold", "good", "good-2", "good-3",
  ];
  var GROUNDS = ["bg", "bg-2", "surface", "surface-2"];

  /* Every token the code sets text in, with where it does so. All of them
     appear at 10–12px somewhere, so all are held to 4.5:1. */
  var TEXT_TOKENS = [
    { fg: "text", use: "headings, primary text" },
    { fg: "text-soft", use: "prose body (.prose-clay), callout lede" },
    { fg: "muted", use: "ledes, deks, meta, nav links, .eyebrow-muted, building pill" },
    { fg: "muted-2", use: "#tags (10px), register badges designed/argued (10px), hero aside" },
    { fg: "muted-3", use: "reading time, footer legal (10px), placeholder, prev/next labels" },
    { fg: "muted-4", use: "no text use in app/ or components/ today" },
    { fg: "clay", use: ".eyebrow (12px), post dates, links, form error, register reported" },
    { fg: "gold", use: "status-near pill (10px), Open-to-roles pill, NowPanel queued" },
    { fg: "good", use: "status-flight pill (10px), form success message" },
  ];

  function buildPairs() {
    var pairs = [];
    TEXT_TOKENS.forEach(function (t) {
      GROUNDS.forEach(function (g) {
        pairs.push({ kind: "text", fg: t.fg, bg: g, min: 4.5, use: t.use });
      });
    });
    pairs.push({ kind: "text", fg: "bg", bg: "clay", min: 4.5, use: "primary button, status-live, flagship chip, ::selection" });
    GROUNDS.forEach(function (g) {
      pairs.push({ kind: "ui", fg: "clay", bg: g, min: 3, use: "focus ring (2px solid clay)" });
    });
    pairs.push({ kind: "ui", fg: "border", bg: "bg-2", min: 3, use: "newsletter input boundary on the bg-2 section" });
    return pairs;
  }
  var PAIRS = buildPairs();

  /* The risks the brief named up front, so the test can answer each one. */
  var KNOWN_RISKS = [
    { id: "light-muted-234", label: "Light muted-2/3/4 on the cream background", checks: [["light", "muted-2", "bg"], ["light", "muted-3", "bg"], ["light", "muted-4", "bg"]] },
    { id: "dark-muted-4", label: "Dark muted-4 on the dark background", checks: [["dark", "muted-4", "bg"]] },
    { id: "light-clay-bg2", label: "Light clay on bg-2 / surface-2 (code comment measured only the cream bg)", checks: [["light", "clay", "bg-2"], ["light", "clay", "surface-2"]] },
    { id: "aitldr-light", label: "AITLDR-LAYOUT-001 tokens missing in light mode", layout: ["--aitldr-measure", "--aitldr-title-to-date", "--aitldr-date-size", "--aitldr-date-tracking", "--aitldr-figure-max"] },
  ];

  /* PROPOSED fixes — none applied, none change a locked value. Keyed by
     theme:fg (pairs), or by risk id. Each reuses existing tokens only. */
  var FIXES = {
    "dark:muted-2": "Small text (<24px) in muted-2 → muted (5.25–5.89:1 dark). Keep muted-2 for text ≥24px (≥3.94:1).",
    "dark:muted-3": "Small text in muted-3 → muted. muted-3 stays legal only at ≥24px (≥3.71:1).",
    "dark:muted-4": "No text uses muted-4 today. Document it as non-text only (fails 3:1 on surface-2 at 2.94:1). No code change.",
    "light:muted": "Add theme alias --c-meta (dark → muted, light → text-soft, 8.42–10.09:1) and move small meta text to it. Aliases existing values; changes none.",
    "light:muted-2": "Same alias: small muted-2 text → --c-meta. muted-2 fails even 3:1 on bg-2/surface-2 (2.58:1): decorative only in light.",
    "light:muted-3": "Same alias: small muted-3 text → --c-meta.",
    "light:muted-4": "Unused for text. Document as non-text only.",
    "light:clay": "Keep small clay text off bg-2/surface-2: the Subscribe section and flagship card move bg-2 → bg (in dark the two grounds differ by 1.01:1, so nothing visible changes). The 4.21:1 pairs disappear.",
    "light:gold": "Gold text only on surface (4.88:1). The status-near pill already sits on cards (surface); the /hire Open-to-roles pill on bg moves onto a surface chip.",
    "light:good": "Success text in light → good-3 (existing token, 10.60–12.70:1 on light grounds). The status-flight pill text likewise. Dark keeps good.",
    "dark:border": "Input boundary → muted border (dark 5.81:1, light 3.68:1 on bg-2). Existing token.",
    "light:border": "Same: input border → muted.",
    "aitldr-light": "Move the five --aitldr-* declarations from :root[data-theme=\"dark\"] to :root. Unlocked per the code comment; no value changes.",
  };

  function channels(str) {
    var p = String(str).trim().split(/[\s,]+/).map(Number);
    return p.length === 3 && p.every(function (n) { return n >= 0 && n <= 255; }) ? p : null;
  }
  function luminance(c) {
    var v = c.map(function (x) {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function ratio(a, b) {
    var x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function toHex(c) {
    return "#" + c.map(function (n) { return ("0" + n.toString(16)).slice(-2); }).join("").toUpperCase();
  }

  /* tokens = { dark: { bg: [r,g,b], … }, light: { … } } */
  function evaluate(tokens) {
    var rows = [];
    THEMES.forEach(function (theme) {
      PAIRS.forEach(function (p) {
        var f = tokens[theme][p.fg], b = tokens[theme][p.bg];
        if (!f || !b) {
          rows.push({ theme: theme, kind: p.kind, fg: p.fg, bg: p.bg, min: p.min, use: p.use, ratio: null, pass: false, missing: true });
          return;
        }
        var r = Math.round(ratio(f, b) * 100) / 100;
        rows.push({
          theme: theme, kind: p.kind, fg: p.fg, bg: p.bg, min: p.min, use: p.use,
          ratio: r, pass: r >= p.min, large: r >= 3,
          fgHex: toHex(f), bgHex: toHex(b),
          fix: r >= p.min ? null : (FIXES[theme + ":" + p.fg] || null),
        });
      });
    });
    return rows;
  }

  function riskResults(rows, layoutByTheme) {
    return KNOWN_RISKS.map(function (risk) {
      if (risk.layout) {
        var missing = risk.layout.filter(function (n) { return !layoutByTheme.light[n]; });
        var presentDark = risk.layout.filter(function (n) { return layoutByTheme.dark[n]; });
        return {
          id: risk.id, label: risk.label, pass: missing.length === 0,
          detail: missing.length
            ? missing.length + "/" + risk.layout.length + " undefined in light (" + presentDark.length + "/" + risk.layout.length + " defined in dark)"
            : "all defined in both themes",
          fix: missing.length ? FIXES[risk.id] : null,
        };
      }
      var hits = risk.checks.map(function (c) {
        return rows.filter(function (r) { return r.theme === c[0] && r.fg === c[1] && r.bg === c[2]; })[0];
      });
      return {
        id: risk.id, label: risk.label,
        pass: hits.every(function (h) { return h && h.pass; }),
        detail: hits.map(function (h) { return h.fg + " on " + h.bg + " " + h.ratio.toFixed(2) + ":1"; }).join(" · "),
      };
    });
  }

  /* Browser: read the live custom properties by flipping <html data-theme>. */
  function readLive(doc) {
    doc = doc || root.document;
    var html = doc.documentElement, prev = html.getAttribute("data-theme");
    var tokens = {}, layout = {};
    THEMES.forEach(function (theme) {
      html.setAttribute("data-theme", theme);
      var cs = root.getComputedStyle(html);
      tokens[theme] = {};
      COLOR_TOKENS.forEach(function (n) { tokens[theme][n] = channels(cs.getPropertyValue("--c-" + n)); });
      layout[theme] = {};
      KNOWN_RISKS.forEach(function (r) {
        (r.layout || []).forEach(function (n) { layout[theme][n] = cs.getPropertyValue(n).trim(); });
      });
    });
    if (prev === null) html.removeAttribute("data-theme"); else html.setAttribute("data-theme", prev);
    return { tokens: tokens, layout: layout };
  }

  root.DSContrast = {
    THEMES: THEMES, COLOR_TOKENS: COLOR_TOKENS, GROUNDS: GROUNDS, TEXT_TOKENS: TEXT_TOKENS,
    PAIRS: PAIRS, KNOWN_RISKS: KNOWN_RISKS, FIXES: FIXES,
    channels: channels, ratio: ratio, toHex: toHex, evaluate: evaluate, riskResults: riskResults, readLive: readLive,
  };
})(typeof window !== "undefined" ? window : globalThis);
