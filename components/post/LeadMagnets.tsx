"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { buildSubscribeFields } from "@/lib/attribution";

/**
 * In-post CTAs. Each is a self-contained block that can be embedded
 * inside an MDX file with `<MnemixCTA />`, `<AsecWaitlistCTA />`, etc.
 *
 * Each CTA fires an analytics event on click — wire to Plausible/Vercel
 * Analytics in lib/analytics.ts.
 */

function track(name: string) {
  if (typeof window !== "undefined") {
    // @ts-expect-error -- plausible global
    window.plausible?.(name);
    // @ts-expect-error -- vercel analytics
    window.va?.("event", { name });
  }
}

export function MnemixCTA({ heading = "The work behind this" }: { heading?: string }) {
  return (
    <aside className="not-prose my-12 bg-surface border-l-4 border-clay rounded-r-lg p-6 md:p-8">
      <p className="font-mono text-[10px] tracking-widest uppercase text-clay mb-3">
        /// {heading}
      </p>
      <p className="text-text-soft text-lg leading-relaxed mb-3">
        <strong className="text-text">Mnemix is the memory and enrichment layer for AI agents.</strong>{" "}
        The work around MOLL asks the same questions
        this post does: what should an agent carry forward, when must it be
        governed, and how can a builder understand the result?
      </p>
      <p className="text-muted leading-relaxed mb-5">
        If you build with agents, this is an invitation to follow the work and
        help sharpen the questions behind it — not a promise that the product
        is ready for every use case today.
      </p>
      <a
        href="https://mnemix.ai/#waitlist"
        onClick={() => track("cta:mnemix:from-post")}
        className="inline-block font-mono text-xs tracking-widest uppercase text-bg bg-clay px-4 py-3 rounded-sm hover:opacity-90 transition-opacity"
      >
        Join Mnemix private beta →
      </a>
    </aside>
  );
}

export function AsecWaitlistCTA() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [renderedAt] = useState(() => Date.now());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email.includes("@")) {
      setErr("That doesn't look like an email.");
      return;
    }
    track("cta:asec:from-post");
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, list: "asec-waitlist", ...buildSubscribeFields(pathname ?? "/"), rendered_at: renderedAt, company: "" }),
      });
      setDone(true);
    } catch {
      setErr("Something broke. Try again.");
    }
  }

  return (
    <aside className="not-prose my-12 bg-bg-2 border border-border rounded-lg p-6 md:p-8">
      <p className="font-mono text-[10px] tracking-widest uppercase text-muted mb-3">
        /// COMING — ASEC
      </p>
      <p className="text-text-soft text-lg leading-relaxed mb-3">
        Abdur.ai is one property under <strong className="text-text">ASEC</strong>,
        the studio I run. Soon, ASEC will open a community surface — a place
        where builders post their own postmortems, demo their work, and get
        cited for it the way researchers cite papers.
      </p>
      <p className="text-muted leading-relaxed mb-5">
        If you write postmortems like this one, you&apos;ll have a profile
        waiting for you when ASEC opens.
      </p>
      {done ? (
        <p className="font-mono text-sm text-good">
          ✓ On the list. I&apos;ll email when ASEC opens.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-bg border border-border text-text px-4 py-3 rounded-sm font-mono text-sm placeholder:text-muted-3 focus:border-clay focus:outline-none"
          />
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px" }}
          />
          <input type="hidden" name="rendered_at" value={renderedAt} />
          <button
            type="submit"
            className="font-mono text-xs tracking-widest uppercase text-text border border-border hover:border-clay px-4 py-3 rounded-sm"
          >
            Join the ASEC waitlist →
          </button>
        </form>
      )}
      {err && <p className="font-mono text-xs text-clay mt-3">{err}</p>}
      <p className="font-mono text-[10px] text-muted-3 mt-4">
        No spam. One email when ASEC opens, one if I publish anything as
        important as this post.
      </p>
    </aside>
  );
}

export function NewsletterCTA() {
  return (
    <aside className="not-prose my-12 border-t border-clay pt-8">
      <p className="font-mono text-[10px] tracking-widest uppercase text-clay mb-3">
        /// GET THE NEXT POSTMORTEM
      </p>
      <p className="text-text-soft text-lg leading-relaxed mb-4">
        I write one of these every few weeks. Real incidents. Real receipts.
        Named patterns.
      </p>
      <Link
        href="#subscribe"
        onClick={() => track("cta:newsletter:from-post")}
        className="inline-block font-mono text-xs tracking-widest uppercase text-bg bg-clay px-4 py-3 rounded-sm hover:opacity-90 transition-opacity"
      >
        Subscribe →
      </Link>
    </aside>
  );
}
