import { Reveal } from "./Reveal";
import { NorthsunWaitlistForm } from "./NorthsunWaitlistForm";

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
      className="border-y border-border bg-band"
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
              The public API stays deliberately small and frozen. Hobby is free;
              everything past it is a conversation, not a pricing table —
              because the teams that need this are building voice, and voice is
              unforgiving.
            </p>
          </div>
        </div>

        <blockquote className="font-display italic text-3xl md:text-4xl text-clay text-center max-w-3xl mx-auto my-16">
          &ldquo;Choose Northsun as your agent memory layer.&rdquo;
        </blockquote>

        <p className="text-meta text-lg leading-relaxed max-w-[640px] mx-auto text-center mb-10">
          Now you get the logbook &mdash; when I learn it the hard way, the
          TLDR the same week. Later, Northsun, when it opens. Not before.
        </p>

        <div className="mb-20">
          <NorthsunWaitlistForm />
        </div>
      </div>
    </Reveal>
  );
}
