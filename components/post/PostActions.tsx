"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Agent & share bar under every post header.
 *
 * Both copy actions read the published markdown twin (`/writing/<slug>.md`),
 * so what lands on the clipboard is byte-for-byte what an agent fetching the
 * twin would get — one serializer (lib/legibility.ts), no second copy of the
 * body shipped in the page payload.
 *
 * Clipboard writes must happen inside the click's user activation. The twin
 * is prefetched on hover/focus so the common path is a synchronous
 * writeText; when it is not cached yet, a ClipboardItem backed by the fetch
 * promise keeps the write inside the activation (Safari requires this).
 */

type Props = {
  slug: string;
  title: string;
  canonical: string;
  markdownUrl: string;
  embedUrl: string;
  /** Header prepended for "Copy for agent" — built server-side from post meta. */
  agentPreamble: string;
};

type Copied = "agent" | "markdown" | "link" | "embed" | null;

export function PostActions({ slug, title, canonical, markdownUrl, embedUrl, agentPreamble }: Props) {
  const [copied, setCopied] = useState<Copied>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const twin = useRef<string | null>(null);
  const pending = useRef<Promise<string> | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const embedTrigger = useRef<HTMLButtonElement>(null);
  const embedField = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const embedSnippet = `<iframe src="${embedUrl}" title="${title.replace(/"/g, "&quot;")} — abdur.ai" width="100%" height="230" style="border:0;max-width:640px" loading="lazy"></iframe>`;

  const loadTwin = useCallback((): Promise<string> => {
    if (twin.current !== null) return Promise.resolve(twin.current);
    if (!pending.current) {
      pending.current = fetch(markdownUrl, { headers: { Accept: "text/markdown" } })
        .then((r) => {
          if (!r.ok) throw new Error(`markdown twin ${r.status}`);
          return r.text();
        })
        .then((text) => {
          twin.current = text;
          return text;
        })
        .catch((err) => {
          pending.current = null; // allow a retry on the next click
          throw err;
        });
    }
    return pending.current;
  }, [markdownUrl]);

  const BLOCKED = "Copy blocked by the browser — use .md instead";

  const flash = (what: Exclude<Copied, null>) => {
    setNotice(null);
    setCopied(what);
  };

  useEffect(() => {
    if (!copied && !notice) return;
    const t = setTimeout(() => {
      setCopied(null);
      setNotice(null);
    }, 2500);
    return () => clearTimeout(t);
  }, [copied, notice]);

  /** Copy text that may still be loading. Never reports success it did not get. */
  const copyAsync = async (build: (md: string) => string, what: "agent" | "markdown") => {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      if (twin.current !== null) {
        await navigator.clipboard.writeText(build(twin.current));
      } else if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        const blob = loadTwin().then((md) => new Blob([build(md)], { type: "text/plain" }));
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      } else {
        // No ClipboardItem: a write after awaiting the fetch can fall outside
        // the click's user activation and be refused. Load now; the next click
        // hits the cached path above.
        loadTwin().catch(() => undefined);
        setCopied(null);
        setNotice("Loading — click again to copy");
        return;
      }
      flash(what);
      trackEvent(what === "agent" ? "post:copy-agent" : "post:copy-markdown", { slug });
    } catch {
      setCopied(null);
      setNotice(BLOCKED);
    }
  };

  const copyText = async (text: string, what: "link" | "embed") => {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      flash(what);
      trackEvent(what === "embed" ? "post:embed-copy" : "post:share", {
        slug,
        ...(what === "link" ? { channel: "copy-link" } : {}),
      });
    } catch {
      setNotice(BLOCKED);
      if (what === "embed") embedField.current?.select(); // let the reader copy by hand
    }
  };

  // Share menu: close on outside click or Escape.
  useEffect(() => {
    if (!shareOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!shareRef.current?.contains(e.target as Node)) setShareOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShareOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

  // Embed modal: Escape closes, body does not scroll, focus moves in and back.
  useEffect(() => {
    if (!embedOpen) return;
    const trigger = embedTrigger.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setEmbedOpen(false);
      if (e.key !== "Tab" || !dialogRef.current) return;
      // aria-modal promises focus stays inside: wrap Tab / Shift+Tab.
      const items = dialogRef.current.querySelectorAll<HTMLElement>("button, a[href], textarea, [tabindex]:not([tabindex='-1'])");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => embedField.current?.select(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
      // After React removes the dialog, or the focus move is lost.
      requestAnimationFrame(() => trigger?.focus());
    };
  }, [embedOpen]);

  const enc = encodeURIComponent;
  const shareTargets = [
    { channel: "x", label: "X", href: `https://x.com/intent/post?text=${enc(title)}&url=${enc(canonical)}` },
    { channel: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(canonical)}` },
    { channel: "hn", label: "Hacker News", href: `https://news.ycombinator.com/submitlink?u=${enc(canonical)}&t=${enc(title)}` },
    { channel: "reddit", label: "Reddit", href: `https://www.reddit.com/submit?url=${enc(canonical)}&title=${enc(title)}` },
  ];

  const btn =
    "font-mono text-[11px] tracking-widest uppercase px-3 py-2 rounded-sm border border-border text-meta hover:text-text hover:border-clay transition-colors cursor-pointer whitespace-nowrap";
  const label = (what: Exclude<Copied, null>, idle: string) => (copied === what ? "Copied ✓" : idle);
  const prefetch = () => {
    loadTwin().catch(() => undefined);
  };

  return (
    <div className="max-w-prose mx-auto mt-8" onPointerEnter={prefetch} onFocusCapture={prefetch}>
      <div role="group" aria-label="Use this post" className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${btn} text-clay border-clay/60`}
          onClick={() => copyAsync((md) => `${agentPreamble}\n\n${md}`, "agent")}
          title="Copies the full post with source, register and citation instructions for Claude, ChatGPT or Perplexity"
        >
          {label("agent", "Copy for agent")}
        </button>
        <button type="button" className={btn} onClick={() => copyAsync((md) => md, "markdown")}>
          {label("markdown", "Copy markdown")}
        </button>
        <a className={btn} href={markdownUrl} rel="alternate" type="text/markdown">
          .md
        </a>

        <div className="relative" ref={shareRef}>
          <button
            type="button"
            className={btn}
            aria-expanded={shareOpen}
            aria-haspopup="true"
            onClick={() => setShareOpen((v) => !v)}
          >
            {label("link", "Share")}
          </button>
          {shareOpen && (
            <ul className="absolute left-0 top-full mt-2 z-20 min-w-[180px] bg-surface border border-border rounded-sm py-1 shadow-lg">
              {shareTargets.map((t) => (
                <li key={t.channel}>
                  <a
                    href={t.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 font-mono text-xs text-meta hover:text-text hover:bg-bg"
                    onClick={() => {
                      trackEvent("post:share", { slug, channel: t.channel });
                      setShareOpen(false);
                    }}
                  >
                    {t.label} ↗
                  </a>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 font-mono text-xs text-meta hover:text-text hover:bg-bg cursor-pointer"
                  onClick={() => {
                    copyText(canonical, "link");
                    setShareOpen(false);
                  }}
                >
                  Copy link
                </button>
              </li>
            </ul>
          )}
        </div>

        <button
          type="button"
          ref={embedTrigger}
          className={btn}
          aria-haspopup="dialog"
          onClick={() => setEmbedOpen(true)}
        >
          Embed
        </button>

        <span aria-live="polite" className="font-mono text-[11px] text-meta">
          {notice ?? ""}
        </span>
      </div>

      {embedOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-4"
          onMouseDown={(e) => e.target === e.currentTarget && setEmbedOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`embed-title-${slug}`}
            className="w-full max-w-xl bg-surface border border-border rounded-lg p-5 md:p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 id={`embed-title-${slug}`} className="font-display text-xl text-text">
                Embed this post
              </h2>
              <button
                type="button"
                onClick={() => setEmbedOpen(false)}
                className="font-mono text-xs text-meta hover:text-text cursor-pointer"
                aria-label="Close"
              >
                Esc ✕
              </button>
            </div>
            <p className="text-sm text-meta mb-3">
              A small card with the title, summary and a link back to the full post.
            </p>
            <textarea
              ref={embedField}
              readOnly
              value={embedSnippet}
              rows={4}
              className="w-full font-mono text-xs text-text bg-bg border border-muted rounded-sm p-3 resize-none"
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                type="button"
                className="font-mono text-xs tracking-widest uppercase text-bg bg-clay px-4 py-2.5 rounded-sm hover:opacity-90 cursor-pointer"
                onClick={() => copyText(embedSnippet, "embed")}
              >
                {label("embed", "Copy embed code")}
              </button>
              <a href={embedUrl} target="_blank" rel="noopener" className="font-mono text-xs text-meta hover:text-clay">
                Preview ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
