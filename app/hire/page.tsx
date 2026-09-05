import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HireActions } from "@/components/hire/HireActions";
import { ResumeSheet } from "@/components/hire/ResumeSheet";
import { OPEN_TO_ROLES, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hire me",
  description:
    "Abdur Rahman Sayeed — applied AI engineer, forward deployed, client delivery. Agent systems and the machinery that proves they work: deploy gates, evidence ledgers, rollback paths.",
  alternates: { canonical: `${SITE.url}/hire` },
};

/**
 * Route-scoped presentation. Three things live here rather than in
 * tailwind.config.ts, so the /hire design needs no token override of its own:
 * the sheet's sway/peel/breath keyframes, and the paper + overlay custom
 * properties, which are page-local and themed alongside the site palette.
 */
const HIRE_STYLE = `
.hire-root {
  --hire-sheet-shadow: 0 32px 80px -24px rgba(0,0,0,.8);
  --hire-sheet-shadow-hi: 0 48px 100px -28px rgba(0,0,0,.92);
  --hire-peel-bg: linear-gradient(135deg,#0E0C0A 30%,#060504 100%);
  --hire-peel-paper: linear-gradient(315deg,#DCCFB8 0%,#F3ECDF 60%);
  --hire-peel-shadow: rgba(0,0,0,.55);
  --hire-overlay: rgba(5,4,3,.72);
}
:root[data-theme="light"] .hire-root {
  --hire-sheet-shadow: 0 24px 60px -28px rgba(60,40,20,.38);
  --hire-sheet-shadow-hi: 0 44px 90px -32px rgba(60,40,20,.55);
  --hire-peel-bg: linear-gradient(135deg,#EFE8DB 30%,#DCD0BB 100%);
  --hire-peel-paper: linear-gradient(315deg,#E0D3BC 0%,#FBF6EC 60%);
  --hire-peel-shadow: rgba(96,72,48,.4);
  --hire-overlay: rgba(52,38,24,.55);
}
.hire-sheet {
  box-shadow: var(--hire-sheet-shadow);
  transition: box-shadow .7s ease, transform .7s cubic-bezier(.2,.7,.2,1);
}
.hire-sheet:hover {
  box-shadow: var(--hire-sheet-shadow-hi);
  transform: translateY(-10px);
}
@media (min-width: 768px) {
  .hire-sheet { animation: hirePaperSway 7.8s ease-in-out infinite; }
}
.hire-peel { animation: hireCornerPeel 6.5s ease-in-out infinite; }
.hire-watermark { animation: hireBreath 9s ease-in-out infinite; }
@keyframes hirePaperSway { 0%,100% { transform: rotate(-0.28deg); } 50% { transform: rotate(0.28deg); } }
@keyframes hireCornerPeel { 0%,100% { transform: scale(0.55); } 55% { transform: scale(1); } }
@keyframes hireBreath { 0%,100% { opacity: .55; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-8px); } }
@media (prefers-reduced-motion: reduce) {
  .hire-sheet, .hire-peel, .hire-watermark { animation: none !important; }
  .hire-sheet { transition: none !important; }
  .hire-sheet:hover { transform: none; }
}
`;

const SECTION = "max-w-content mx-auto px-6 md:px-10 pt-[88px]";
const EYEBROW = "font-mono text-xs tracking-[0.2em] uppercase text-clay mb-4";
const H2 = "font-display text-[30px] md:text-[44px] leading-[1.06] tracking-tight text-text";
const CARD = "bg-surface border border-border rounded-md p-[18px] hover:border-clay transition-colors";
const CARD_LABEL = "font-mono text-[11px] tracking-wider uppercase text-clay mb-2";
const CARD_BODY = "text-[13px] leading-relaxed text-muted text-pretty";
const LEDE = "text-[17px] leading-relaxed text-muted max-w-[760px] text-pretty mb-9";

const WHAT_I_BUILD = [
  {
    label: "evidence over assertion",
    body: "Decisions land as dated records with the option chosen, the alternatives rejected, and the rollback path. A locked record is never edited in place — amendments get their own dated file, so the history stays readable.",
  },
  {
    label: "gates that fail loudly",
    body: "Continuous deployment queries the production schema before it will deploy, so a migration that did not actually land stops the release instead of silently passing. Every migration ships with a down-migration and a runbook.",
  },
  {
    label: "agents that review agents",
    body: "I run multiple frontier models against each other with adversarial review before merge, and treat their output as untrusted until a gate confirms it.",
  },
];

const HOW_I_WORK = [
  {
    label: "one mutable owner",
    body: "Two agents editing one artifact is a merge conflict with extra steps. Every work item names its owning lane before a byte is written, and a second agent reviews rather than edits.",
  },
  {
    label: "the author never approves",
    body: "Every change is reviewed by an agent on a different provider with fresh context. Same-model self-review finds what the model was already inclined to miss. Law-touching changes always require a non-author reviewer; there is no self-review exemption for them.",
  },
  {
    label: "verify the substrate, not the name",
    body: 'A review is independent only if the runtime actually differs. I check that, because a "second reviewer" running the same model underneath is a rubber stamp with a different label.',
  },
];

const REVIEW_FINDINGS = [17, 17, 19, 15, 22, 9, 14, 4, 7, 7, 10, 12];
const PEAK = Math.max(...REVIEW_FINDINGS);

const DELIVERY = [
  {
    title: "Enterprise retail IT delivery",
    dates: "Apr 2024 – Jul 2025",
    body: "At One Asec, delivered a retail IT subcontract for Vox Elements supporting ETRO Fashion US — 200+ users, 14 sites, 500+ tracked assets. Identity and endpoint policy across Active Directory, Entra ID, Intune; Lansweeper, Cisco/RingCentral, Jira triage, cross-site escalation.",
  },
  {
    title: "Automotive business systems",
    dates: "2020 – 2024",
    body: "Built and operated business, reporting, and IT foundations for three automotive-service businesses. QuickBooks, Excel, Power BI; reconciliation automated with Python and SQL.",
  },
];

type Dot = "clay" | "gold" | "hollow";
const SYSTEMS: { name: string; dot: Dot; strongBorder: boolean; status: string; body: string }[] = [
  {
    name: "Northsun",
    dot: "clay",
    strongBorder: true,
    status: "In development · SDK on npm · not GA",
    // Verbatim claims_policy.IDENTITY — do not paraphrase.
    body: "Northsun is the memory and enrichment layer for AI agents.",
  },
  {
    name: "Relay",
    dot: "gold",
    strongBorder: true,
    status: "Deployed pilot · agent control plane in review",
    body: "Event spine for the company's automations: authenticated webhook ingress, fenced leases, receipts that make a duplicate impossible.",
  },
  {
    name: "BrowseFlow",
    dot: "hollow",
    strongBorder: false,
    status: "Working prototype · reproducible locally",
    body: "Agent-agnostic browser automation — accessibility-tree perception, CDP-first hybrid engine, approval queues, run journal.",
  },
  {
    name: "HeyCLI",
    dot: "hollow",
    strongBorder: false,
    status: "Working prototype · iOS client + bridge",
    body: "Voice-driven multi-session orchestration for coding agents over an authenticated WebSocket.",
  },
  {
    name: "Dockerfile.ai",
    dot: "gold",
    strongBorder: true,
    status: "Shipped",
    body: "Dockerfile generation, explanation, and optimization — verified in a sandbox before you trust it.",
  },
];

const INTAKE = [
  { k: "voice · telephony", v: "inbound callers, live turns" },
  { k: "agent runtimes", v: "tool calls, session events" },
  { k: "app events", v: "webhooks, product signals" },
];

const STACK = [
  "Cloudflare Workers",
  "Hono",
  "Supabase · Postgres · pgvector",
  "Upstash Redis + QStash",
  "Sentry",
  "MCP SDK",
];

/**
 * Counted on origin/main @ 3155bc5e (2026-09-03) with `git ls-tree`, not
 * carried over from a draft. If you change the dateline, re-run the counts.
 */
const REPO_COUNTS = [
  { value: "330", note: "test files · *.test.ts across the workspace", clay: false },
  { value: "15", note: "CI workflow files · 13 run on push or PR, 2 are manual dispatch", clay: false },
  { value: "16", note: "workspace packages", clay: false },
  { value: "@mnemix-ai/client", note: "published SDK on npm · v0.2.2", clay: true },
];

function StatusPill({
  dot,
  strongBorder,
  children,
}: {
  dot: Dot;
  strongBorder: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 self-start font-mono text-[10px] tracking-wide text-text-soft bg-bg-2 border rounded-sm px-2.5 py-1 ${
        strongBorder ? "border-border-2" : "border-border"
      }`}
    >
      <span
        aria-hidden
        className={`w-[5px] h-[5px] rounded-full flex-none ${
          dot === "clay" ? "bg-clay" : dot === "gold" ? "bg-gold" : "border border-muted"
        }`}
      />
      {children}
    </span>
  );
}

export default function HirePage() {
  return (
    <div className="hire-root">
      <style dangerouslySetInnerHTML={{ __html: HIRE_STYLE }} />
      <Nav />

      <main className="pt-14">
        {/* ── Hero ── */}
        <section className="relative max-w-content mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-16 md:pb-20">
          <div
            aria-hidden
            className="hire-watermark pointer-events-none absolute top-2 right-2 lg:top-6 lg:right-6 font-display text-[96px] lg:text-[180px] leading-none text-clay/[0.06] select-none"
          >
            AS
          </div>

          <div className="flex items-center gap-3.5 mb-7 flex-wrap">
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-clay flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-clay animate-pulse-clay" aria-hidden />
              /// Hire
            </p>
            {OPEN_TO_ROLES && (
              <span className="font-mono text-[10px] tracking-wider uppercase text-gold border border-border-2 px-2 py-0.5 rounded-sm">
                Open to roles
              </span>
            )}
          </div>

          <h1 className="font-display font-extrabold text-[48px] md:text-[76px] leading-[0.96] md:leading-[0.98] tracking-tight text-text">
            One page of resume.
            <br />A site full of proof.
          </h1>
          <div className="w-[60px] h-0.5 bg-clay mt-8 mb-6" />
          <p className="max-w-[620px] text-base md:text-lg leading-relaxed text-muted text-pretty">
            Applied AI engineer · forward deployed · client delivery. I build agent systems and the
            machinery that proves they work — deploy gates, evidence ledgers, rollback paths. Status labels
            below are literal — shipped means shipped, and a prototype says so.
          </p>
          <p className="max-w-[620px] text-base md:text-lg leading-relaxed text-text-soft text-pretty mt-5">
            Drop me into a team whose agents work in the demo and break in production, and in week one the
            failure is surfaced, gated, and rolled back — not argued about.
          </p>

          <HireActions />
        </section>

        <ResumeSheet />

        {/* ── What I build ── */}
        <section className={SECTION}>
          <p className={EYEBROW}>/// What I build</p>
          <h2 className={`${H2} max-w-[20ch] mb-3.5`}>Systems that show their work.</h2>
          <p className={LEDE}>
            I work the forward-deployed pattern: sit with the operator, learn the real constraint, build the
            system underneath it, then build the evidence that proves it behaves. Most of my recent work is
            agent infrastructure — memory and governance for AI agents, browser automation with approval
            points, and multi-session orchestration for coding agents.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {WHAT_I_BUILD.map((c) => (
              <div key={c.label} className={CARD}>
                <p className={CARD_LABEL}>{c.label}</p>
                <p className={CARD_BODY}>{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Corrections ── */}
        <section className={SECTION}>
          <p className={EYEBROW}>/// Corrections</p>
          <h2 className={`${H2} max-w-[20ch] mb-6`}>Twelve reviews to learn one thing.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
            <div>
              <p className="text-[17px] leading-relaxed text-muted text-pretty mb-[18px]">
                I wrote an operating charter for a fleet of agents and put it through twelve independent
                adversarial reviews — each a fresh context, each on a different provider from the one that
                wrote the document. Substantive findings per pass:
              </p>
              <div className="border border-border rounded-sm bg-bg-2 pt-4 px-[18px] pb-3">
                <div className="grid grid-cols-12 gap-1.5 items-end">
                  {REVIEW_FINDINGS.map((n, i) => {
                    const peak = n === PEAK;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <span
                          className={`w-full block ${peak ? "bg-clay" : "bg-border-2"}`}
                          style={{ height: `${Math.round((n / PEAK) * 40)}px` }}
                        />
                        <span className={`font-mono text-xs ${peak ? "text-clay" : "text-text-soft"}`}>{n}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="font-mono text-[9.5px] tracking-wider uppercase text-muted-3 mt-3">
                  substantive findings · pass 1 → 12
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-[18px]">
              <p className="text-[17px] leading-relaxed text-muted text-pretty">
                It never converged, and the reason was the finding. Every surviving objection had the same
                shape. A daily cap that prose &ldquo;enforces&rdquo; is not atomic. A safety check that must
                run &ldquo;immediately before sending&rdquo; cannot run inside a third-party scheduler.
                &ldquo;The author is never the approver&rdquo; cannot be proven while every lane commits under
                one identity.
              </p>
              <p className="text-[17px] leading-relaxed text-text-soft text-pretty">
                <span className="text-text font-semibold">Prose cannot enforce a mechanism.</span> So I stopped
                rewriting the document and took the authority out of it: every outward action became frozen by
                default, and the permission table moved into code, where a uniqueness constraint can hold what
                a sentence cannot. The document got shorter and the system got safer.
              </p>
              <div className="border-t border-border pt-[18px]">
                <p className="text-[15.5px] leading-relaxed text-muted text-pretty">
                  The audit that made the point concrete: I inventoried the automations across five roots and
                  found that none of them had an independent witness. Every one could have died silently and
                  reported nothing — an unwatched automation is indistinguishable from a dead one.
                  Witness-before-workload is now the first thing I build on any pipeline, ahead of the
                  pipeline.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How I work ── */}
        <section className={SECTION}>
          <p className={EYEBROW}>/// How I work</p>
          <h2 className={`${H2} max-w-[20ch] mb-3.5`}>Many agents, one accountable lane.</h2>
          <p className={LEDE}>
            I run coding and research agents from four providers concurrently — Claude, GPT, GLM, Kimi —
            across several machines, with cross-session message passing and a shared decision log. It is not
            a novelty setup; it is how the work gets done. What makes it survivable is the operating model
            underneath it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {HOW_I_WORK.map((c) => (
              <div key={c.label} className={CARD}>
                <p className={CARD_LABEL}>{c.label}</p>
                <p className={CARD_BODY}>{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Client delivery ── */}
        <section className={SECTION}>
          <p className={EYEBROW}>/// Client delivery</p>
          <h2 className={`${H2} max-w-[22ch] mb-8`}>Inside someone else&apos;s constraints.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {DELIVERY.map((d) => (
              <div
                key={d.title}
                className="bg-surface border border-border rounded-md px-6 py-6 flex flex-col gap-3 hover:border-clay transition-colors"
              >
                <div className="flex justify-between items-baseline gap-4 flex-wrap">
                  <p className="font-display text-[22px] leading-tight text-text">{d.title}</p>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-muted-3 whitespace-nowrap">
                    {d.dates}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted text-pretty">{d.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Selected systems ── */}
        <section className={SECTION}>
          <p className={EYEBROW}>/// Selected systems</p>
          <h2 className={`${H2} max-w-[20ch] mb-3.5`}>Five systems, labeled honestly.</h2>
          <p className="text-[17px] leading-relaxed text-muted max-w-[680px] text-pretty mb-9">
            Status labels are literal. Shipped means shipped; a prototype says so.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {SYSTEMS.map((s) => (
              <div
                key={s.name}
                className="bg-surface border border-border rounded-md px-6 py-6 flex flex-col gap-3 hover:border-clay transition-colors"
              >
                <div className="flex flex-col gap-2.5">
                  <p className="font-display text-[26px] leading-none tracking-tight text-text">{s.name}</p>
                  <StatusPill dot={s.dot} strongBorder={s.strongBorder}>
                    {s.status}
                  </StatusPill>
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted text-pretty">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Northsun architecture ── */}
        <section className={`${SECTION} pb-16`}>
          <p className={EYEBROW}>/// Northsun — architecture</p>
          <h2 className="font-display text-[32px] md:text-[52px] leading-[1.04] tracking-tight text-text max-w-[16ch] mb-3">
            Memory as governance, not a bolt-on.
          </h2>
          {/* Dual-brand law: Mnemix appears only as the Memory Lab / Forgetting Test. */}
          <p className="font-mono text-[11.5px] leading-relaxed text-muted-3 max-w-[640px] mb-[18px]">
            Northsun is the memory and enrichment layer for AI agents. Mnemix is the Memory Lab / Forgetting Test — a free diagnostic from Northsun.
          </p>
          <p className="text-[17px] leading-relaxed text-muted max-w-[660px] text-pretty mb-12">
            Gate-first, router-second. The architecture is designed so no write lands until it clears the
            gate, and corrections deprecate old beliefs rather than silently overwriting them. BEAD is the
            spine: two clocks on every fact — when it was true, and when it was learned — so a retrieval can
            be replayed and graded against reality.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-stretch">
            <div className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {INTAKE.map((i) => (
                  <div key={i.k} className="bg-surface border border-border rounded-md px-4 py-3.5">
                    <p className="font-mono text-[11px] text-text">{i.k}</p>
                    <p className="text-xs text-muted mt-1">{i.v}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center py-1.5">
                <span className="font-mono text-xs text-clay">
                  ▼&nbsp;&nbsp;observe — throttled, durable, replayable intake
                </span>
              </div>
              <div className="bg-surface border border-clay rounded-md px-5 py-4">
                <div className="flex justify-between items-baseline gap-3 flex-wrap">
                  <p className="font-mono text-xs tracking-wider uppercase text-clay">the gate</p>
                  <p className="font-mono text-[10px] tracking-wide uppercase text-muted-3">
                    gate-first · router-second
                  </p>
                </div>
                <p className="text-[13px] leading-snug text-muted mt-2">
                  Designed so no write lands until it clears the gate. Corrections deprecate old beliefs —
                  nothing is silently overwritten.
                </p>
              </div>
              <div className="flex justify-center py-1.5">
                <span className="font-mono text-xs text-clay">▼</span>
              </div>
              <div className="bg-bg-2 border border-border-2 rounded-md px-5 py-[18px] flex-1">
                <div className="flex justify-between items-baseline gap-3 flex-wrap">
                  <p className="font-display text-[22px] text-text">
                    BEAD{" "}
                    <span className="font-body text-[13px] text-muted">
                      — bi-temporal, evidence-anchored decisions
                    </span>
                  </p>
                  <p className="font-mono text-[10px] tracking-wide uppercase text-gold">the memory spine</p>
                </div>
                <p className="text-[13px] leading-snug text-muted mt-2 mb-3.5">
                  Two clocks on every fact — when it was true, when it was learned — so any retrieval can be
                  replayed, audited, and graded against reality.
                </p>
                <div className="flex flex-wrap gap-2">
                  {STACK.map((s) => (
                    <span
                      key={s}
                      className="font-mono text-[10px] text-muted border border-border rounded-sm px-2 py-1"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-3">
                read path — returns enriched
              </p>
              <div className="bg-surface border border-border rounded-md px-4 py-3.5">
                <p className="font-display text-[17px] text-text">recall</p>
                <p className="font-mono text-[10.5px] text-clay mt-0.5 mb-1.5">POST /v1/recall_and_enrich</p>
                <p className="text-[12.5px] leading-snug text-muted">
                  The right memory for this moment, already enriched and ranked.
                </p>
              </div>
              <div className="bg-surface border border-border rounded-md px-4 py-3.5">
                <p className="font-display text-[17px] text-text">enrich</p>
                <p className="font-mono text-[10.5px] text-clay mt-0.5 mb-1.5">Trestle · Twilio Lookup</p>
                <p className="text-[12.5px] leading-snug text-muted">
                  A caller resolved into real context before the agent ever speaks.
                </p>
              </div>
              <p className="font-mono text-[10.5px] leading-loose text-muted-3 mt-0.5">
                Only shipped endpoints are listed. Anything still in development stays off this page until it
                deploys.
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-5">
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-3 mb-4">
              Counted in the repository · main · 2026-09-03
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-sm overflow-hidden">
              {REPO_COUNTS.map((c) => (
                <div key={c.note} className="bg-bg px-4 py-3.5">
                  <p className={`font-mono ${c.clay ? "text-[12.5px] text-clay" : "text-[17px] text-text"}`}>
                    {c.value}
                  </p>
                  <p className="font-mono text-[10px] tracking-wide text-muted-3 mt-1">{c.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Case study ── */}
        <section className="max-w-content mx-auto px-6 md:px-10 pb-24">
          <p className={EYEBROW}>/// Case study — content pipeline</p>
          <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-wide text-text-soft bg-bg-2 border border-border rounded-sm px-2.5 py-1 mb-[18px]">
            <span aria-hidden className="w-[5px] h-[5px] rounded-full border border-muted flex-none" />
            Design complete · four independent reviews · build in progress
          </span>
          <h2 className={`${H2} max-w-[24ch] mb-6`}>
            The hard part of a content pipeline is not the writing.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
            <p className="text-[17px] leading-relaxed text-muted text-pretty">
              An event-driven pipeline that turns merged engineering work into published writing: extract the
              evidence from a merge, draft against a claims policy, review on a different provider, publish,
              measure, and feed the result back to whoever writes next.
            </p>
            <div className="flex flex-col gap-[18px]">
              <p className="text-[17px] leading-relaxed text-muted text-pretty">
                Generation is the easy half. The hard half is that publishing is an{" "}
                <em className="italic text-text-soft">outward</em> action, so every stage needs a lease, a
                receipt, an idempotency key, a kill switch, and a named human gate — and none of that can live
                in the prompt.
              </p>
              <p className="text-[17px] leading-relaxed text-text-soft text-pretty">
                The specification went through four independent adversarial reviews before a line of it was
                built. The third one found that a piece could be corrected after approval while its
                already-scheduled derivatives kept the old version queued to fire. That is a defect you find
                on paper, or you find in public.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
