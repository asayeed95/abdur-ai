import Link from "next/link";
import { Reveal } from "./Reveal";

type Primitive = {
  name: string;
  role: string;
  status: string;
  desc: string;
};

const PRIMITIVES: Primitive[] = [
  { name: "recall", role: "POST /v1/recall_and_enrich", status: "primitive", desc: "Pull the right memory for this moment, already enriched and ranked." },
  { name: "enrich", role: "Trestle · Twilio Lookup", status: "primitive", desc: "Resolve a caller into real context before the agent ever speaks." },
  { name: "observe", role: "durable intake", status: "primitive", desc: "Stream events in through a throttled, durable, replayable write path." },
  { name: "gate", role: "gate-first, router-second", status: "primitive", desc: "Every write clears six safety signals before it is allowed to land." },
  { name: "evidence", role: "GET /v1/evidence/:ref", status: "primitive", desc: "Bi-temporal, replayable proof sitting behind every decision." },
  { name: "beacon", role: "POST /v1/beacon/inject", status: "primitive", desc: "The memory layer surfaces what matters to the agent, unprompted." },
];

export function MnemixSection() {
  return (
    <Reveal
      as="section"
      id="projects"
      className="border-y border-border bg-bg-2"
    >
      <div className="max-w-content mx-auto px-6 md:px-10 py-24 md:py-32">
        <p className="eyebrow mb-4">/// FLAGSHIP</p>
        <h2
          className="font-display text-text tracking-tight mb-16"
          style={{
            fontSize: "clamp(36px, 5.5vw, 68px)",
            lineHeight: "1.04",
            letterSpacing: "-0.02em",
            maxWidth: "14ch",
          }}
        >
          Mnemix is the memory layer that makes any AI agent self-driving.
        </h2>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 mb-16">
          <div className="space-y-5 text-text-soft text-lg leading-relaxed">
            <p>
              Most stacks treat memory as a vector store you bolt on and pray
              over. Mnemix treats it as governance: a gate-first, router-second
              layer where every write clears safety before it is allowed to
              land, and every read comes back already enriched.
            </p>
            <p>
              At the core is <span className="text-text font-semibold">BEAD</span> —
              bi-temporal, evidence-anchored decisions. Every fact an agent acts
              on carries two clocks, when it was true and when it was learned,
              so a retrieval can be replayed, audited, and graded against
              reality instead of vibes.
            </p>
            <p>
              It is the spine under everything I build — and it is designed for
              sub-300ms voice recall, because the place memory breaks first is a
              live conversation.
            </p>
          </div>
          <div className="space-y-5 text-text-soft text-lg leading-relaxed">
            <p>
              <span className="text-text font-semibold">Six primitives</span>{" "}
              compose the whole surface — recall, enrich, observe, gate,
              evidence, and beacon. Small enough to reason about, sharp enough
              that an agent stops guessing and starts knowing.
            </p>
            <p>
              <span className="text-text font-semibold">Beacon</span> is the
              newest — it flips memory from reactive to proactive. Instead of
              waiting to be queried, the layer surfaces the salient thing to the
              agent before the model knows to ask for it.
            </p>
            <p>
              The public API stays deliberately small and frozen. Hobby is free;
              everything past it is a conversation, not a pricing table —
              because the teams that need this are building voice, and voice is
              unforgiving.
            </p>
          </div>
        </div>

        <blockquote className="font-display italic text-3xl md:text-4xl text-clay text-center max-w-3xl mx-auto my-16">
          &ldquo;Choose Mnemix if you&apos;re building voice.&rdquo;
        </blockquote>

        <div className="text-center mb-20">
          <Link
            href="https://mnemix.ai"
            className="inline-block font-mono text-xs tracking-widest uppercase text-text border border-border hover:text-clay hover:border-clay px-5 py-3 rounded-sm transition-colors"
          >
            Read the full thesis →
          </Link>
        </div>

        <p className="eyebrow mb-8">/// THE PRIMITIVES</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRIMITIVES.map((p) => (
            <div
              key={p.name}
              className="bg-surface border border-border rounded-lg p-5 hover:border-clay hover:-translate-y-1 transition-all"
            >
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-display text-xl text-text">{p.name}</h3>
                <span className="font-mono text-[10px] tracking-wider uppercase text-muted-3">
                  {p.status}
                </span>
              </div>
              <div className="font-mono text-xs text-clay mb-3">{p.role}</div>
              <p className="text-sm text-muted leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
