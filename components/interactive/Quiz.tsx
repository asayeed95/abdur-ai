"use client";

import { Children, useEffect, useId, useState, type ReactNode } from "react";
import { readSlot } from "./slots";
import { BLOCK, BUTTON, CONTENT, EYEBROW, HEADING, META } from "./ui";

/**
 * "Try to answer, then reveal." With choices it's a one-question quiz; without
 * them it's a think-first prompt with a hidden answer.
 *
 *   <Quiz question="The suite is green. What goes in the report?">
 *   <Choice>Done.</Choice>
 *   <Choice correct>The command, its output, and that it matches the claim.</Choice>
 *   <Answer>A green suite is evidence only if it ran this turn, against this change.</Answer>
 *   </Quiz>
 *
 *   <Quiz question="Why keep the log append-only?">
 *   <Answer>…</Answer>
 *   </Quiz>
 *
 * The answer sits in a native <details>, so it opens with scripts off and is
 * in the HTML for feeds and crawlers. Choices are native radios. On hydrate a
 * Check button marks the pick right or wrong (announced politely) and opens
 * the answer. `correct` is a bare attribute; mark exactly one choice.
 */
export function Quiz({ question, label, children }: { question: string; label?: string; children: ReactNode }) {
  const id = useId();
  const [enhanced, setEnhanced] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setEnhanced(true), []);

  const items = Children.toArray(children);
  const choices = items.map((c) => readSlot(c, "choice")).filter((c) => c !== null);
  const answer = items.map((c) => readSlot(c, "answer")).find((a) => a !== null);
  const correct = choices.findIndex((c) => c.correct);
  const right = picked !== null && picked === correct;

  return (
    <fieldset className={`${BLOCK} min-w-0`}>
      <legend className="sr-only">{question}</legend>
      <div aria-hidden="true" className={EYEBROW}>
        /// {label ?? (choices.length ? "Quick check" : "Think first")}
      </div>
      <div aria-hidden="true" className={`${HEADING} mb-3`}>
        {question}
      </div>

      {choices.length > 0 && (
        <div className="space-y-1">
          {choices.map((c, i) => {
            const verdict = checked && picked === i ? (i === correct ? "right" : "wrong") : null;
            return (
              <label
                key={i}
                className={`flex items-start gap-3 py-2 px-3 -mx-3 rounded-sm border cursor-pointer text-base leading-relaxed text-text-soft has-[:checked]:text-text ${
                  verdict === "right" ? "border-good-text" : verdict === "wrong" ? "border-clay" : "border-transparent"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-choice`}
                  value={i}
                  onChange={() => {
                    setPicked(i);
                    setChecked(false);
                  }}
                  className="mt-1.5 h-4 w-4 shrink-0 accent-clay cursor-pointer"
                />
                <span className="flex-1">{c.children}</span>
                {verdict && (
                  <span className={`${META} mt-1 ${verdict === "right" ? "!text-good-text" : "!text-clay"}`}>
                    {verdict === "right" ? "Right" : "Not this one"}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}

      {enhanced && choices.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            className={BUTTON}
            disabled={picked === null}
            onClick={() => {
              setChecked(true);
              setOpen(true);
            }}
          >
            Check
          </button>
          <span aria-live="polite" className={`${META} ${checked ? (right ? "!text-good-text" : "!text-clay") : ""}`}>
            {checked ? (right ? "Right." : "Not quite. The answer is below.") : ""}
          </span>
        </div>
      )}

      {(answer || correct >= 0) && (
        <details
          open={open}
          onToggle={(e) => setOpen(e.currentTarget.open)}
          className="group/answer mt-4 pt-4 border-t border-border"
        >
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden font-mono text-xs tracking-widest uppercase text-clay hover:text-text">
            <span className="group-open/answer:hidden">Show the answer ↓</span>
            <span className="hidden group-open/answer:inline">Hide the answer ↑</span>
          </summary>
          <div className="mt-3 space-y-3">
            {correct >= 0 && (
              <div className={CONTENT}>
                <span className={`${META} mr-2`}>Answer ·</span>
                {choices[correct].children}
              </div>
            )}
            {answer && <div className={CONTENT}>{answer.children}</div>}
          </div>
        </details>
      )}
    </fieldset>
  );
}
