"use client";

import { useState } from "react";

/**
 * Northsun waitlist capture. Posts to the real, pre-existing
 * /api/subscribe route using the frozen "mnemix-beta" list id
 * (RESEND_AUDIENCE_MNEMIX) — the product waitlist audience. Lives on the
 * homepage at /#waitlist so product CTAs point at an owned surface
 * instead of an external domain.
 */
export function NorthsunWaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("err");
      setMsg("That doesn't look like an email.");
      return;
    }
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, list: "mnemix-beta" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscribe failed");
      setStatus("ok");
      setMsg("✓ On the list. Logbook now, Northsun when it opens.");
      setEmail("");
    } catch (err) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something broke. Try again.");
    }
  }

  return (
    <div id="waitlist" className="max-w-xl mx-auto">
      {status === "ok" ? (
        <p className="font-mono text-sm text-good text-center">{msg}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-surface border border-border text-text px-4 py-3 rounded-sm font-mono text-sm placeholder:text-muted-3 focus:border-clay focus:outline-none transition-colors"
            disabled={status === "loading"}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="font-mono text-xs tracking-widest uppercase text-text border border-border hover:text-clay hover:border-clay px-5 py-3 rounded-sm transition-colors disabled:opacity-40"
          >
            {status === "loading" ? "Sending…" : "Join the Northsun waitlist"}
          </button>
        </form>
      )}
      {status === "err" && msg && (
        <p className="mt-3 font-mono text-xs text-clay text-center">{msg}</p>
      )}
    </div>
  );
}
