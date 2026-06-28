import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "/now",
  description: "What Abdur is shipping this week. Updated weekly.",
};

export default function NowPage() {
  const updated = "June 27, 2026";
  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-24">
        <p className="eyebrow mb-4">/// /NOW</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight text-text mb-4">
          /now
        </h1>
        <p className="font-mono text-sm text-muted mb-16">Last updated · {updated}</p>

        <div className="max-w-prose space-y-8 text-text-soft text-lg leading-relaxed">
          <section>
            <h2 className="font-display text-3xl text-text mb-4">This week</h2>
            <p>
              <strong className="text-text">Cross-video pattern detection in Retention Lab.</strong> Building the thing YouTube&apos;s native analytics won&apos;t: grouping retention curves across an entire channel instead of staring at them one video at a time.
            </p>
            <p className="mt-4"><strong className="text-text">Also in flight:</strong></p>
            <ul className="list-disc list-outside ml-6 space-y-2 mt-2">
              <li>Tightening the Mnemix warm path — caller memory is under 300ms on the edge; chasing the cold-path number next.</li>
              <li>heycli: reducing idle cost on the orchestrator after I found it burning ~$14/day doing nothing.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-3xl text-text mb-4">What&apos;s next</h2>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>Eval harness for Retention Lab&apos;s clustering — a real metric on &ldquo;did we surface the right pattern,&rdquo; not vibes.</li>
              <li>Writing up the BEAD model (bi-temporal, evidence-anchored decisions) as a public post.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-3xl text-text mb-4">Recently shipped</h2>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>The flagship postmortem: <em>The night the doctrine failed.</em> Four patterns committed to MOLL.</li>
              <li>Sub-300ms caller memory on the Mnemix warm path (Cloudflare edge → Upstash Redis).</li>
              <li>heycli pushing prompts to Claude Code, Codex, and Aider from one source-of-truth.</li>
            </ul>
          </section>

          <p className="text-muted pt-8 border-t border-border">
            This is a <a href="https://nownownow.com/about" className="text-clay">now page</a> — a snapshot of what has my focus right now, not a résumé. If it&apos;s stale, ping me and tell me to update it.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
