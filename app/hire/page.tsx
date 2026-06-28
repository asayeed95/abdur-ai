import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hire me",
  description: "Abdur Rahman Sayeed — AI-native builder targeting Applied AI Engineer / Forward Deployed Engineer / AI Systems Architect roles at frontier labs.",
};

export default function HirePage() {
  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-24">
        <p className="eyebrow mb-4">/// HIRE</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-6 max-w-[18ch]">
          Looking for the person who turns model potential into shipped systems?
        </h1>
        <p className="text-muted text-xl leading-relaxed max-w-[640px] mb-12">
          That&apos;s the job I do alone at 2am. I&apos;d rather do it with your team.
        </p>

        <div className="max-w-prose space-y-6 text-text-soft text-lg leading-relaxed">
          <h2 className="font-display text-3xl text-text pt-2">Roles I&apos;m targeting</h2>
          <ul className="space-y-2 list-disc list-outside ml-6">
            <li>Applied AI Engineer</li>
            <li>Forward Deployed Engineer</li>
            <li>AI Systems Architect / AI Systems Design</li>
          </ul>
          <p>At <strong className="text-text">OpenAI or Anthropic</strong> specifically — though I&apos;ll talk to any team working at the frontier of applied AI.</p>

          <h2 className="font-display text-3xl text-text pt-6">What I bring</h2>
          <ul className="space-y-3 list-disc list-outside ml-6">
            <li>Systems and user outcomes, not model metrics.</li>
            <li>Debugging messy, real-world failures and turning them into improvements.</li>
            <li>The applied layer — end to end.</li>
            <li>AI-native by default. Models write a lot of my code. I own every decision and can defend all of them.</li>
            <li>Move fast and measure. Real costs, real latencies, shipped.</li>
          </ul>

          <h2 className="font-display text-3xl text-text pt-6">Proof, not adjectives</h2>
          <ul className="space-y-3 list-disc list-outside ml-6">
            <li><strong className="text-text">Mnemix</strong> — contextual intelligence orchestration. Caller memory in under 300ms on the warm path.</li>
            <li><strong className="text-text">heycli</strong> — multi-agent orchestrator pushing prompts to Claude Code, Codex, and Aider from one source-of-truth.</li>
            <li><strong className="text-text">dockerfile.ai, Retention Lab, memory primitives</strong> — small, runnable tools, each solving one real problem.</li>
            <li><strong className="text-text">Public builder logs</strong> — I write up how these systems work and where they break.</li>
          </ul>

          <h2 className="font-display text-3xl text-text pt-6">On credentials</h2>
          <p>
            No CS degree — I dropped out. I bet on shipped systems and the
            ability to explain every decision in them over a line on a résumé.
            If you want to test that, the fastest way is to{" "}
            <strong className="text-text">ask me about any decision in the work above and then ask me to change it.</strong>{" "}
            That&apos;s the whole interview, and it&apos;s the conversation I want.
          </p>

          <h2 className="font-display text-3xl text-text pt-6">Reach out</h2>
          <p>The fastest way in is a direct message. I respond to everything.</p>
        </div>

        <div className="flex flex-wrap gap-3 mt-10">
          <a
            href={`mailto:${SITE.email}`}
            className="font-mono text-xs tracking-widest uppercase text-bg bg-clay px-4 py-3 rounded-sm hover:opacity-90 transition-opacity"
          >
            Email me →
          </a>
          <a
            href={SITE.handles.linkedin}
            className="font-mono text-xs tracking-widest uppercase text-text border border-border hover:border-clay px-4 py-3 rounded-sm transition-colors"
          >
            LinkedIn →
          </a>
          <a
            href={SITE.handles.github}
            className="font-mono text-xs tracking-widest uppercase text-text border border-border hover:border-clay px-4 py-3 rounded-sm transition-colors"
          >
            GitHub →
          </a>
        </div>

        <p className="mt-12 font-mono text-sm text-muted max-w-prose leading-relaxed">
          Want a tailored walkthrough for a specific role? Send me the JD and
          I&apos;ll record a 5-minute video showing how my work maps to it.
        </p>
      </main>
      <Footer />
    </>
  );
}
