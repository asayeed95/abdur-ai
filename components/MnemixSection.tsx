import { Reveal } from "./Reveal";
import { NorthsunWaitlistForm } from "./NorthsunWaitlistForm";

type Primitive = {
  name: string;
  role: string;
  status: string;
  desc: string;
};

const PERSPECTIVES: Primitive[] = [
  {
    name: "identity",
    role: "memory + enrichment",
    status: "category",
    desc: "The memory and enrichment layer for AI agents.",
  },
  {
    name: "governance",
    role: "AI proposes. Mnemix governs.",
    status: "differentiator",
    desc: "The public thesis for governed context intelligence.",
  },
  {
    name: "voice",
    role: "design target",
    status: "wedge",
    desc: "Designed for sub-300ms voice recall.",
  },
];

/**
 * Flagship product section. Renders Northsun (the commercial platform).
 * The component name is a legacy technical identifier kept for import
 * stability; see content/brand/brand-map.json.
 */
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
          Northsun is the memory and enrichment layer for AI agents.
        </h2>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 mb-16">
          <div className="space-y-5 text-text-soft text-lg leading-relaxed">
            <p>
              Most stacks treat memory as a vector store you bolt on and pray
              over. Northsun treats it as governance: a gate-first, router-second
              layer where every write clears safety before it is allowed to
              land, and every read comes back already enriched.
            </p>
            <p>
              <span className="text-text font-semibold">AI proposes. Mnemix governs.</span>{" "}
              The point is not to make an agent sound more certain; it is to
              make its context more deliberate.
            </p>
            <p>
              Voice is an important wedge.
              Mnemix is designed for sub-300ms voice recall, because a live
              conversation is where bad context is impossible to hide.
            </p>
          </div>
          <div className="space-y-5 text-text-soft text-lg leading-relaxed">
            <p>
              The public work here is deliberately evidence-bound: honest build
              notes, useful analysis, and product thinking that remains useful
              even when nobody clicks through.
            </p>
            <p>
              That gives the work a real feedback loop. Questions, objections,
              and edge cases from people building agents should improve both the
              public explanation and the product decisions behind it.
            </p>
            <p>
              Hobby is $0. Paid tiers start with contact sales. The beta is the
              right invitation only when the live access path is real.
            </p>
          </div>
        </div>

        <blockquote className="font-display italic text-3xl md:text-4xl text-clay text-center max-w-3xl mx-auto my-16">
          &ldquo;Choose Northsun as your agent memory layer.&rdquo;
        </blockquote>

        <p className="text-muted text-lg leading-relaxed max-w-[640px] mx-auto text-center mb-10">
          Now you get the logbook &mdash; when I learn it the hard way, the
          TLDR the same week. Later, Northsun, when it opens. Not before.
        </p>

        <div className="mb-20">
          <NorthsunWaitlistForm />
        </div>

        <p className="eyebrow mb-8">/// THE POSITION</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSPECTIVES.map((p) => (
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
