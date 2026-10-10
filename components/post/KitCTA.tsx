"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { KIT_PATH } from "@/lib/kit";

/**
 * In-post CTA for the Agent Reliability Kit (AGE-2391). Available in every
 * post's MDX as `<KitCTA />` (registered in PostArticle next to the other
 * CTAs); not placed in any published post by default. It links to /kit, where
 * the signup lives, so a post never carries a second signup form.
 */
export function KitCTA() {
  return (
    <aside className="not-prose my-12 bg-band border border-border rounded-lg p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-clay mb-3">
        /// Free: the Agent Reliability Kit
      </p>
      <p className="text-text-soft text-lg leading-relaxed mb-5">
        The verification checklist with its commands, a durable-memory starter
        and a blank postmortem template, as files you can download and use.
      </p>
      <Link
        href={KIT_PATH}
        onClick={() => trackEvent("cta:kit:from-post")}
        className="inline-block font-mono text-xs tracking-widest uppercase text-bg bg-clay px-4 py-3 rounded-sm hover:opacity-90 transition-opacity"
      >
        Get the kit →
      </Link>
    </aside>
  );
}
