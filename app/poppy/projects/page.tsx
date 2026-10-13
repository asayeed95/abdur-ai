import type { Metadata } from "next";
import Link from "next/link";
import { absoluteOgUrl, buildOgPath, shareCard } from "@/lib/og";
import { SITE } from "@/lib/site";
import { PROJECTS, type ProjectStatus } from "../projects-data";

const title = "Poppy candidate project notes";
const description = "Status-aware project notes for Abdur Rahman Sayeed's Poppy AI candidate brief.";

const notesImageUrl = absoluteOgUrl(
  buildOgPath({
    title,
    excerpt: "Where each project stands today.",
    path: "abdur.ai/poppy/projects",
    tag: "CANDIDATE BRIEF",
  }),
);

const notesShare = shareCard({
  title,
  description,
  url: `${SITE.url}/poppy/projects`,
  type: "website",
  image: {
    url: notesImageUrl,
    secureUrl: notesImageUrl,
    type: "image/png",
    width: 1200,
    height: 630,
    alt: "abdur.ai/poppy/projects — project notes for an independent Poppy AI candidate brief.",
  },
});

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE.url}/poppy/projects` },
  robots: { index: false, follow: true },
  openGraph: { ...notesShare.openGraph, siteName: SITE.brand },
  twitter: notesShare.twitter,
};

/** Light-card variants of the /poppy route palette (the brief's pills sit on dark cards). */
function StatusPill({ status, tone }: { status: string; tone: ProjectStatus }) {
  const classes: Record<ProjectStatus, string> = {
    live: "border-[#176f70]/45 bg-[#176f70]/10 text-[#123e3d]",
    progress: "border-[#b8862b]/55 bg-[#e0b14a]/15 text-[#5a4210]",
    internal: "border-[#176f70]/35 bg-[#176f70]/[0.08] text-[#315856]",
    parked: "border-[#69706b]/40 bg-[#69706b]/[0.08] text-[#505b56]",
  };

  return <span className={`inline-flex rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${classes[tone]}`}>{status}</span>;
}

const LINK_CLASS = "font-mono text-[10px] uppercase tracking-[0.12em] text-[#176f70] underline decoration-[#176f70]/50 underline-offset-4";

export default function PoppyProjectNotesPage() {
  return (
    <main className="min-h-screen bg-[#f4eddf] px-6 py-16 text-[#123e3d] md:px-10 md:py-24">
      <div className="mx-auto max-w-content">
        <Link href="/poppy#projects" className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#176f70] underline decoration-[#176f70]/50 underline-offset-4">
          <span aria-hidden>← </span>Back to candidate brief
        </Link>
        <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-[#176f70]">/// Project notes</p>
        <h1 className="mt-5 max-w-[16ch] font-display text-[42px] leading-[0.98] tracking-tight md:text-[64px]">Where each project stands today.</h1>
        <p className="mt-7 max-w-[62ch] text-[16px] leading-relaxed text-[#435653]">These notes extend the Poppy candidate brief with each project&apos;s current status and scope. External links appear only where a public destination exists.</p>

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
                  {project.links.map((link) =>
                    link.external ? (
                      <a key={link.label} href={link.href} className={LINK_CLASS}>
                        {link.label} <span aria-hidden>↗</span>
                      </a>
                    ) : (
                      <Link key={link.label} href={link.href} className={LINK_CLASS}>
                        {link.label} <span aria-hidden>→</span>
                      </Link>
                    ),
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
