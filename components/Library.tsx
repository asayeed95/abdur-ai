import { Reveal } from "./Reveal";

type Product = {
  kind: string;
  name: string;
  price: string;
  cta: string;
  desc: string;
  href: string;
};

const PRODUCTS: Product[] = [
  {
    kind: "SaaS · self-serve",
    name: "Dockerfile.ai",
    price: "From $9/mo",
    cta: "Start free",
    desc: "Generate a production Dockerfile that's verified in a sandbox before you ship it. Free tier, then $9–$49 a month.",
    href: "https://dockerfile.ai",
  },
  {
    kind: "Notion template · one-time",
    name: "Board & Investor Reporting OS",
    price: "$179",
    cta: "Get it",
    desc: "Founder-grade investor and board reporting in Notion. $179 once, versus the $129/mo SaaS you'd otherwise rent.",
    href: "/library/board-os",
  },
  {
    kind: "Voice · early access",
    name: "Cuéntame",
    price: "$19.99/mo",
    cta: "Join waitlist",
    desc: "The Spanish tutor that calls you. Reserve a spot before outbound sessions open to the public.",
    href: "/tools/cuentame",
  },
];

export function Library() {
  return (
    <Reveal
      as="section"
      id="library"
      className="max-w-content mx-auto px-6 md:px-10 py-24 md:py-32"
    >
      <p className="eyebrow mb-4">/// FOR SALE</p>
      <h2 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-3">
        Things you can buy today.
      </h2>
      <p className="text-muted text-lg max-w-[640px] mb-12">
        Self-serve products with real prices. Mnemix itself is invite-only —
        everything here you can start right now.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {PRODUCTS.map((p) => (
          <div
            key={p.name}
            className="flex flex-col bg-surface border border-border rounded-lg p-6 hover:border-clay hover:-translate-y-1.5 transition-all"
          >
            <div className="flex-1">
              <div className="font-mono text-[10px] tracking-wider uppercase text-muted-2 mb-3">
                {p.kind}
              </div>
              <h3 className="font-display text-2xl text-text mb-3">{p.name}</h3>
              <p className="text-sm text-muted leading-relaxed">{p.desc}</p>
            </div>
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <span className="font-mono text-sm text-text">{p.price}</span>
              <a
                href={p.href}
                className="font-mono text-[11px] tracking-widest uppercase text-text border border-border hover:bg-clay hover:text-bg hover:border-clay px-3 py-2 rounded-sm transition-colors"
              >
                {p.cta} →
              </a>
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
