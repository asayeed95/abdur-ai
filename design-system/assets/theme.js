/* abdur.ai Design System — template theme toggle.
   The same contract as components/ThemeToggle.tsx + lib/theme.ts:
   Auto → Light → Dark → Auto; Auto = visitor clock (light 06:00–17:59),
   stored as the absence of localStorage["abdur-theme"]. */
(function () {
  "use strict";
  var KEY = "abdur-theme", CYCLE = ["auto", "light", "dark"];
  function readMode() {
    try { var v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : "auto"; } catch (e) { return "auto"; }
  }
  function resolve(mode) {
    if (mode !== "auto") return mode;
    var h = new Date().getHours();
    return h >= 6 && h < 18 ? "light" : "dark";
  }
  var mode = readMode();
  function render() {
    var theme = resolve(mode);
    document.documentElement.setAttribute("data-theme", theme);
    var label = mode === "auto" ? "Auto · " + (theme === "light" ? "Light" : "Dark") : theme === "light" ? "Light" : "Dark";
    Array.prototype.forEach.call(document.querySelectorAll(".theme-toggle"), function (b) {
      b.querySelector(".theme-toggle-label").textContent = label;
      b.querySelector(".theme-toggle-well").innerHTML =
        theme === "light" ? '<span class="icon-sun" aria-hidden="true"></span>' : '<span class="icon-moon" aria-hidden="true"></span>';
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".theme-toggle");
    if (!b) return;
    mode = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];
    try { if (mode === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch (err) { /* storage blocked */ }
    render();
  });
  render();
})();
