"use client";

import { useId, useState } from "react";
import { usePathname } from "next/navigation";
import { trackEvent, attributionProps } from "@/lib/analytics";
import { buildSubscribeFields } from "@/lib/attribution";

/**
 * End-of-article signup. Rendered by PostArticle for every post whose MDX does
 * not already embed `<NewsletterCTA />`, so a reader who finishes any article
 * has a signup form in reach without editing nine published posts' copy.
 *
 * Same contract as components/Subscribe.tsx: JSON POST to /api/subscribe, a
 * honeypot, a render timestamp, and a native-form fallback (action/method) that
 * the API answers with a redirect to /subscribe.
 */
export function PostSubscribe() {
  const pathname = usePathname();
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [renderedAt] = useState(() => Date.now());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("err");
      setMsg("That doesn't look like an email.");
      return;
    }
    const honeypot = e.currentTarget.elements.namedItem("company");
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...buildSubscribeFields(pathname ?? "/"),
          rendered_at: renderedAt,
          company: honeypot instanceof HTMLInputElement ? honeypot.value : "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not subscribe right now.");
      trackEvent("subscribe:tldr", attributionProps());
      setStatus("ok");
      setMsg("You're on the list.");
      setEmail("");
    } catch (err) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something broke. Try again.");
    }
  }

  return (
    <aside
      data-signup="post-end"
      aria-labelledby={`${inputId}-heading`}
      className="not-prose max-w-prose mx-auto mt-16 border-t border-clay pt-8"
    >
      <p id={`${inputId}-heading`} className="font-mono text-[10px] tracking-widest uppercase text-clay mb-3">
        /// THE LOGBOOK
      </p>
      <p className="text-text-soft text-lg leading-relaxed mb-5">
        When I learn something the hard way, you get the write-up. Receipts
        included, no product tour.
      </p>
      <form action="/api/subscribe" method="post" onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
          className="flex-1 bg-surface border border-muted text-text px-4 py-3 rounded-sm font-mono text-sm placeholder:text-meta focus:border-clay focus:outline-none transition-colors"
        />
        {/* Honeypot + render timestamp, same off-screen technique as the main form. */}
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
          disabled={status === "loading" || status === "ok"}
          aria-busy={status === "loading"}
          className="font-mono text-xs tracking-widest uppercase text-bg bg-clay px-5 py-3 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {status === "loading" ? "Sending…" : status === "ok" ? "Subscribed" : "Subscribe"}
        </button>
      </form>
      <p
        role="status"
        aria-live="polite"
        className={`mt-4 font-mono text-xs min-h-[1rem] ${
          status === "ok" ? "text-good-text" : status === "err" ? "text-clay" : "text-meta"
        }`}
      >
        {msg}
      </p>
    </aside>
  );
}
