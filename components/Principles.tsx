import { Reveal } from "./Reveal";

const PRINCIPLES = [
  { n: "01", title: "Verify before you report", body: "No result gets claimed without the command output in the same breath. If I can't show it ran, it didn't happen." },
  { n: "02", title: "Revenue and proof first", body: "Every ship carries a way to capture demand and a way to get paid. A technical win with no distribution doesn't count." },
  { n: "03", title: "One founder, an agent team", body: "Strategy and sign-off stay human. Research, code, and ops run as high-agency agents handing off through files." },
  { n: "04", title: "Memory over context", body: "A bigger window isn't a better memory. Retrieval that knows what to ignore beats a model drowning in everything." },
  { n: "05", title: "Grade against reality", body: "Every fact carries two clocks — when it was true, when it was learned — so decisions can be replayed and audited." },
  { n: "06", title: "Corrections over overwrites", body: "Beliefs get deprecated, not silently rewritten. The system evolves on a paper trail, not a vibe." },
];

export function Principles() {
  return (
    <Reveal as="section" id="principles" className="border-y border-border bg-bg-2">
      <div className="max-w-content mx-auto px-6 md:px-10 py-24 md:py-28">
        <p className="eyebrow mb-4">/// HOW I WORK</p>
        <h2 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-16">
          Operating principles
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {PRINCIPLES.map((p) => (
            <div key={p.n}>
              <div className="font-mono text-xs tracking-widest text-clay mb-3">
                {p.n}
              </div>
              <h3 className="font-display text-xl text-text mb-3 tracking-tight">
                {p.title}
              </h3>
              <p className="text-base text-muted leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
