"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

export function Subscribe() {
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
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscribe failed");
      setStatus("ok");
      setMsg("You're on the list. I'll only email when something ships or breaks.");
      setEmail("");
    } catch (err) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something broke. Try again.");
    }
  }

  return (
    <Reveal
      as="section"
      id="subscribe"
      className="border-t border-border bg-bg-2"
    >
      <div className="max-w-content mx-auto px-6 md:px-10 py-24 md:py-32">
        <p className="eyebrow mb-4">/// SUBSCRIBE</p>
        <h2 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-5 max-w-3xl">
          Get the TLDR in your inbox.
        </h2>
        <p className="text-muted text-lg leading-relaxed max-w-[640px] mb-10">
          One email when I ship something or learn something the hard way. No
          drip campaigns, no growth hacks — just the logbook.
        </p>

        <form
          onSubmit={onSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-xl"
        >
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
            disabled={status === "loading" || status === "ok"}
            className="font-mono text-xs tracking-widest uppercase text-bg bg-clay px-5 py-3 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {status === "loading" ? "Sending…" : status === "ok" ? "Subscribed" : "Subscribe →"}
          </button>
        </form>

        {msg && (
          <p
            className={`mt-4 font-mono text-xs ${
              status === "ok" ? "text-good" : status === "err" ? "text-clay" : "text-muted"
            }`}
          >
            {msg}
          </p>
        )}
      </div>
    </Reveal>
  );
}
