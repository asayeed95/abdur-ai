"use client";

import Link from "next/link";
import { useState } from "react";

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

export function MnemixCTA({ heading = "What MOLL is part of" }: { heading?: string }) {
  return (
    <aside className="not-prose my-12 bg-surface border-l-4 border-clay rounded-r-lg p-6 md:p-8">
      <p className="font-mono text-[10px] tracking-widest uppercase text-clay mb-3">
        /// {heading}
      </p>
      <p className="text-text-soft text-lg leading-relaxed mb-3">
        MOLL is one layer of <strong className="text-text">Mnemix</strong> — the
        contextual intelligence platform that absorbs incidents like this one
        and turns them into doctrine other agents can use. Bi-temporal,
        evidence-anchored decisions. Memory that grades itself.
      </p>
      <p className="text-muted leading-relaxed mb-5">
        If you build with agents and have ever shipped a doctrine that failed
        in the same way this one did — you&apos;re the person Mnemix is for.
      </p>
      <a
        href="https://mnemix.ai"
        onClick={() => track("cta:mnemix:from-post")}
        className="inline-block font-mono text-xs tracking-widest uppercase text-bg bg-clay px-4 py-3 rounded-sm hover:opacity-90 transition-opacity"
      >
        Mnemix is in private beta. Request access. →
      </a>
    </aside>
  );
}

export function AsecWaitlistCTA() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

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
        body: JSON.stringify({ email, list: "asec-waitlist" }),
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
