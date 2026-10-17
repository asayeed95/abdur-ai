"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { buildSubscribeFields } from "@/lib/attribution";

type Newsletter = "added" | "existing" | "skipped" | "failed";

/** What the reader is told after a successful request, per list outcome. */
const AFTER: Record<Newsletter, string> = {
  added: "Sent. Check your inbox. You’re on the logbook too.",
  existing: "Sent. Check your inbox. This address was already on file for the logbook, so nothing changed there.",
  skipped: "Sent. Check your inbox.",
  failed: "Sent. Check your inbox. The logbook signup didn’t go through; you can join from the subscribe page.",
};

/**
 * Request form for a free library asset (AGE-3762). Same contract as the
 * signup forms: JSON POST with a honeypot and a render timestamp, and a native
 * form fallback that /api/library answers with a redirect back to this page.
 *
 * The logbook box is unchecked and separate: the asset is sent either way,
 * and only a tick adds the reader to the TLDR list.
 */
export function AssetRequestForm({ assetId, cta }: { assetId: string; cta: string }) {
  const pathname = usePathname();
  const inputId = useId();
  const boxId = useId();
  const [email, setEmail] = useState("");
  const [logbook, setLogbook] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [newsletter, setNewsletter] = useState<Newsletter>("skipped");
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
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          asset_id: assetId,
          newsletter: logbook,
          ...buildSubscribeFields(pathname ?? "/"),
          rendered_at: renderedAt,
          company: honeypot instanceof HTMLInputElement ? honeypot.value : "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; newsletter?: Newsletter };
      if (!res.ok) throw new Error(data.error || "Could not send it right now.");
      trackEvent("library:request", { asset: assetId, logbook: logbook ? "yes" : "no" });
      const outcome = data.newsletter && data.newsletter in AFTER ? data.newsletter : "skipped";
      setNewsletter(outcome);
      setStatus("ok");
      setMsg(AFTER[outcome]);
    } catch (err) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something broke. Try again.");
    }
  }

  return (
    <div data-library-request={assetId}>
      <form action="/api/library" method="post" onSubmit={onSubmit} className="flex flex-col gap-4 max-w-xl">
        <input type="hidden" name="asset_id" value={assetId} />
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
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
          <button
            type="submit"
            disabled={status === "loading" || status === "ok"}
            className="font-mono text-xs tracking-widest uppercase text-bg bg-clay px-5 py-3 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {status === "loading" ? "Sending…" : status === "ok" ? "Sent" : cta}
          </button>
        </div>
        <div className="flex items-start gap-3">
          <input
            id={boxId}
            type="checkbox"
            name="newsletter"
            checked={logbook}
            onChange={(e) => setLogbook(e.target.checked)}
            disabled={status === "loading" || status === "ok"}
            className="mt-1 accent-clay"
          />
          <label htmlFor={boxId} className="text-sm text-meta leading-relaxed">
            Also send me Abdur&apos;s engineering logbook: one email when a new TLDR ships. Optional; you get it
            either way.
          </label>
        </div>
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px" }}
        />
        <input type="hidden" name="rendered_at" value={renderedAt} />
      </form>
      <p
        role="status"
        className={`mt-4 font-mono text-xs min-h-[1rem] ${
          status === "ok" ? "text-good-text" : status === "err" ? "text-clay" : "text-meta"
        }`}
      >
        {msg}
        {status === "ok" && newsletter === "failed" && (
          <>
            {" "}
            <Link href="/subscribe" className="underline">
              Subscribe page
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
