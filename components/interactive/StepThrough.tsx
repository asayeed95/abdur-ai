"use client";

import { Children, isValidElement, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { readSlot } from "./slots";
import { BLOCK, BUTTON, CONTENT, EYEBROW, HEADING, META } from "./ui";

/**
 * A step-by-step walkthrough.
 *
 *   <StepThrough label="Walk the loop">
 *   <VerificationLoopDiagram />
 *   <Step title="The claim" highlight="claim">
 *   The agent says it's done. That's a claim, not a result.
 *   </Step>
 *   <Step title="Run the check" highlight="run check">…</Step>
 *   </StepThrough>
 *
 * Without JS (and in feeds and crawlers) every step renders, numbered, in
 * order. On hydrate it shows one step at a time with Previous / Next, a
 * numbered step list and arrow keys. A diagram inside it (bare or in a
 * <Figure>) dims every node except the ones the current step names in
 * `highlight`: space-separated node names, listed in each diagram's file.
 */
export function StepThrough({ label, children }: { label?: string; children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [current, setCurrent] = useState(0);

  const items = Children.toArray(children);
  const steps = items.map((c) => readSlot(c, "step")).filter((s) => s !== null);
  const total = steps.length;
  const step = steps[current];
  const highlight = step?.highlight ?? "";

  useEffect(() => setEnhanced(true), []);

  // Light the diagram nodes the current step names; dim the rest.
  useEffect(() => {
    const el = root.current;
    if (!el || !enhanced) return;
    const names = new Set(highlight.split(/\s+/).filter(Boolean));
    el.querySelectorAll("[data-node]").forEach((n) => {
      n.toggleAttribute("data-active", names.has(n.getAttribute("data-node") ?? ""));
    });
    el.toggleAttribute("data-stepping", names.size > 0);
  }, [enhanced, highlight]);

  const go = (i: number) => setCurrent(Math.max(0, Math.min(total - 1, i)));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(current + 1);
    else if (e.key === "ArrowLeft") go(current - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(total - 1);
    else return;
    e.preventDefault();
  };

  let n = 0;
  return (
    <section ref={root} aria-label={label ?? "Step-through"} className={`group/steps ${BLOCK}`}>
      {label && <div className={EYEBROW}>/// {label}</div>}
      {items.map((child, k) => {
        const s = readSlot(child, "step");
        if (!s) {
          if (!isValidElement(child)) return typeof child === "string" && !child.trim() ? null : child;
          return (
            <div key={child.key ?? k} className="mb-6">
              {child}
            </div>
          );
        }
        const i = n++;
        return (
          <div
            key={`step-${i}`}
            hidden={enhanced && i !== current}
            className={enhanced || i === 0 ? "" : "border-t border-border pt-5 mt-5"}
          >
            <div className={META}>
              Step {i + 1} of {total}
            </div>
            <div className={`${HEADING} mt-1 mb-2`}>{s.title}</div>
            <div className={CONTENT}>{s.children}</div>
          </div>
        );
      })}
      {enhanced && total > 1 && (
        <div onKeyDown={onKey} className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <button type="button" className={BUTTON} onClick={() => go(current - 1)} disabled={current === 0}>
            ← Prev
          </button>
          <div role="group" aria-label="Steps" className="order-first sm:order-none w-full sm:w-auto flex flex-wrap gap-1.5">
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === current ? "step" : undefined}
                className={`font-mono text-xs w-8 h-8 rounded-sm border transition-colors motion-reduce:transition-none ${
                  i === current ? "border-clay text-clay" : "border-border text-meta hover:text-text hover:border-muted"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button type="button" className={BUTTON} onClick={() => go(current + 1)} disabled={current === total - 1}>
            Next →
          </button>
          <div aria-live="polite" className="sr-only">
            {step ? `Step ${current + 1} of ${total}: ${step.title}` : ""}
          </div>
        </div>
      )}
    </section>
  );
}
