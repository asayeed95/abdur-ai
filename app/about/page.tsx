import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "/whoami",
  description: "Abdur Rahman Sayeed — AI-native builder from NJ/NY. No degree, no team, production AI systems. The story, the stack, and what I'm aiming at.",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-24">
        <p className="eyebrow mb-4">/// /whoami</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight text-text mb-12">
          Who is this person?
        </h1>

        <div className="max-w-prose space-y-6 text-text-soft text-lg leading-relaxed">
          <p>
            I&apos;m Abdur Rahman Sayeed. I build production AI systems by
            myself, from {SITE.location}, and I write down exactly how they
            work.
          </p>
          <p>
            No computer science degree. I dropped out. I&apos;m not going to
            bury that on this page or dress it up — it&apos;s load-bearing to
            the story. What I have instead is a list of things I&apos;ve
            shipped and the ability to explain every decision in them. I
            decided a while ago that I&apos;d rather be the person who can
            defend their architecture in a live conversation than the person
            with the right line on a résumé who freezes when you ask &ldquo;why.&rdquo;
          </p>

          <h2 className="font-display text-3xl text-text pt-6">What I build</h2>
          <p>
            Everything I make sits under <strong className="text-text">Mnemix</strong> — a
            contextual intelligence orchestration platform. Memory, RAG, and{" "}
            <strong className="text-text">BEAD</strong>: bi-temporal,
            evidence-anchored decisions, so a system can answer not just
            &ldquo;what&apos;s true&rdquo; but &ldquo;what did we know, and
            when.&rdquo;
          </p>
          <ul className="space-y-2 list-disc list-outside ml-6">
            <li><strong className="text-text">heycli</strong> — multi-agent orchestrator that holds source-of-truth and pushes prompts to Claude Code, Codex, and Aider.</li>
            <li><strong className="text-text">retention-lab</strong> — cohort retention analytics for AI products.</li>
            <li><strong className="text-text">dockerfile.ai</strong> — an AI-native Dockerfile generator.</li>
            <li><strong className="text-text">memory primitives</strong> — ingestion, retrieval, memory, auto-push.</li>
          </ul>

          <h2 className="font-display text-3xl text-text pt-6">How I actually work</h2>
          <p>
            AI-native, end to end. The models write a lot of the code; I own
            the architecture, the evals, the debugging, and the calls about
            what&apos;s worth building. I work across Claude Code, Codex, and
            custom agents, coordinated through my own orchestrator. I ship
            fast, I measure real costs and real latencies, and I write up the
            failures publicly because the failures are where the useful
            information is.
          </p>
          <p>
            I&apos;m self-deprecating about what breaks and confident about
            taste. Those aren&apos;t in tension — knowing what&apos;s broken is
            how you develop the taste.
          </p>

          <h2 className="font-display text-3xl text-text pt-6">What I&apos;m aiming at</h2>
          <p>
            I want to be an{" "}
            <strong className="text-text">Applied AI Engineer, Forward Deployed Engineer, or AI Systems Architect</strong>{" "}
            at a frontier lab — OpenAI or Anthropic specifically. I think in
            systems and user outcomes, not model metrics. I want to work in the
            layer that turns research and model potential into systems that
            actually work for people. That&apos;s already what I do alone at
            2am; I&apos;d rather do it with a team pointed at the frontier.
          </p>
        </div>

        <div className="mt-16 max-w-prose">
          <Link
            href="/hire"
            className="inline-block font-mono text-xs tracking-widest uppercase text-bg bg-clay px-4 py-3 rounded-sm hover:opacity-90 transition-opacity"
          >
            Hire me →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
