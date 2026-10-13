"use client";

import { Children, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { readSlot } from "./slots";
import { BLOCK, CONTENT, EYEBROW, META } from "./ui";

/**
 * Tabs: before/after, option A/B, or any set of alternatives read one at a time.
 *
 *   <Tabs label="Before and after">
 *   <Tab title="Before">The report said `all tests pass`.</Tab>
 *   <Tab title="After">The report quotes the command and its output.</Tab>
 *   </Tabs>
 *
 * Without JS every panel renders in order under its own title, so nothing is
 * hidden from feeds, crawlers or a reader with scripts off. On hydrate it
 * becomes a WAI-ARIA tablist: arrow keys, Home and End move between tabs.
 */
export function Tabs({ label, children }: { label?: string; children: ReactNode }) {
  const id = useId();
  const [enhanced, setEnhanced] = useState(false);
  const [current, setCurrent] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabs = Children.toArray(children)
    .map((c) => readSlot(c, "tab"))
    .filter((t) => t !== null);
  const total = tabs.length;

  useEffect(() => setEnhanced(true), []);

  const select = (i: number) => {
    const next = (i + total) % total;
    setCurrent(next);
    tabRefs.current[next]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") select(current + 1);
    else if (e.key === "ArrowLeft") select(current - 1);
    else if (e.key === "Home") select(0);
    else if (e.key === "End") select(total - 1);
    else return;
    e.preventDefault();
  };

  return (
    <section aria-label={label ?? "Tabs"} className={BLOCK}>
      {label && <div className={EYEBROW}>/// {label}</div>}
      {enhanced && (
        <div role="tablist" aria-label={label ?? "Tabs"} onKeyDown={onKey} className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border mb-5">
          {tabs.map((t, i) => (
            <button
              key={i}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-controls={`${id}-panel-${i}`}
              aria-selected={i === current}
              tabIndex={i === current ? 0 : -1}
              onClick={() => setCurrent(i)}
              className={`-mb-px pb-2 border-b-2 font-mono text-xs tracking-widest uppercase transition-colors motion-reduce:transition-none ${
                i === current ? "border-clay text-clay" : "border-transparent text-meta hover:text-text"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}
      {tabs.map((t, i) =>
        enhanced ? (
          <div
            key={i}
            role="tabpanel"
            id={`${id}-panel-${i}`}
            aria-labelledby={`${id}-tab-${i}`}
            hidden={i !== current}
            tabIndex={0}
            className={CONTENT}
          >
            {t.children}
          </div>
        ) : (
          <div key={i} className={i === 0 ? "" : "border-t border-border pt-5 mt-5"}>
            <div className={`${META} mb-2`}>{t.title}</div>
            <div className={CONTENT}>{t.children}</div>
          </div>
        ),
      )}
    </section>
  );
}
