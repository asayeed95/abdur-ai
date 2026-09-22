import type { Metadata } from "next";
import Link from "next/link";
import { absoluteOgUrl, buildOgPath, shareCard } from "@/lib/og";
import { SITE } from "@/lib/site";

const description =
  "A Poppy AI candidate brief from Abdur Rahman Sayeed: agent systems, evidence, and an honest project portfolio.";

const poppyImageUrl = absoluteOgUrl(
  buildOgPath({
    title: "Poppy candidate brief",
    excerpt: "Agent systems, evidence, and an honest portfolio.",
    path: "abdur.ai/poppy",
    tag: "CANDIDATE BRIEF",
  }),
);

const poppyShare = shareCard({
  title: "Poppy candidate brief",
  description,
  url: `${SITE.url}/poppy`,
  type: "website",
  image: {
    url: poppyImageUrl,
    secureUrl: poppyImageUrl,
    type: "image/png",
    width: 1200,
    height: 630,
    alt: "abdur.ai/poppy — an independent Poppy AI candidate brief for Abdur Rahman Sayeed.",
  },
});

export const metadata: Metadata = {
  title: "Poppy candidate brief",
  description,
  alternates: { canonical: `${SITE.url}/poppy` },
  openGraph: { ...poppyShare.openGraph, siteName: SITE.brand },
  twitter: poppyShare.twitter,
};

type ProjectStatus = "live" | "progress" | "source" | "internal" | "parked";

const PROJECTS: Array<{
  name: string;
  status: string;
  tone: ProjectStatus;
  detail?: string;
  body: string;
  poppy: string;
  links?: Array<{ label: string; href: string; external?: boolean }>;
}> = [
  {
    name: "Northsun",
    status: "In progress",
    tone: "progress",
    detail: "AI product · #1 priority",
    body: "My main AI product. An applied-AI system with retrieval and memory plumbing; Mnemix is its free diagnostic tool for users (the mnemix-engine package — Mnemix is the tool, not the product).",
    poppy: "The closest thing to their stack — AI harnesses, context/retrieval/memory, product UX over complex AI.",
    links: [{ label: "GitHub", href: "https://github.com/asayeed95/mnemix", external: true }],
  },
  {
    name: "HeyCLI",
    status: "In progress",
    tone: "progress",
    body: "An AI CLI harness — the agent lives where the developer already works.",
    poppy: "A harness around an agent, not a chat box around a model. Same design instinct Poppy needs: meet the user in their workflow.",
    links: [{ label: "GitHub", href: "https://github.com/asayeed95/remotecli", external: true }],
  },
  {
    name: "abdur.ai",
    status: "Live",
    tone: "live",
    body: "My personal site and portfolio, including the hire page this brief is adapted from.",
    poppy: "The UI craft on display — and this very page is the proof of it.",
    links: [
      { label: "abdur.ai", href: "https://abdur.ai", external: true },
      { label: "Full portfolio", href: "/hire" },
    ],
  },
  {
    name: "BrowseFlow",
    status: "Open source",
    tone: "source",
    detail: "free for users",
    body: "Agent-agnostic browser automation with accessibility-tree perception, a CDP-first hybrid engine, approval queues, and a run journal.",
    poppy: "A design posture for agentic work: explicit approval points and an inspectable journal when a person needs to understand or redirect a run.",
  },
  {
    name: "Relay",
    status: "Internal — not public",
    tone: "internal",
    body: "Internal infrastructure under One Asec — not a public product, and presented as exactly that.",
    poppy: "Evidence of systems thinking: the unglamorous plumbing that keeps products running.",
  },
  {
    name: "Dockerfile.ai",
    status: "In progress",
    tone: "progress",
    body: "An AI tool around Dockerfiles — applied AI on a concrete developer workflow.",
    poppy: "Applied AI with a tight feedback loop: one workflow, done well, judged by output quality.",
  },
  {
    name: "Halo",
    status: "Parked concept",
    tone: "parked",
    body: "A concept on the shelf — kept honest as a concept, not dressed up as a launch.",
    poppy: "I scope honestly. Parked means parked.",
  },
  {
    name: "Baylio",
    status: "Parked concept",
    tone: "parked",
    detail: "early prototype exists",
    body: "AI call-assistant SaaS concept for auto repair shops (ElevenLabs + Twilio + Claude + Stripe) — a repo exists and work started, but it is parked, not launched.",
    poppy: "Voice AI + integrations (telephony, payments) — the connector/integration muscle the role asks for.",
  },
];

const WHY = [
  {
    title: "Agentic systems are my main surface",
    body: "The Poppy posting says the next version is the harness: understand the goal, pull together the right context, use the right tools, get the work done. That’s the layer I’ve been building since September 2025 — agent-agnostic browser automation (BrowseFlow), a CLI agent harness (HeyCLI), retrieval and memory plumbing in Northsun. The work goes beyond a model API: it includes the surrounding system and its operator-facing evidence.",
  },
  {
    title: "Cost, speed, and reliability are product features",
    body: "In an agentic creative tool, model choice, caching, voice-fidelity evaluation, and observable failures are product decisions. I focus on the operating boundary around the model: what the system did, what it could not do, and where a person should decide next.",
  },
  {
    title: "One Asec delivery experience",
    body: "At One Asec LLC, I work across business systems, IT delivery, and applied-AI product development. That includes finance/reporting, CRM and invoicing, marketing-support workflows, IT systems, and process design, alongside product strategy, UX, architecture, implementation, and operator-facing proof for AI-native products. I prefer direct operating evidence: clear scope, status labels, and a record of what is actually built.",
  },
];

const HYPOTHESES = [
  {
    title: "From goal to campaign, one harness",
    body: "I’d make this the first ambitious but bounded build: a harness over the existing Find → Understand → Create spine. A creator sets the campaign goal; the harness uses the board plus its Vault, Creator Profile, and selected Brand context, finds any missing inputs, then drives a visible creation plan. The goal is to reduce the remaining setup and orchestration burden between research and a campaign-ready draft, with explicit creator approval at the moments that matter.",
  },
  {
    title: "Brand fidelity as an eval, not a vibe",
    body: "I’d add a visible quality layer around Poppy’s existing Brands: compare each draft against the selected Brand and creator reference, score the result, and use the outcome to route work between an efficient draft model and a stronger finishing model. That creates a focused path toward better creative fidelity and clearer model-economics decisions as the product learns.",
  },
  {
    title: "Context becomes campaign momentum",
    body: "I’d use Poppy’s existing Vault, Creator Profiles, and Brand context as the starting point for an agent that can resume campaign planning: carry forward the goal, creative constraints, rejected directions, and the next best question when a creator returns. The ambition is a harness that makes the existing context more actionable over time instead of making the creator reconstruct it from scratch.",
  },
];

const PAGE_STYLE = `
.poppy-root {
  --poppy-paper: #f4eddf;
  --poppy-ink: #123e3d;
  --poppy-teal: #176f70;
  --poppy-dark: #102827;
  --poppy-faded: #6d7470;
  background: var(--poppy-paper);
  color: var(--poppy-ink);
}
.poppy-root .poppy-nav { background: rgba(244,237,223,.94); border-color: rgba(18,62,61,.14); }
.poppy-root .poppy-nav a { color: var(--poppy-ink); }
.poppy-root .poppy-nav a:hover { color: var(--poppy-teal); }
.poppy-root .poppy-footer { background: var(--poppy-dark); }
.poppy-root .poppy-footer * { color: #e6eee9; }
.poppy-root .poppy-hero { background: radial-gradient(circle at 80% 22%, rgba(62,143,137,.38), transparent 31%), linear-gradient(125deg, #071c1b 0%, #123e3d 51%, #174d4c 100%); }
.poppy-root .poppy-rule { background: linear-gradient(90deg, transparent, rgba(23,111,112,.6), transparent); }
.poppy-root .poppy-card { background: rgba(255,253,247,.74); border-color: rgba(18,62,61,.16); box-shadow: 0 18px 38px -32px rgba(10,40,39,.8); }
.poppy-root .poppy-project { background: #143e3d; border-color: rgba(231,241,236,.18); box-shadow: 0 20px 40px -30px rgba(5,25,24,.9); }
.poppy-root .poppy-project a { color: #bceae0; }
.poppy-root .poppy-project a:hover { color: white; }
.poppy-root .poppy-project-muted { background: rgba(255,253,247,.46); border-color: rgba(23,111,112,.34); }
.poppy-root .poppy-project-muted a { color: #176f70; }
.poppy-root .poppy-project-muted a:hover { color: #0f4747; }
.poppy-root .poppy-hypothesis { background: #fffdf8; border-color: rgba(23,111,112,.2); }
@media (prefers-reduced-motion: reduce) {
  .poppy-root * { transition: none !important; }
}
`;

function StatusPill({ status, tone }: { status: string; tone: ProjectStatus }) {
  const classes: Record<ProjectStatus, string> = {
    live: "border-[#5bb499]/70 bg-[#5bb499]/15 text-[#d9f0e8]",
    progress: "border-[#e0b14a]/70 bg-[#e0b14a]/15 text-[#fff0bd]",
    source: "border-[#80cfc1]/70 bg-[#80cfc1]/15 text-[#d9f7f1]",
    internal: "border-[#176f70]/35 bg-[#176f70]/[0.08] text-[#315856]",
    parked: "border-[#69706b]/40 bg-[#69706b]/[0.08] text-[#505b56]",
  };

  return <span className={`inline-flex rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${classes[tone]}`}>{status}</span>;
}

export default function PoppyPage() {
  return (
    <div className="poppy-root min-h-screen font-body">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div className="poppy-nav fixed inset-x-0 top-0 z-50 border-b">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between gap-4 px-6 md:px-10">
          <Link href="/" className="font-display text-lg tracking-tight">
            abdur.ai
          </Link>
          <span className="hidden rounded-full border border-[#176f70]/30 px-3 py-1 text-center font-mono text-[9px] uppercase tracking-[0.11em] text-[#176f70] sm:block">
            Independent candidate brief — not affiliated with Poppy AI
          </span>
          <Link href="/hire" className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#176f70]">
            Full portfolio →
          </Link>
        </div>
      </div>

      <main>
        <section className="poppy-hero pb-16 pt-32 text-[#f4eddf] md:pb-24 md:pt-40">
          <div className="mx-auto max-w-content px-6 md:px-10">
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a7ded4]">
              Candidate brief / Poppy AI / AI Engineer — founder-level
            </p>
            <h1 className="max-w-[15ch] font-display text-[46px] font-semibold leading-[0.96] tracking-tight md:text-[76px]">
              I build the harness between an agent&apos;s plan and a creator&apos;s finished campaign.
            </h1>
            <p className="mt-8 max-w-[58ch] text-[17px] leading-relaxed text-[#d2e4df] md:text-[19px]">
              I build the operating layer that turns an agent&apos;s plan into decisive creative progress: tool calling, model routing, retrieval, and human judgment with clear scope, status labels, and evidence behind the work.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#projects" className="rounded-sm bg-[#d5eee5] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#123e3d] transition-colors hover:bg-white">
                Explore the evidence ↓
              </a>
              <Link href="/hire" className="rounded-sm border border-[#b7dfd4]/50 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#f4eddf] transition-colors hover:border-white hover:bg-white/10">
                View full portfolio
              </Link>
            </div>
            <p className="mt-14 font-mono text-[10px] uppercase tracking-[0.17em] text-[#a7ded4]">
              Prospect Park, NJ · AI products · candidate brief
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-content px-6 py-20 md:px-10 md:py-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#176f70]">/// Why this role</p>
          <h2 className="mt-5 max-w-[17ch] font-display text-[36px] leading-[1.03] tracking-tight text-[#123e3d] md:text-[52px]">
            The system around the model is where the work gets real.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {WHY.map((item) => (
              <article key={item.title} className="poppy-card rounded-md border p-6">
                <h3 className="font-display text-[25px] leading-tight text-[#123e3d]">{item.title}</h3>
                <p className="mt-4 text-[14px] leading-relaxed text-[#435653]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="poppy-rule mx-auto h-px max-w-content" />

        <section id="projects" className="mx-auto max-w-content px-6 py-20 md:px-10 md:py-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#176f70]">/// What I&apos;ve built and am building</p>
          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <h2 className="max-w-[16ch] font-display text-[36px] leading-[1.03] tracking-tight text-[#123e3d] md:text-[52px]">Eight projects, one honest status system.</h2>
            <p className="max-w-[39ch] text-[15px] leading-relaxed text-[#526460]">Honest labels. No theater. Each card says exactly where the project stands.</p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {PROJECTS.map((project) => {
              const mutedCard = project.tone === "internal" || project.tone === "parked";
              return (
              <article key={project.name} className={`${mutedCard ? "poppy-project-muted" : "poppy-project"} rounded-md border p-6 ${mutedCard ? "text-[#123e3d]" : "text-[#e8f0ec]"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill status={project.status} tone={project.tone} />
                  {project.detail && <p className={`font-mono text-[10px] uppercase tracking-[0.1em] ${mutedCard ? "text-[#596965]" : "text-[#b2c6c0]"}`}>{project.detail}</p>}
                </div>
                <h3 className="mt-5 font-display text-[31px] leading-none tracking-tight">{project.name}</h3>
                <p className={`mt-5 text-[14px] leading-relaxed ${mutedCard ? "text-[#435653]" : "text-[#d2e0db]"}`}>{project.body}</p>
                <p className={`mt-4 border-l pl-3 text-[13px] leading-relaxed ${mutedCard ? "border-[#176f70]/45 text-[#315856]" : "border-[#76c0b4]/55 text-[#b9dcd4]"}`}><span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${mutedCard ? "text-[#176f70]" : "text-[#8bcdbf]"}`}>For Poppy: </span>{project.poppy}</p>
                {project.links && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {project.links?.map((link) => (
                      <a key={link.label} href={link.href} className="font-mono text-[10px] uppercase tracking-[0.12em] underline decoration-[#6aac9f]/70 underline-offset-4">
                        {link.label} {link.external ? "↗" : "→"}
                      </a>
                    ))}
                  </div>
                )}
              </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-[#176f70]/15 bg-[#e9e1d1] py-20 md:py-28">
          <div className="mx-auto max-w-content px-6 md:px-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#176f70]">/// What I would start with, if hired</p>
            <div className="mt-5">
              <h2 className="max-w-[17ch] font-display text-[36px] leading-[1.03] tracking-tight text-[#123e3d] md:text-[52px]">Three hypotheses to test with the team.</h2>
            </div>
            <p className="mt-6 max-w-[62ch] text-[14px] leading-relaxed text-[#435653]">These are candidate hypotheses, not commitments or insider knowledge. They describe the product work I would propose to test with the team.</p>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {HYPOTHESES.map((item, index) => (
                <article key={item.title} className="poppy-hypothesis relative overflow-hidden rounded-md border border-dashed p-6">
                  <span className="absolute inset-x-0 top-0 h-1 bg-[#176f70]" aria-hidden />
                  <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#176f70]">Hypothesis 0{index + 1}</p>
                  <h3 className="mt-5 font-display text-[25px] leading-tight text-[#123e3d]">{item.title}</h3>
                  <p className="mt-4 text-[14px] leading-relaxed text-[#435653]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="evidence" className="mx-auto max-w-content px-6 py-20 md:px-10 md:py-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#176f70]">/// Evidence</p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <a href="https://github.com/asayeed95" className="poppy-card rounded-md border p-6 transition-colors hover:border-[#176f70]/70">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#176f70]">GitHub</p>
              <p className="mt-4 font-display text-[24px] text-[#123e3d]">github.com/asayeed95 ↗</p>
              <p className="mt-2 text-sm leading-relaxed text-[#526460]">The repositories behind the project cards above.</p>
            </a>
            <Link href="/hire" className="poppy-card rounded-md border p-6 transition-colors hover:border-[#176f70]/70">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#176f70]">Full portfolio</p>
              <p className="mt-4 font-display text-[24px] text-[#123e3d]">Open full portfolio →</p>
              <p className="mt-2 text-sm leading-relaxed text-[#526460]">The broader recruiter-facing portfolio and résumé surface.</p>
            </Link>
            <div className="border-l-2 border-[#176f70] pl-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#176f70]">Walkthrough · 2–3 min</p>
              <p className="mt-4 font-display text-[24px] text-[#123e3d]">Walkthrough available with application materials</p>
              <p className="mt-2 text-sm leading-relaxed text-[#526460]">A short screen-share can walk through this page and the evidence behind it.</p>
            </div>
          </div>
          <div className="mt-16 max-w-[68ch] border-l-2 border-[#176f70] pl-5">
            <p className="font-display text-[23px] leading-snug text-[#123e3d]">Abdur Rahman Sayeed — solo founder, One Asec LLC (NJ). Degree in Financial Mathematics & Economics, University of Ottawa (no CS degree). ~6 years building/operating systems with code; ~1 year of focused AI-product engineering since Sep 2025.</p>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-[#596965]">Stack: TypeScript, Node.js, Python, SQL, React/Next.js, WebSockets, API integration.</p>
          </div>
        </section>
      </main>

      <footer className="poppy-footer py-10">
        <div className="mx-auto flex max-w-content flex-col justify-between gap-4 px-6 md:flex-row md:items-center md:px-10">
          <p className="font-display text-xl">Independent candidate brief — not affiliated with Poppy AI.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em]">Built as a curated companion to the AI Engineer application. abdur.ai</p>
        </div>
      </footer>
    </div>
  );
}
