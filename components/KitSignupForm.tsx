"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { trackEvent, attributionProps } from "@/lib/analytics";
import { buildSubscribeFields } from "@/lib/attribution";
import { KIT_PATH } from "@/lib/kit";
import { KitDownloads } from "./KitDownloads";

/**
 * Signup for the Agent Reliability Kit (AGE-2391). Subscribes to the existing
 * `tldr` list through /api/subscribe, same contract as components/Subscribe.tsx:
 * honeypot, render timestamp, attribution via buildSubscribeFields().
 *
 * - JS on: JSON POST; on a 2xx the form is replaced by the download links.
 * - JS off: the native form posts urlencoded with `return_to=/kit`, which the
 *   route answers with a 303 to /kit/thanks (links) or /kit?error=<kind>.
 *   The hidden `source_path` keeps kit signups distinguishable on that path.
 */
export function KitSignupForm() {
  const pathname = usePathname();
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [renderedAt] = useState(() => Date.now());

  useEffect(() => {
    trackEvent("kit:view", attributionProps());
  }, []);

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
          list: "tldr",
          ...buildSubscribeFields(pathname ?? KIT_PATH),
          rendered_at: renderedAt,
          company: honeypot instanceof HTMLInputElement ? honeypot.value : "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something broke. Try again.");
      const props = attributionProps();
      trackEvent("subscribe:tldr", props);
      trackEvent("kit:signup", props);
      setStatus("ok");
      setEmail("");
    } catch (err) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something broke. Try again.");
    }
  }

  if (status === "ok") {
    return (
      <div>
        <p role="status" className="font-mono text-sm text-good-text mb-6">
          You&apos;re on the list. The kit is yours:
        </p>
        <KitDownloads />
      </div>
    );
  }

  return (
    <div>
      {/* action/method make this a native urlencoded POST when JS doesn't run;
          onSubmit preventDefaults and takes over otherwise. */}
      <form
        action="/api/subscribe"
        method="post"
        onSubmit={onSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-xl"
      >
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          placeholder="you@domain.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
          className="flex-1 bg-surface border border-muted text-text px-4 py-3 rounded-sm font-mono text-sm placeholder:text-meta focus:border-clay focus:outline-none transition-colors"
        />
        <input type="hidden" name="list" value="tldr" />
        <input type="hidden" name="return_to" value={KIT_PATH} />
        <input type="hidden" name="source_path" value={KIT_PATH} />
        {/* Honeypot + render timestamp for bot filtering. Visually hidden with
            inline off-screen positioning only. */}
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
          disabled={status === "loading"}
          className="font-mono text-xs tracking-widest uppercase text-bg bg-clay px-5 py-3 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {status === "loading" ? "Sending…" : "Get the kit"}
        </button>
      </form>
      {msg && <p className="mt-4 font-mono text-xs text-clay">{msg}</p>}
    </div>
  );
}
