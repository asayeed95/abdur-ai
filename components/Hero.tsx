import Link from "next/link";
import { SITE } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative max-w-content mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-24 md:pb-32"
    >
      {/* Faint monogram in the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-20 right-6 md:right-10 font-display text-[120px] md:text-[200px] leading-none text-clay/[0.06] select-none"
      >
        AS
      </div>

      <p className="eyebrow mb-8">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-clay animate-pulse-clay mr-2 -translate-y-px align-middle" />
        Solo AI founder · West New York, NJ · NYC metro
      </p>

      <h1
        className="font-display font-extrabold tracking-tighter text-text animate-hero-in"
        style={{
          fontSize: "clamp(48px, 8.5vw, 116px)",
          lineHeight: "0.96",
          letterSpacing: "-0.02em",
        }}
      >
        I ship AI things
        <br />
        and write the TLDR.
        <span
          className="font-display italic font-medium text-muted-2 whitespace-nowrap"
          style={{ fontSize: "0.3em", marginLeft: "0.45em", letterSpacing: "-0.01em" }}
        >
          shipped at 2am.
        </span>
      </h1>

      <div className="w-[60px] h-[2px] bg-clay mt-8 mb-6" />

      <p className="text-lg md:text-[18px] leading-relaxed text-muted max-w-[560px]">
        {SITE.description}
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/aitldr/the-night-the-doctrine-failed"
          className="font-mono text-xs tracking-widest uppercase text-bg bg-clay px-4 py-3 rounded-sm hover:opacity-90 transition-opacity"
        >
          Read the flagship postmortem →
        </Link>
        <Link
          href="#latest"
          className="font-mono text-xs tracking-widest uppercase text-text border border-border hover:border-clay px-4 py-3 rounded-sm transition-colors"
        >
          The logbook ↓
        </Link>
      </div>
    </section>
  );
}
