import Link from "next/link";
import { Reveal } from "./Reveal";
import { OPEN_TO_ROLES, SITE } from "@/lib/site";

export function About() {
  return (
    <Reveal
      as="section"
      id="about"
      className="relative max-w-content mx-auto px-6 md:px-10 py-24 md:py-32 overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-0 font-display text-[260px] md:text-[420px] leading-none text-clay/[0.06] select-none"
      >
        AS
      </div>

      <div className="relative">
        <h2 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-10">
          Who is this person?
        </h2>

        <div className="space-y-5 text-text-soft text-lg leading-relaxed max-w-[68ch]">
          <p>
            I&apos;m Abdur — a solo founder in the NYC metro (West New York, NJ),
            running a portfolio of vertical AI products like a compressed team:
            one human on strategy and sign-off, a set of high-agency AI agents
            on execution, research, and ops.
          </p>
          <p>
            I care about memory, evaluation, and the unglamorous plumbing that
            makes AI actually reliable. Most of what I build starts as a problem
            in my own stack, then graduates into a tool other builders can run.
          </p>
          <p>
            This site is that work in public — the wins, the $300 weekends, and
            the postmortems I&apos;d rather not write but always learn the most
            from.
          </p>
        </div>

        {OPEN_TO_ROLES && (
          <div className="mt-10 border-l-2 border-clay pl-6 max-w-[68ch]">
            <p className="eyebrow mb-3">/// CURRENTLY</p>
            <p className="text-text-soft text-lg leading-relaxed">
              Open to Applied AI and forward-deployed engineering roles — the
              kind where memory, evaluation, and agent reliability decide
              whether the thing actually works. Building Mnemix in the open in
              the meantime; if that&apos;s your team&apos;s problem space,
              let&apos;s talk.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a
                href="/resume.pdf"
                className="font-mono text-xs tracking-widest uppercase text-bg bg-clay px-4 py-3 rounded-sm hover:opacity-90 transition-opacity"
              >
                Résumé →
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="font-mono text-xs tracking-widest uppercase text-text border border-border hover:border-clay px-4 py-3 rounded-sm transition-colors"
              >
                Email me →
              </a>
              <a
                href={SITE.handles.github}
                className="font-mono text-xs tracking-widest uppercase text-text border border-border hover:border-clay px-4 py-3 rounded-sm transition-colors"
              >
                GitHub →
              </a>
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/about"
            className="font-mono text-xs tracking-widest uppercase text-muted hover:text-clay transition-colors border-b border-transparent hover:border-clay pb-1"
          >
            More on /whoami →
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
