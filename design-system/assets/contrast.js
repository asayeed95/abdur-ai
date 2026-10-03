/* ============================================================
   abdur.ai Design System 1.1 — contrast engine
   One definition of "which pairs matter" and "what passes", shared by
   foundations.html, tests/contrast.test.html (browser, reading the live
   CSS custom properties) and scripts/build.mjs (Node, parsing
   tokens/colors.css). No colour values live here.

   Since 1.1 each text token declares the grounds it may sit on. A pair
   outside that list is a usage error, not a contrast pass: build.mjs
   scans app/ and components/ for the class patterns that would create one.
   ============================================================ */
(function (root) {
  "use strict";

  var THEMES = ["dark", "light"];
  var COLOR_TOKENS = [
    "bg", "bg-2", "band", "surface", "surface-2", "border", "border-2",
    "text", "text-soft", "meta", "muted", "muted-2", "muted-3", "muted-4",
    "clay", "gold", "good-text", "good", "good-2", "good-3",
  ];
  var GROUNDS = ["bg", "bg-2", "band", "surface", "surface-2"];
  var ALL = GROUNDS;

  /* Every token the app sets text in (all appear at 10–12px, so all need
     4.5:1) and the grounds each is allowed on. */
  var TEXT_TOKENS = [
    { fg: "text", grounds: ALL, use: "headings, primary text" },
    { fg: "text-soft", grounds: ALL, use: "prose body (.prose-clay), callout lede" },
    { fg: "meta", grounds: ALL, use: "every secondary line: ledes, deks, dates, tags, badges, nav, footer, placeholders" },
    { fg: "clay", grounds: ["bg", "band", "surface"], use: ".eyebrow, post dates, links, form error, register reported" },
    { fg: "gold", grounds: ["band", "surface"], use: "status-near pill (has a surface fill), Open-to-roles pill, NowPanel queued" },
    { fg: "good-text", grounds: ALL, use: "status-flight pill, form success message, NowPanel running" },
  ];

  /* Palette tokens that no longer carry text (1.1). Shown for reference
     with their measured range; not counted as pass or fail. */
  var NOT_FOR_TEXT = [
    { fg: "muted", rule: "Borders and input boundaries only. Text uses meta." },
    { fg: "muted-2", rule: "Rules and dots only. Text uses meta." },
    { fg: "muted-3", rule: "Rules and dots only. Text uses meta." },
    { fg: "muted-4", rule: "Non-text only; never had a text use." },
    { fg: "good", rule: "Fills and dots only. Text uses good-text." },
  ];

  function buildPairs() {
    var pairs = [];
    TEXT_TOKENS.forEach(function (t) {
      t.grounds.forEach(function (g) {
        pairs.push({ kind: "text", fg: t.fg, bg: g, min: 4.5, use: t.use });
      });
    });
    pairs.push({ kind: "text", fg: "bg", bg: "clay", min: 4.5, use: "primary button, status-live, flagship chip, ::selection" });
    GROUNDS.forEach(function (g) {
      pairs.push({ kind: "ui", fg: "clay", bg: g, min: 3, use: "focus ring (2px solid clay)" });
    });
    ["bg", "bg-2", "band", "surface"].forEach(function (g) {
      pairs.push({ kind: "ui", fg: "muted", bg: g, min: 3, use: "input boundary (border-muted) on this ground" });
    });
    return pairs;
  }
  var PAIRS = buildPairs();

  /* The four risks named in the 1.0 brief, re-asked against 1.1. */
  var KNOWN_RISKS = [
    { id: "light-muted-234", label: "Light muted-2/3/4 on the cream background", retired: ["muted-2", "muted-3", "muted-4"], instead: [["light", "meta", "bg"]] },
    { id: "dark-muted-4", label: "Dark muted-4 on the dark background", retired: ["muted-4"], instead: [["dark", "meta", "bg"]] },
    { id: "light-clay-bg2", label: "Light clay on bg-2 / surface-2", instead: [["light", "clay", "band"]], note: "clay is not allowed on bg-2/surface-2; sections moved to band" },
    { id: "aitldr-light", label: "AITLDR-LAYOUT-001 tokens missing in light mode", layout: ["--aitldr-measure", "--aitldr-title-to-date", "--aitldr-date-size", "--aitldr-date-tracking", "--aitldr-figure-max"] },
  ];

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
  var r2 = function (n) { return Math.round(n * 100) / 100; };

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
        // Judge the unrounded ratio: r2() is for display only (4.496 must not round up to a 4.50 pass).
        var raw = ratio(f, b);
        rows.push({ theme: theme, kind: p.kind, fg: p.fg, bg: p.bg, min: p.min, use: p.use, ratio: r2(raw), pass: raw >= p.min, large: raw >= 3, fgHex: toHex(f), bgHex: toHex(b) });
      });
    });
    return rows;
  }

  /* Reference ranges for the tokens retired from text. */
  function notForText(tokens) {
    return NOT_FOR_TEXT.map(function (t) {
      var out = { fg: t.fg, rule: t.rule };
      THEMES.forEach(function (th) {
        var rs = ["bg", "bg-2", "surface", "surface-2"].filter(function (g) { return tokens[th][t.fg] && tokens[th][g]; }).map(function (g) { return ratio(tokens[th][t.fg], tokens[th][g]); });
        if (!rs.length) { out[th] = "missing"; return; }
        out[th] = r2(Math.min.apply(null, rs)).toFixed(2) + "–" + r2(Math.max.apply(null, rs)).toFixed(2);
      });
      return out;
    });
  }

  function riskResults(rows, layoutByTheme) {
    return KNOWN_RISKS.map(function (risk) {
      if (risk.layout) {
        var missing = risk.layout.filter(function (n) { return !layoutByTheme.light[n]; });
        return {
          id: risk.id, label: risk.label, pass: missing.length === 0,
          detail: missing.length ? missing.length + "/" + risk.layout.length + " undefined in light" : "all " + risk.layout.length + " defined in both themes",
        };
      }
      var hits = risk.instead.map(function (c) {
        return rows.filter(function (r) { return r.theme === c[0] && r.fg === c[1] && r.bg === c[2]; })[0];
      });
      var parts = [];
      if (risk.retired) parts.push(risk.retired.join("/") + " no longer carry text");
      if (risk.note) parts.push(risk.note);
      hits.forEach(function (h, i) { var c = risk.instead[i]; parts.push(h && h.ratio != null ? h.fg + " on " + h.bg + " " + h.ratio.toFixed(2) + ":1" : c[1] + " on " + c[2] + " missing (" + c[0] + ")"); });
      return { id: risk.id, label: risk.label, pass: hits.every(function (h) { return h && h.pass; }), detail: parts.join(" · ") };
    });
  }

  /* Browser: read the live custom properties by flipping <html data-theme>.
     Aliases (var(--c-…)) come back resolved in the computed value. */
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
    THEMES: THEMES, COLOR_TOKENS: COLOR_TOKENS, GROUNDS: GROUNDS, TEXT_TOKENS: TEXT_TOKENS, NOT_FOR_TEXT: NOT_FOR_TEXT,
    PAIRS: PAIRS, KNOWN_RISKS: KNOWN_RISKS,
    channels: channels, ratio: ratio, toHex: toHex, evaluate: evaluate, notForText: notForText, riskResults: riskResults, readLive: readLive,
  };
})(typeof window !== "undefined" ? window : globalThis);
