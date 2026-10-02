// abdur.ai Design System 1.0 — page templates on the real routes.
// Structure and classes mirror the route files named in `source`. Copy is
// either published site copy or an explicit structural placeholder; nothing
// here adds a number, customer or claim the site doesn't already make.

import { POSTS, CLOSER, navBar, footerHtml, postRow, flagshipCard, badge } from "./components.mjs";

const page = (inner) => `${navBar(true)}\n<main>\n${inner}\n</main>\n${footerHtml}`;

const subscribeSection = `<section style="border-top:1px solid rgb(var(--c-border));background:rgb(var(--c-bg-2))">
  <div class="container" style="padding-top:var(--space-16);padding-bottom:var(--space-16)">
    <p class="eyebrow" style="margin-bottom:var(--space-4)">/// The logbook, not the pitch.</p>
    <p class="lede" style="margin-bottom:40px">When I learn it the hard way, you get the TLDR the same week. Pager is not the customer. The number is not the person. More of that as I write it. Not a product tour. Not a waitlist for a platform that is not done.</p>
    <form class="form-row" onsubmit="return false"><input class="input" type="email" placeholder="you@domain.com" aria-label="Email"><button class="btn btn-primary" type="submit">Subscribe</button></form>
  </div>
</section>`;

const northsunCallout = `<aside class="callout">
  <p class="callout-label">/// Northsun</p>
  <p class="callout-lede"><strong style="color:rgb(var(--c-text))">Northsun</strong> is the memory and enrichment layer for AI agents.</p>
  <p class="callout-body">${CLOSER}</p>
  <a href="#" class="btn btn-primary">northsun.ai →</a>
</aside>`;

const placeholder = (route) =>
  `<p class="register-note">Structural placeholder. The section copy for this page lives in ${route}; the template shows layout and type only.</p>`;

export function TEMPLATES({ postCount }) {
  return [
    {
      slug: "home", name: "Home", route: "/", source: "app/page.tsx (Hero, LatestFeed, ToolsGrid, Subscribe)", height: 1000,
      html: page(`
<section class="container" style="position:relative;padding-top:160px;padding-bottom:128px">
  <div aria-hidden="true" style="position:absolute;top:80px;right:40px;font-family:var(--font-display);font-size:200px;line-height:1;color:rgb(var(--c-clay) / 0.06);user-select:none;pointer-events:none">AS</div>
  <p class="eyebrow" style="margin-bottom:var(--space-8)"><span class="dot animate-pulse-clay" style="margin-right:var(--space-2);vertical-align:middle" aria-hidden="true"></span>Solo AI founder · Prospect Park, NJ · NYC metro</p>
  <h1 class="animate-hero-in" style="font-family:var(--font-display);font-weight:var(--weight-extrabold);font-size:var(--text-hero);line-height:var(--leading-hero);letter-spacing:var(--tracking-hero);margin:0">I ship AI things<br>and write the TLDR.<span style="font-style:italic;font-weight:var(--weight-medium);color:rgb(var(--c-muted-2));font-size:0.3em;margin-left:0.45em;letter-spacing:-0.01em;white-space:nowrap">shipped at 2am.</span></h1>
  <div class="accent-rule" style="margin:var(--space-8) 0 var(--space-6)"></div>
  <p class="lede" style="max-width:560px">Abdur Rahman Sayeed — solo AI founder running a portfolio of vertical AI products on one memory spine, Northsun. One human on strategy, an agent team on execution. This is the logbook: what shipped, what broke, what I learned.</p>
  <div style="margin-top:40px;display:flex;flex-wrap:wrap;gap:var(--space-3)"><a href="#" class="btn btn-primary">Read the flagship postmortem →</a><a href="#" class="btn btn-secondary">The logbook ↓</a></div>
</section>
<section class="container" style="padding-bottom:96px">
  <p class="eyebrow" style="margin-bottom:var(--space-4)">/// Latest</p>
  <h2 class="h-section" style="margin-bottom:var(--space-12)">The logbook</h2>
  <ul class="post-list"><li>${postRow(POSTS.memory)}</li><li>${postRow(POSTS.meta)}</li><li>${postRow(POSTS.pager)}</li></ul>
</section>
<section class="container" style="padding-bottom:96px">
  <p class="eyebrow" style="margin-bottom:var(--space-4)">/// The stand</p>
  <h2 class="h-section" style="margin-bottom:var(--space-3)">The stand</h2>
  <p class="lede" style="margin-bottom:var(--space-12)">Where the portfolio stands today — Northsun is the spine, these are the products on top.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--space-4)">
    ${[["status-live", "Live"], ["status-near", "Near-launch"], ["status-flight", "TestFlight"], ["status-building", "Building"]]
      .map(([cls, label]) => `<a href="#" class="card"${label === "Building" ? ' aria-disabled="true"' : ""}><div style="display:flex;justify-content:flex-end;margin-bottom:20px"><span class="status-pill ${cls}">${label}</span></div><h3 class="card-title">Product name</h3><p class="card-body">Placeholder: one line from components/ToolsGrid.tsx.</p></a>`)
      .join("")}
  </div>
</section>
<section class="container" style="padding-bottom:96px">${northsunCallout}</section>
${subscribeSection}`),
    },
    {
      slug: "post", name: "Post page", route: "/writing/[slug]", source: "components/post/PostArticle.tsx", height: 1000,
      html: page(`
<article class="container" style="padding-top:128px;padding-bottom:80px">
  <header style="max-width:var(--prose-max);margin:0 auto">
    <p class="eyebrow" style="margin-bottom:var(--space-6)">ai-agents · agent-memory · memory · architecture</p>
    <h1 style="font-family:var(--font-display);font-weight:400;font-size:var(--text-6xl);line-height:var(--leading-post-h1);letter-spacing:var(--tracking-tight);margin:0 0 var(--space-6)">${POSTS.memory.title}</h1>
    <p style="font-family:var(--font-display);font-style:italic;font-size:var(--text-2xl);line-height:var(--leading-2xl);color:rgb(var(--c-muted));margin:0 0 var(--space-6)">Not the context window, not a vector database: the part that decides what an agent keeps, about whom, and when it comes back</p>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-3);font-family:var(--font-mono);font-size:var(--text-xs);color:rgb(var(--c-muted-3))">${badge("argued")}<span>SEP 29</span><span>·</span><span>7 min read</span><span>·</span><span>by Abdur Rahman Sayeed</span></div>
    <div class="accent-rule" style="margin-top:var(--space-8)"></div>
    <p class="register-note">Argument and definition. The Northsun paragraph describes a design, not a measurement: no benchmark, no customer, no measured latency.</p>
  </header>
  <div class="prose-clay" style="margin:var(--space-12) auto 0">
    <p>Structural sample. This is how a post body sets: <strong>bold for the load-bearing phrase</strong>, <a href="#">inline links in clay</a>, and <code>inline code</code> on a surface chip. The real body renders from MDX in content/posts/.</p>
    <h2>A second-level heading</h2>
    <p>Paragraphs run at the large body size with relaxed leading, in text-soft, inside a 65-character measure.</p>
    <ul><li>List items keep the body size.</li><li>Bullets sit outside the measure.</li></ul>
    <blockquote>A pull quote sets in Playfair italic, in clay, behind a 2px clay rule.</blockquote>
    <h3>A third-level heading</h3>
    <pre><code>const theme = resolveTheme("auto"); // light 06:00–17:59</code></pre>
    <hr>
  </div>
  <div style="max-width:var(--prose-max);margin:var(--space-12) auto 0">${northsunCallout}</div>
  <nav class="pager" aria-label="Previous and next post" style="margin:80px auto 0">
    <a href="#" class="pager-link"><p class="pager-dir">← Previous</p><p class="pager-title">${POSTS.meta.title}</p></a>
    <div></div>
  </nav>
</article>`),
    },
    {
      slug: "aitldr", name: "Feed list", route: "/aitldr", source: "app/aitldr/page.tsx", height: 1000,
      html: page(`
<div class="container" style="padding-top:128px;padding-bottom:96px">
  <p class="eyebrow" style="margin-bottom:var(--space-4)">/// AITLDR</p>
  <h1 class="h-page" style="margin-bottom:var(--space-4)">The logbook.</h1>
  <p class="lede" style="margin-bottom:var(--space-16)">${postCount} entries · evidence-anchored builder logs · RSS available.</p>
  <div style="margin-bottom:var(--space-16)">${flagshipCard(POSTS.flagship, "FLAGSHIP · PINNED")}</div>
  <ul class="post-list"><li>${postRow(POSTS.memory)}</li><li>${postRow(POSTS.meta)}</li><li>${postRow(POSTS.pager)}</li><li>${postRow(POSTS.retention)}</li></ul>
  <p style="margin-top:40px;font-family:var(--font-mono);font-size:var(--text-xs);color:rgb(var(--c-muted-3))">Subscribe via <a href="#" class="link-meta">RSS</a> · <a href="#" class="link-meta">email</a></p>
</div>`),
    },
    {
      slug: "about", name: "About", route: "/about", source: "app/about/page.tsx", height: 1000,
      html: page(`
<div class="container" style="padding-top:128px;padding-bottom:96px">
  <p class="eyebrow" style="margin-bottom:var(--space-4)">/// /whoami</p>
  <h1 class="h-page" style="margin-bottom:var(--space-12)">Who is this person?</h1>
  <div class="prose-clay">
    <p>I'm Abdur Rahman Sayeed. I build production AI systems by myself, from Prospect Park, NJ · NYC metro, and I write down exactly how they work.</p>
    <h2>What I build</h2>
    <p>Everything I make sits under <strong>Northsun</strong> — the memory and enrichment layer for AI agents. ${CLOSER}</p>
    <h2>How I actually work</h2>
    ${placeholder("app/about/page.tsx")}
    <h2>What I'm aiming at</h2>
    ${placeholder("app/about/page.tsx")}
  </div>
</div>`),
    },
    {
      slug: "hire", name: "Hire", route: "/hire", source: "app/hire/page.tsx", height: 1000,
      html: page(`
<section class="container" style="position:relative;padding-top:128px;padding-bottom:96px">
  <div aria-hidden="true" style="position:absolute;top:24px;right:24px;font-family:var(--font-display);font-size:180px;line-height:1;color:rgb(var(--c-clay) / 0.06);user-select:none;pointer-events:none">AS</div>
  <div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-bottom:28px">
    <p class="eyebrow" style="letter-spacing:0.2em;display:flex;align-items:center;gap:var(--space-2)"><span class="dot animate-pulse-clay" aria-hidden="true"></span>/// Hire</p>
    <span class="status-pill status-near">Open to roles</span>
  </div>
  <h1 style="font-family:var(--font-display);font-weight:var(--weight-extrabold);font-size:76px;line-height:0.98;letter-spacing:var(--tracking-tight);margin:0">One page of resume.<br>A site full of proof.</h1>
  <div class="accent-rule" style="margin:var(--space-8) 0 var(--space-6)"></div>
  <p class="lede" style="max-width:620px">Applied AI engineer · forward deployed · client delivery. I build agent systems and the machinery that proves they work — deploy gates, evidence ledgers, rollback paths. Status labels below are literal — shipped means shipped, and a prototype says so.</p>
  <div style="margin-top:40px;display:flex;flex-wrap:wrap;gap:var(--space-3)"><a href="#" class="btn btn-primary">Résumé ↓</a><a href="#" class="btn btn-secondary">Read it here</a></div>
</section>
${["Systems that show their work.", "Many agents, one accountable lane.", "Inside someone else's constraints."]
  .map((h, i) => `<section class="container" style="padding-bottom:96px">
  <p class="eyebrow" style="margin-bottom:var(--space-4)">/// ${["What I build", "How I work", "Client delivery"][i]}</p>
  <h2 style="font-family:var(--font-display);font-weight:400;font-size:44px;line-height:1.06;letter-spacing:var(--tracking-tight);max-width:20ch;margin:0 0 14px">${h}</h2>
  ${placeholder("app/hire/page.tsx")}
</section>`)
  .join("\n")}`),
    },
  ];
}
