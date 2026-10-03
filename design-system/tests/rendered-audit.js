/* abdur.ai Design System — rendered contrast audit.
 *
 * The token test (contrast.test.html) proves the palette. This proves the
 * shipped pages: it walks every visible text node on each route, composites
 * the real background (alpha tints included) and measures WCAG 2 contrast
 * (4.5:1, or 3:1 at 24px+ / 18.66px+ bold), in both themes.
 *
 * Run it against a production server (`npx next build && npx next start`),
 * not `next dev`. Open any page on that origin, paste this file into the
 * console (or run it from a browser agent), then:
 *
 *   await auditSite()                      // all routes, both themes
 *   await auditSite(["/hire"], ["light"])  // a subset
 *
 * It returns { "<theme> <route>": { checked, fails: [...] } }. Skipped on
 * purpose: aria-hidden, disabled, off-screen, and opacity < 0.5 (decorative
 * watermarks). Known exception: the /hire résumé sheet sets its own paper
 * palette (out of scope for the site design system).
 */
(function (root) {
  "use strict";
  var ROUTES = ["/", "/writing", "/aitldr", "/writing/what-is-an-agent-memory-layer", "/writing/the-night-the-doctrine-failed", "/about", "/now", "/hire", "/subscribe"];

  function auditWindow(w) {
    var d = w.document;
    var parse = function (s) { var m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
    var over = function (t, u) { return [0, 1, 2].map(function (i) { return t[i] * t[3] + u[i] * (1 - t[3]); }).concat([1]); };
    var L = function (c) { var v = c.slice(0, 3).map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    var ratio = function (a, b) { var x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    var gcs = function (e) { return w.getComputedStyle(e); };
    function bgOf(el) {
      var layers = [], e = el;
      while (e && e.nodeType === 1) { var c = parse(gcs(e).backgroundColor); if (c && c[3] > 0) layers.push(c); if (c && c[3] === 1) break; e = e.parentElement; }
      var base = parse(gcs(d.body).backgroundColor);
      if (!base || base[3] < 1) base = parse(gcs(d.documentElement).backgroundColor) || [0, 0, 0, 1];
      for (var i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
      return base;
    }
    var fails = [], n = 0, seen = new Set(), walker = d.createTreeWalker(d.body, 4);
    while (walker.nextNode()) {
      var t = walker.currentNode, el = t.parentElement;
      if (!t.textContent.trim() || !el || seen.has(el)) continue;
      seen.add(el);
      if (el.closest('[aria-hidden="true"],script,style,noscript,[hidden],[disabled]')) continue;
      var cs = gcs(el), r = el.getBoundingClientRect();
      if (!r.width || !r.height || cs.visibility === "hidden" || r.right < 0) continue;
      var op = 1, a = el; while (a) { op *= parseFloat(gcs(a).opacity); a = a.parentElement; }
      if (op < 0.5) continue;
      var bg = bgOf(el), fg = parse(cs.color); if (fg[3] < 1) fg = over(fg, bg);
      var size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
      var min = large ? 3 : 4.5, rr = ratio(fg, bg); n++;
      if (rr < min) fails.push({ ratio: Math.round(rr * 100) / 100, min: min, size: size, text: t.textContent.trim().slice(0, 50), cls: String(el.className || "").slice(0, 120) });
    }
    return { theme: d.documentElement.getAttribute("data-theme"), checked: n, fails: fails };
  }

  root.auditSite = async function (routes, themes) {
    routes = routes || ROUTES; themes = themes || ["dark", "light"];
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var out = {}, f = null, saved = null;
    // Keep the operator's own theme choice: read it now, put it back (or clear it if there was none) in finally.
    try { saved = localStorage.getItem("abdur-theme"); } catch (e) { /* storage blocked */ }
    try {
      for (var ti = 0; ti < themes.length; ti++) {
        for (var ri = 0; ri < routes.length; ri++) {
          try { localStorage.setItem("abdur-theme", themes[ti]); } catch (e) { /* storage blocked */ }
          f = document.createElement("iframe");
          f.style.cssText = "position:absolute;left:-10000px;top:0;width:1280px;height:900px";
          f.src = routes[ri]; document.body.appendChild(f);
          await new Promise(function (r) { f.onload = r; });
          await wait(400);
          f.contentDocument.querySelectorAll("[data-reveal]").forEach(function (e) { e.classList.add("in"); });
          await wait(750);
          out[themes[ti] + " " + routes[ri]] = auditWindow(f.contentWindow);
          f.remove(); f = null;
        }
      }
    } finally {
      if (f) f.remove();
      try {
        if (saved === null) localStorage.removeItem("abdur-theme");
        else localStorage.setItem("abdur-theme", saved);
      } catch (e) { /* storage blocked */ }
    }
    return out;
  };
  root.auditWindow = auditWindow;
})(window);
