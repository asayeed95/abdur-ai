import type { Metadata } from "next";
import Link from "next/link";
import { PROJECTS, type ProjectStatus } from "../projects-data";

export const metadata: Metadata = {
  title: "Poppy candidate project notes",
  description: "Status-aware project notes for Abdur Rahman Sayeed's Poppy AI candidate brief.",
  alternates: { canonical: "/poppy/projects" },
  robots: { index: false, follow: true },
};

function StatusPill({ status, tone }: { status: string; tone: ProjectStatus }) {
  const classes: Record<ProjectStatus, string> = {
    live: "border-emerald-700/30 bg-emerald-50 text-emerald-950",
    progress: "border-amber-700/30 bg-amber-50 text-amber-950",
    source: "border-cyan-700/30 bg-cyan-50 text-cyan-950",
    internal: "border-slate-500/30 bg-slate-100 text-slate-700",
    parked: "border-stone-500/30 bg-stone-100 text-stone-700",
  };

  return <span className={`inline-flex rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${classes[tone]}`}>{status}</span>;
}

export default function PoppyProjectNotesPage() {
  return (
    <main className="min-h-screen bg-[#f4eddf] px-6 py-16 text-[#123e3d] md:px-10 md:py-24">
      <div className="mx-auto max-w-content">
        <Link href="/poppy#projects" className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#176f70] underline decoration-[#176f70]/50 underline-offset-4">
          ← Back to candidate brief
        </Link>
        <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-[#176f70]">/// Project notes</p>
        <h1 className="mt-5 max-w-[16ch] font-display text-[42px] leading-[0.98] tracking-tight md:text-[64px]">Where to explore the work—without pretending it is all public.</h1>
        <p className="mt-7 max-w-[62ch] text-[16px] leading-relaxed text-[#435653]">These notes extend the Poppy candidate brief. Every project keeps its current status; an external link appears only when this update verified a useful public destination.</p>

        <div className="mt-14 grid gap-5">
          {PROJECTS.map((project) => (
            <article id={project.slug} key={project.slug} className="scroll-mt-8 rounded-md border border-[#176f70]/20 bg-[#fffdf8] p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill status={project.status} tone={project.tone} />
                {project.detail && <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#596965]">{project.detail}</span>}
              </div>
              <h2 className="mt-5 font-display text-[31px] leading-none tracking-tight">{project.name}</h2>
              <p className="mt-5 max-w-[72ch] text-[15px] leading-relaxed text-[#435653]">{project.explainer}</p>
              {project.links && (
                <div className="mt-5 flex flex-wrap gap-4">
                  {project.links.map((link) => (
                    <a key={link.label} href={link.href} className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#176f70] underline decoration-[#176f70]/50 underline-offset-4">
                      {link.label} {link.external ? "↗" : "→"}
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
