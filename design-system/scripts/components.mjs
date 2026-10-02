// abdur.ai Design System 1.0 — component sources.
// One entry per component. scripts/build.mjs turns each into:
//   components/<slug>.html          — local preview, dark + light side by side
//   <artifact>/project/components/<Name>/{preview.html,README.md}
// Markup mirrors the app's JSX (file in `source`); classes come from
// components/components.css. Sample copy is published site copy or neutral
// UI text — no invented numbers, customers or claims.

const S = (label) => `<span class="ds-state">${label}</span>`;
const STATES = ["default", "hover", "focus", "disabled"];

function matrix(rows, states = STATES) {
  const head = `<div class="ds-matrix" style="--cols:${states.length}"><span></span>${states.map((s) => `<span class="ds-col">${s}</span>`).join("")}`;
  const body = rows
    .map(([label, cells]) => `<span class="ds-row">${label}</span>${cells.map((c) => `<div class="ds-cell">${c}</div>`).join("")}`)
    .join("");
  return `${head}${body}</div>`;
}

const btn = (variant, label) => [
  `<button class="btn ${variant}">${label}</button>`,
  `<button class="btn ${variant} is-hover">${label}</button>`,
  `<button class="btn ${variant} is-focus">${label}</button>`,
  `<button class="btn ${variant}" disabled>${label}</button>`,
];

const toggle = (icon, label, cls = "") =>
  `<button type="button" class="theme-toggle ${cls}"><span class="theme-toggle-well">${
    icon === "sun" ? '<span class="icon-sun" aria-hidden="true"></span>' : '<span class="icon-moon" aria-hidden="true"></span>'
  }</span><span class="theme-toggle-label">${label}</span></button>`;

const navBar = (scrolled) => `<nav class="nav" data-scrolled="${scrolled}">
  <div class="nav-inner">
    <a href="#" class="brand"><span class="dot animate-pulse-clay" aria-hidden="true"></span><span>abdur.ai</span></a>
    <ul class="nav-links">
      <li><a href="#" class="link-nav" aria-current="page">Writing</a></li>
      <li><a href="#" class="link-nav">Ship log</a></li>
      <li><a href="#" class="link-nav is-hover">Tools</a></li>
      <li><a href="#" class="link-nav">Northsun</a></li>
      <li><a href="#" class="link-nav">About</a></li>
      <li><a href="#" class="link-nav">Hire</a></li>
    </ul>
    <div class="nav-actions">${toggle("moon", "Auto · Dark")}<a href="#" class="btn btn-nav">Subscribe</a></div>
  </div>
</nav>`;

export const footerHtml = `<footer class="footer">
  <div class="footer-main">
    <div>
      <a href="#" class="brand"><span class="dot" aria-hidden="true"></span>abdur.ai</a>
      <p class="footer-tagline">Made in NJ. Shipped at 2am.</p>
    </div>
    <div class="footer-cols">
      <ul class="footer-list"><li><a href="#">Writing</a></li><li><a href="#">Tools</a></li><li><a href="#">Northsun</a></li></ul>
      <ul class="footer-list"><li><a href="#">About</a></li><li><a href="#">Now</a></li><li><a href="#" class="is-hover">Hire</a></li></ul>
    </div>
    <div class="footer-find">
      <p class="footer-label">Find me</p>
      <ul class="footer-list"><li><a href="#">hello@abdur.ai</a></li><li><a href="#">LinkedIn</a></li><li><a href="#">GitHub</a></li></ul>
    </div>
  </div>
  <div class="footer-legal">
    <div class="footer-legal-inner">
      <p>© 2026 Abdur Rahman Sayeed · <a href="#">An ASEC property — coming</a></p>
      <p><a href="#">RSS</a><a href="#">llms.txt</a><a href="#">Sitemap</a></p>
    </div>
  </div>
</footer>`;

export const POSTS = {
  flagship: { date: "JUN 25", mins: 12, register: "reported", title: "The night the doctrine failed", dek: "A near-miss postmortem on agent-driven repo cleanup", tags: ["agents", "verification", "postmortem"] },
  memory: { date: "SEP 29", mins: 7, register: "argued", title: "What is an agent memory layer?", dek: "An agent memory layer is the policy between an AI agent and its storage: what gets written, whose it is, when it was true, and what comes back at the next decision.", tags: ["ai-agents", "agent-memory", "architecture"] },
  meta: { date: "SEP 26", mins: 7, register: "reported", title: "12 of my 15 meta descriptions were too long for search", dek: "What a metadata audit found, the fix that shipped, and the robots.txt change the audit recommended and got wrong.", tags: ["seo", "nextjs", "postmortem"] },
  pager: { date: "AUG 22", mins: 2, register: "reported", title: "Your pager is not your customer", dek: "A synthetic check that fatals inside its own warn budget will page for days without proving anyone is hurt. Keep signal, diagnosis, mitigation, and recovery as four evidence states.", tags: ["sre", "incidents", "verification"] },
  retention: { date: "JUL 02", mins: 3, register: "designed", note: "Design. Not shipped.", title: "Cross-video pattern detection: the YouTube signal everyone ignores", dek: "The audience tells you, second by second, where you lost them — but the signal is siloed one video at a time.", tags: ["analytics", "youtube", "ai-products"] },
};

const badge = (r) => `<span class="badge${r === "reported" ? " badge-reported" : ""}">${r[0].toUpperCase() + r.slice(1)}</span>`;

export const postRow = (p, cls = "") => `<a href="#" class="post-row ${cls}">
  <span class="post-date">${p.date}</span>
  <div>
    <div class="post-meta">${badge(p.register)}${p.note ? `<span class="post-note">${p.note}</span>` : ""}</div>
    <h3 class="post-title">${p.title}</h3>
    <p class="post-dek">${p.dek}</p>
    <div class="post-tags">${p.tags.map((t) => `<span class="tag">#${t}</span>`).join("")}</div>
  </div>
  <span class="post-mins">${p.mins} MIN</span>
</a>`;

export const flagshipCard = (p, chip = "FLAGSHIP", cls = "") => `<a href="#" class="post-flagship ${cls}">
  <div class="post-meta" style="margin-bottom:20px"><span class="chip-flagship">${chip}</span>${badge(p.register)}<span class="eyebrow-muted" style="letter-spacing:normal">${p.date} · ${p.mins} MIN</span></div>
  <h2 class="post-title">${p.title}</h2>
  <p class="post-dek">${p.dek}</p>
  <div class="post-tags" style="margin-top:20px">${p.tags.map((t) => `<span class="tag">#${t}</span>`).join("")}</div>
</a>`;

const CLOSER = "Choose Northsun as your agent memory layer.";

const formState = (state) => {
  const disabled = state === "submitting";
  const btnLabel = state === "submitting" ? "Sending…" : state === "success" ? "Subscribed" : "Subscribe";
  const msg =
    state === "success"
      ? `<p class="form-msg" data-status="ok">You're on the list. Next lesson hits email when it ships.</p>`
      : state === "error"
        ? `<p class="form-msg" data-status="err">That doesn't look like an email.</p>`
        : "";
  const value = state === "error" ? ' value="you@domain"' : "";
  return `<form class="form-row" onsubmit="return false">
    <input class="input${state === "focus" ? " is-focus" : ""}" type="email" placeholder="you@domain.com" aria-label="Email"${value}${disabled ? " disabled" : ""}>
    <button class="btn btn-primary" type="submit"${disabled || state === "success" ? " disabled" : ""}>${btnLabel}</button>
  </form>${msg}`;
};

export const COMPONENTS = [
  {
    slug: "button", name: "Button", group: "Actions", height: 300, source: "components/Hero.tsx, components/Subscribe.tsx, components/Nav.tsx",
    summary: "Mono, uppercase, widest-tracked actions: clay-filled primary, outlined secondary, borderless ghost.",
    guide: [
      "Use **primary** (`.btn-primary`: `bg` text on `clay`) once per view, for the action the page exists for: Subscribe, Read the flagship.",
      "Use **secondary** (`.btn-secondary`: `text` on transparent, `border` hairline) beside a primary, or alone for navigation-like actions. Hover turns the border and label `clay`.",
      "Use **ghost** (`.btn-ghost`: `meta` → `text` on hover) for tertiary actions that should read as links.",
      "The nav's compact clay outline (`.btn-nav`) is the Subscribe CTA in the bar; don't reuse it elsewhere.",
      "Disabled is `opacity: 0.4` on any variant, as in the code. Gold is never a button colour.",
      "The consumer supplies the label and, for links, the `href`. The arrow glyphs (→ ↓) are part of the label text.",
    ],
    html: () => matrix([
      ["primary", btn("btn-primary", "Subscribe")],
      ["secondary", btn("btn-secondary", "The logbook ↓")],
      ["ghost", btn("btn-ghost", "Writing")],
      ["nav CTA", [`<a href="#" class="btn btn-nav">Subscribe</a>`, `<a href="#" class="btn btn-nav is-hover">Subscribe</a>`, `<a href="#" class="btn btn-nav is-focus">Subscribe</a>`, `<span class="ds-na">—</span>`]],
    ]),
  },
  {
    slug: "link", name: "Link", group: "Actions", height: 230, source: "app/globals.css (.prose-clay a), components/Footer.tsx, components/Nav.tsx",
    summary: "Three link styles: underlined clay inline links in prose, meta links, and mono nav links.",
    guide: [
      "**Inline** (`.link`): `clay` text, 4px underline offset, underline at `clay` 40% → 100% on hover. Prose only.",
      "**Meta** (`.link-meta`): `meta` → `clay` on hover. Footer contacts, RSS, small print.",
      "**Nav** (`.link-nav`): mono 11px, widest tracking, `meta` → `text` on hover; `aria-current=\"page\"` turns it `clay`. Only route links can be current, never `/#anchor` links.",
      "Focus is the global ring: 2px solid `clay`, 2px offset.",
    ],
    html: () => matrix([
      ["inline", ["default", "hover", "focus"].map((s) => `<p class="ds-p">Read <a href="#" class="link${s === "hover" ? " is-hover" : s === "focus" ? " is-focus" : ""}">the registers</a> first.</p>`)],
      ["meta", ["", " is-hover", " is-focus"].map((c) => `<a href="#" class="link-meta${c}">hello@abdur.ai</a>`)],
      ["nav", [`<a href="#" class="link-nav">Writing</a>`, `<a href="#" class="link-nav is-hover">Writing</a>`, `<a href="#" class="link-nav is-focus">Writing</a>`]],
      ["nav · current", [`<a href="#" class="link-nav" aria-current="page">Writing</a>`, `<span class="ds-na">—</span>`, `<a href="#" class="link-nav is-focus" aria-current="page">Writing</a>`]],
    ], ["default", "hover", "focus"]),
  },
  {
    slug: "tag", name: "Tag", group: "Labels", height: 150, source: "app/writing/page.tsx, components/post/RegisterNote.tsx",
    summary: "Topic tags, the three register badges, and the flagship chip.",
    guide: [
      "**#tag** (`.tag`): mono 10px, wider tracking, `meta`, no box. Lowercase slug after `#`.",
      "**Register badge** (`.badge`): every post declares one. `reported` is `clay` on a `clay` 40% border (it owes receipts); `designed` and `argued` are `meta` on `border`.",
      "**Flagship chip** (`.chip-flagship`): `bg` on `clay`. One per index.",
      "Tags are not interactive in the app; don't give them hover states.",
    ],
    html: () => `<div class="ds-stack">
      <div class="ds-line">${S("#tag")}<span class="tag">#agents</span><span class="tag">#verification</span><span class="tag">#postmortem</span></div>
      <div class="ds-line">${S("register")}${badge("reported")}${badge("designed")}${badge("argued")}</div>
      <div class="ds-line">${S("chip")}<span class="chip-flagship">FLAGSHIP</span><span class="chip-flagship">FLAGSHIP · PINNED</span></div>
    </div>`,
  },
  {
    slug: "status-pill", name: "StatusPill", group: "Labels", height: 110, source: "app/globals.css (.status-pill), components/ToolsGrid.tsx",
    summary: "The four product-status pills: live, near, flight, building.",
    guide: [
      "`.status-pill` + one variant. Mono 10px uppercase, 2px radius, 1px border.",
      "**live**: `bg` on a `clay` fill. **near**: `gold` text on a `surface` fill, `border-2` border. **flight**: `good-text`, `good-3` border. **building**: `meta` text, `border` border.",
      "The label must be literal and true. A pill is a public claim about a product's state.",
      "No red, amber or info variants exist. Don't add them.",
    ],
    html: () => `<div class="ds-line">
      <span class="status-pill status-live">Live</span>
      <span class="status-pill status-near">Near-launch</span>
      <span class="status-pill status-flight">TestFlight</span>
      <span class="status-pill status-building">Building</span>
    </div>`,
  },
  {
    slug: "card", name: "Card", group: "Content", height: 250, source: "components/ToolsGrid.tsx",
    summary: "A surface tile that lifts and picks up a clay border on hover.",
    guide: [
      "`.card`: `surface` fill, `border` hairline, `radius-lg`, 24px padding. Title in Playfair `xl` (`.card-title`), body `sm` `meta` (`.card-body`).",
      "Hover: border and title turn `clay`, the card lifts 6px and casts `shadow-card-hover`.",
      "`aria-disabled=\"true\"` renders at 80% opacity, the code's treatment for a tool still building.",
      "The consumer supplies title, one-line description and `href`; a status pill may sit top-right.",
    ],
    html: () => matrix([
      ["card", ["", " is-hover", " is-focus", ""].map((c, i) => `<a href="#" class="card${c}"${i === 3 ? ' aria-disabled="true"' : ""} style="width:200px"><h3 class="card-title">Northsun</h3><p class="card-body">The memory and enrichment layer for AI agents.</p></a>`)],
    ]),
  },
  {
    slug: "post-card", name: "PostCard", group: "Content", height: 760, source: "app/writing/page.tsx, app/aitldr/page.tsx",
    summary: "The writing-index row and the flagship card: date, register, title, dek, tags, reading time.",
    guide: [
      "**Row** (`.post-row` in a `.post-list`): grid 110px · 1fr · 70px. Date in mono `clay`, register badge plus an optional status note (`meta`), Playfair title (`3xl`), dek in `meta`, #tags, reading time in `meta`.",
      "Hover fills the row `surface` and turns the title `clay`.",
      "**Flagship** (`.post-flagship`): `band` with a `clay` border, `radius-lg`, 40px padding, a 5xl title. At most one per index.",
      "Every value comes from post frontmatter (`lib/posts.ts`). Never type a date, reading time or register by hand.",
    ],
    html: () => `<div class="ds-stack">
      ${S("flagship")}${flagshipCard(POSTS.flagship)}
      ${S("row · default / hover / focus")}
      <ul class="post-list">
        <li>${postRow(POSTS.memory)}</li>
        <li>${postRow(POSTS.retention, "is-hover")}</li>
        <li>${postRow(POSTS.pager, "is-focus")}</li>
      </ul>
    </div>`,
  },
  {
    slug: "callout", name: "Callout", group: "Content", height: 520, source: "components/post/LeadMagnets.tsx, components/post/RegisterNote.tsx",
    summary: "In-post asides: the clay CTA callout, the quiet aside, and the register status note.",
    guide: [
      "**CTA** (`.callout`): `surface`, 4px `clay` left rule, right corners `radius-lg`. Label in mono `clay`, lede in `text-soft`, body in `meta`, one primary button.",
      "**Quiet** (`.callout-quiet`): `band`, hairline border, label in `meta`. For a secondary aside.",
      "**Register note** (`.register-note`): mono xs `meta`, 2px `clay` left rule. Carries a designed or argued post's status line. It's a statement, not fine print.",
      `Product copy in callouts closes with exactly: "${CLOSER}" No other closer exists.`,
    ],
    html: () => `<div class="ds-stack">
      <aside class="callout">
        <p class="callout-label">/// Northsun</p>
        <p class="callout-lede"><strong style="color:rgb(var(--c-text))">Northsun</strong> is the memory and enrichment layer for AI agents.</p>
        <p class="callout-body">${CLOSER}</p>
        <a href="#" class="btn btn-primary">northsun.ai →</a>
      </aside>
      <aside class="callout-quiet">
        <p class="callout-label">/// The logbook</p>
        <p class="callout-lede">When I learn it the hard way, you get the TLDR the same week.</p>
        <a href="#" class="btn btn-secondary">Subscribe</a>
      </aside>
      <p class="register-note">Design. Not built yet.</p>
    </div>`,
  },
  {
    slug: "code-block", name: "CodeBlock", group: "Content", height: 250, source: "app/globals.css (.prose-clay code, pre)",
    summary: "Inline code and the fenced block, both on surface with a hairline border.",
    guide: [
      "**Inline** (`.code-inline`): mono `sm`, `text` on `surface`, `border`, `radius` (4px).",
      "**Block** (`.code-block` / `.prose-clay pre`): mono `sm`, `surface`, `border`, `radius-lg`, 20px padding, horizontal scroll.",
      "No syntax-highlight palette exists. Code is set in `text`, and nothing else in the palette may stand in for one.",
    ],
    html: () => `<div class="ds-stack">
      <p class="ds-p">Opacity composes from the token: <code class="code-inline">rgb(var(--c-clay) / 0.4)</code>.</p>
      <pre class="code-block"><code>:root[data-theme="light"] {
  --c-clay: 174 83 56;
}

.eyebrow {
  @apply font-mono text-xs tracking-widest text-clay uppercase;
}</code></pre>
    </div>`,
  },
  {
    slug: "newsletter-form", name: "NewsletterForm", group: "Forms", height: 470, source: "components/Subscribe.tsx",
    summary: "Email capture with the four states the code renders: idle, submitting, success, error.",
    guide: [
      "Input (`.input`): `surface` fill, `muted` border (3:1 on every ground), mono `sm`, placeholder in `meta`. Focus swaps the border to `clay` (the code removes the outline here).",
      "Button: primary. **Submitting**: input and button disabled, label `Sending…`. **Success**: button disabled `Subscribed`, message in `good-text`. **Error**: message in `clay`. No red exists.",
      "Messages are the code's own strings. Keep them, and add no promises about cadence or volume.",
      "The consumer supplies the action (`/api/subscribe`), the honeypot field and the render timestamp, as `Subscribe.tsx` does.",
    ],
    html: () => `<div class="ds-stack">
      ${S("idle")}${formState("idle")}
      ${S("focus")}${formState("focus")}
      ${S("submitting")}${formState("submitting")}
      ${S("success")}${formState("success")}
      ${S("error")}${formState("error")}
    </div>`,
  },
  {
    slug: "nav-bar", name: "NavBar", group: "Navigation", height: 200, source: "components/Nav.tsx, lib/site.ts (NAV)",
    summary: "The fixed top bar: brand with the pulsing clay dot, six mono links, theme toggle, Subscribe.",
    guide: [
      "Height 56px (`nav-height`), content width 1280px. Transparent at the top. Past 12px of scroll it becomes `bg` at 85% with a 12px blur and a `border` hairline (`data-scrolled=\"true\"`).",
      "Brand: Playfair `lg`, `text` → `clay` on hover, led by the `pulse-clay` dot, the only use of that animation besides the hero eyebrow.",
      "Links come from `NAV` in `lib/site.ts`: Writing, Ship log, Tools, Northsun, About, Hire. They're hidden below 768px.",
    ],
    html: () => `<div class="ds-stack">${S("top of page")}${navBar(false)}${S("scrolled")}${navBar(true)}</div>`,
  },
  {
    slug: "footer", name: "Footer", group: "Navigation", height: 330, source: "components/Footer.tsx",
    summary: "Three-column footer with site links, contacts, and the legal strip.",
    guide: [
      "`bg` with a top `border`. Columns: brand + tagline (`meta`), two mono link lists (`meta` → `text`), Find me (label `meta`, links → `clay`).",
      "Legal strip: mono 10px `meta`. The copyright line, the ASEC parent link, then RSS · llms.txt · Sitemap.",
      "Copy is fixed in code. The ASEC link says 'coming' because it is.",
    ],
    html: () => footerHtml,
  },
  {
    slug: "pagination", name: "Pagination", group: "Navigation", height: 300, source: "components/post/PostArticle.tsx",
    summary: "Previous and next post cards at the foot of an article. The site has no numbered pagination.",
    guide: [
      "`.pager`: two equal columns under a `border` rule, prose width. Each `.pager-link` is a `surface` card. The direction label is mono 10px `meta`, the title is Playfair `lg`.",
      "Hover: border and title turn `clay`. Next aligns right.",
      "A missing side renders an empty cell, so the first post shows only Next. There's no disabled card.",
      "Index pages list every post. Numbered pagination doesn't exist, and this system adds none.",
    ],
    html: () => `<div class="ds-stack">
      ${S("both · next hovered")}
      <nav class="pager" aria-label="Previous and next post">
        <a href="#" class="pager-link"><p class="pager-dir">← Previous</p><p class="pager-title">${POSTS.meta.title}</p></a>
        <a href="#" class="pager-link next is-hover"><p class="pager-dir">Next →</p><p class="pager-title">${POSTS.memory.title}</p></a>
      </nav>
      ${S("first post · focus")}
      <nav class="pager" aria-label="Previous and next post"><div></div>
        <a href="#" class="pager-link next is-focus"><p class="pager-dir">Next →</p><p class="pager-title">${POSTS.pager.title}</p></a>
      </nav>
    </div>`,
  },
  {
    slug: "empty-state", name: "EmptyState", group: "Content", height: 260, source: "none (requested by the brief; composed from existing classes)",
    summary: "What a list shows when it has nothing to list, built only from existing pieces.",
    guide: [
      "Intentional addition: the app has no empty state today. It's composed from `.eyebrow-muted`, a Playfair `2xl` line, a `meta` sentence and a secondary button. No new styles.",
      "Say what's missing and where to go. Never promise a date or a count.",
    ],
    html: () => `<div class="empty">
      <p class="eyebrow-muted">/// Nothing here yet</p>
      <h3 class="empty-title">No posts in this register.</h3>
      <p class="empty-body">Every piece declares whether it is reported, designed, or argued. None has been filed under this one.</p>
      <a href="#" class="btn btn-secondary">All writing →</a>
    </div>`,
  },
  {
    slug: "theme-toggle", name: "ThemeToggle", group: "Actions", height: 230, source: "components/ThemeToggle.tsx, lib/theme.ts",
    summary: "The tri-state theme pill: Auto, then Light, then Dark, with the resolved theme always shown.",
    guide: [
      "Cycles Auto → Light → Dark → Auto. Auto follows the visitor's clock (light 06:00–17:59) and is stored as the absence of `localStorage[\"abdur-theme\"]`.",
      "The label shows the resolved theme, prefixed `Auto ·` when chosen for you. It has a fixed 74px minimum width so the nav never reflows.",
      "Pill: `border` hairline, `radius-full`, mono 10px `text`. Hover turns border and label `clay`. Icon well in `surface`: a sun for light, a moon for dark, both drawn in `currentColor`.",
    ],
    html: () => matrix([
      ["Auto · Dark", [toggle("moon", "Auto · Dark"), toggle("moon", "Auto · Dark", "is-hover"), toggle("moon", "Auto · Dark", "is-focus")]],
      ["Light", [toggle("sun", "Light"), toggle("sun", "Light", "is-hover"), toggle("sun", "Light", "is-focus")]],
      ["Dark", [toggle("moon", "Dark"), toggle("moon", "Dark", "is-hover"), toggle("moon", "Dark", "is-focus")]],
    ], ["default", "hover", "focus"]),
  },
];

export { CLOSER, navBar, toggle, badge };
