"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";

const RESUMES = [
  { href: "/resume-forward-deployed-ai.pdf", label: "Forward Deployed AI résumé", note: "ATS-first, single column, machine-parseable" },
  { href: "/resume-master-career.pdf", label: "Master career résumé", note: "Full detail, same parseable format" },
  { href: "#sheet", label: "Read it here", note: "The sheet, below on this page" },
] as const;

type Topic = "role" | "northsun" | "hi";

const TOPICS: { key: Topic; chip: string; send: string; subject: string; template: string }[] = [
  {
    key: "role",
    chip: "Role / hiring",
    send: "Send — role / hiring →",
    subject: "Role for you — via abdur.ai/hire",
    template:
      "Hi Abdur — we're hiring for an Applied AI / FDE-type role and your work on Northsun caught our eye. Here's the JD: [link]. Open to a quick call this week?",
  },
  {
    key: "northsun",
    chip: "Northsun",
    send: "Send — about Northsun →",
    subject: "About Northsun — via abdur.ai/hire",
    template:
      "Hi Abdur — we're building voice agents and want to hear more about how Northsun governs agent memory. What does a pilot look like?",
  },
  {
    key: "hi",
    chip: "Just saying hi",
    send: "Send it →",
    subject: "Hello — via abdur.ai/hire",
    template: "Hi Abdur — found you through abdur.ai and wanted to connect. ",
  },
];

const templateFor = (t: Topic) => TOPICS.find((x) => x.key === t)!;
const ALL_TEMPLATES = TOPICS.map((t) => t.template);

export function HireActions() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [topic, setTopic] = useState<Topic>("role");
  const [message, setMessage] = useState(TOPICS[0].template);
  const [replyTo, setReplyTo] = useState("");
  const [copied, setCopied] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Dropdown: close on any outside click, and on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Modal: Escape closes, background does not scroll, focus goes to the field
  // the visitor is meant to type in and returns to the trigger on close.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => textareaRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      returnFocusRef.current?.focus();
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  /** Swap the starter only if the visitor hasn't written anything of their own. */
  const pickTopic = useCallback(
    (next: Topic) => {
      setTopic(next);
      setMessage((current) =>
        !current.trim() || ALL_TEMPLATES.includes(current) ? templateFor(next).template : current,
      );
    },
    [],
  );

  const openModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    returnFocusRef.current = e.currentTarget;
    setMenuOpen(false);
    setModalOpen(true);
  };

  const send = () => {
    const active = templateFor(topic);
    const body =
      (message || active.template) +
      (replyTo ? `\n\nReach me at: ${replyTo}` : "") +
      "\n\n—\nRésumé: abdur.ai/hire · Portfolio: abdur.ai";
    window.location.href = `mailto:${SITE.hireEmail}?subject=${encodeURIComponent(
      active.subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard) return; // no API: do not claim a copy happened
      await navigator.clipboard.writeText(SITE.hireEmail);
      setCopied(true);
    } catch {
      /* clipboard blocked — the address is visible on the button regardless */
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-10 items-stretch sm:items-start">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className="w-full sm:w-auto justify-center font-mono text-xs tracking-widest uppercase text-bg bg-clay border-0 px-[18px] py-3.5 rounded-sm cursor-pointer flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            Download résumé <span className="text-[10px]" aria-hidden>▾</span>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute top-[calc(100%+8px)] left-0 right-0 sm:right-auto sm:min-w-[340px] bg-surface border border-border rounded-sm z-20 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.55)] overflow-hidden"
            >
              {RESUMES.map((r, i) => (
                <a
                  key={r.href}
                  href={r.href}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3.5 hover:bg-surface-2 transition-colors ${
                    i < RESUMES.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="block font-mono text-[11px] tracking-wider uppercase text-text">
                    {r.label}
                  </span>
                  <span className="block text-xs text-muted mt-1">{r.note}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={openModal}
          className="w-full sm:w-auto justify-center font-mono text-xs tracking-widest uppercase text-text bg-transparent border border-border px-[18px] py-3.5 rounded-sm cursor-pointer hover:border-clay transition-colors"
        >
          Email me →
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-8"
          style={{ background: "var(--hire-overlay)", backdropFilter: "blur(6px)" }}
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hire-modal-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full md:w-[520px] max-w-full bg-surface border border-border rounded-lg shadow-[0_48px_120px_-32px_rgba(0,0,0,0.65)] overflow-hidden"
          >
            <div className="px-5 md:px-8 pt-7 flex justify-between items-start gap-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-clay mb-2.5 flex items-center gap-2">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-clay animate-pulse-clay"
                    aria-hidden
                  />
                  /// Direct line
                </p>
                <h3
                  id="hire-modal-title"
                  className="font-display text-[26px] md:text-[30px] leading-tight tracking-tight text-text"
                >
                  The fastest way in is a direct message.
                </h3>
                <p className="text-sm leading-relaxed text-muted mt-2.5">
                  I respond to everything. One line is enough — I&apos;ll take it from there.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="font-mono text-sm text-muted hover:text-text cursor-pointer px-2 py-1 flex-none bg-transparent border-0 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-5 md:px-8 py-6 flex flex-col gap-4">
              <div className="flex gap-2 flex-wrap">
                {TOPICS.map((t) => {
                  const on = t.key === topic;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pickTopic(t.key)}
                      style={{ background: on ? "rgb(var(--c-clay) / 0.12)" : "transparent" }}
                      className={`font-mono text-[11px] tracking-wider uppercase px-3 py-2 rounded-sm cursor-pointer border transition-colors ${
                        on ? "border-clay text-clay" : "border-border text-muted"
                      }`}
                    >
                      {t.chip}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="hire-msg"
                  className="font-mono text-[10px] tracking-widest uppercase text-muted-3"
                >
                  Your message — pick a starter above, edit freely
                </label>
                <textarea
                  id="hire-msg"
                  ref={textareaRef}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="We're hiring for an Applied AI role — here's the JD…"
                  className="bg-bg-2 border border-border rounded px-3.5 py-3 font-body text-sm leading-snug text-text resize-y outline-none focus:border-clay transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="hire-email"
                  className="font-mono text-[10px] tracking-widest uppercase text-muted-3"
                >
                  Your email — so the reply finds you
                </label>
                <input
                  id="hire-email"
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="you@company.com"
                  className="bg-bg-2 border border-border rounded px-3.5 py-3 font-mono text-[13px] text-text outline-none focus:border-clay transition-colors"
                />
              </div>

              <div className="flex gap-2.5 items-center flex-wrap">
                <button
                  type="button"
                  onClick={send}
                  className="font-mono text-xs tracking-wider uppercase text-bg bg-clay border-0 px-[18px] py-3 rounded-sm cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {templateFor(topic).send}
                </button>
                <button
                  type="button"
                  onClick={copy}
                  aria-live="polite"
                  className="font-mono text-[11px] tracking-wider uppercase text-muted bg-transparent border border-border px-4 py-3 rounded-sm cursor-pointer hover:border-clay hover:text-clay transition-colors"
                >
                  {copied ? "Copied ✓" : `Copy ${SITE.hireEmail}`}
                </button>
              </div>

              <p className="text-xs leading-relaxed text-muted-3">
                Send opens your mail app with everything pre-filled — nothing is stored here.
                Prefer LinkedIn?{" "}
                <span className="text-muted">linkedin.com/in/asayeed95</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
