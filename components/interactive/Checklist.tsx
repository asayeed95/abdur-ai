"use client";

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { BLOCK, BUTTON, EYEBROW, META } from "./ui";

/**
 * An interactive checklist the reader can tick through.
 *
 *   <Checklist label="Before you report done">
 *   <Check>I ran the check myself, this turn.</Check>
 *   <Check>I read the output, not the summary of it.</Check>
 *   </Checklist>
 *
 * Each item is a native checkbox, so it toggles with scripts off too. On
 * hydrate the block adds a live "n of m checked" count and a Reset button.
 * State is local to the page: nothing is stored, sent or remembered.
 */

export function Check({ children }: { children: ReactNode }) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer text-base leading-relaxed text-text-soft has-[:checked]:text-text">
      <input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0 accent-clay cursor-pointer" />
      <span>{children}</span>
    </label>
  );
}

export function Checklist({ label, children }: { label?: string; children: ReactNode }) {
  const box = useRef<HTMLFieldSetElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [checked, setChecked] = useState(0);
  const total = Children.toArray(children).filter(isValidElement).length;

  const recount = () => setChecked(box.current?.querySelectorAll('input[type="checkbox"]:checked').length ?? 0);

  useEffect(() => {
    setEnhanced(true);
    recount(); // a box ticked before hydration still counts
  }, []);

  const reset = () => {
    box.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((i) => (i.checked = false));
    recount();
  };

  return (
    <fieldset ref={box} onChange={recount} className={`${BLOCK} min-w-0`}>
      <legend className="sr-only">{label ?? "Checklist"}</legend>
      {label && (
        <div aria-hidden="true" className={EYEBROW}>
          /// {label}
        </div>
      )}
      <div className="divide-y divide-border">{children}</div>
      {enhanced && (
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <span aria-live="polite" className={META}>
            {checked} of {total} checked
          </span>
          <button type="button" className={BUTTON} onClick={reset} disabled={checked === 0}>
            Reset
          </button>
        </div>
      )}
    </fieldset>
  );
}
