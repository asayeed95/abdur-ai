import { isValidElement, type ReactNode } from "react";

/**
 * The child blocks of the interactive components: <Step>, <Tab>, <Choice>,
 * <Answer>. They are deliberately NOT client components. Post MDX renders as a
 * server component, so each of these renders on the server to a plain
 * `<div data-slot="…">` whose attributes and children the client parent
 * (StepThrough, Tabs, Quiz) can read. A client component as a child would
 * arrive as an opaque client reference, and the parent couldn't tell a Choice
 * from an Answer.
 *
 * A slot renders nothing visual itself: the parent builds the chrome (titles,
 * numbers, radios, panels) around the slot's children, so the no-JS HTML and
 * the enhanced UI come from one place.
 */

type Slot = "step" | "tab" | "choice" | "answer";

export function Step({ title, highlight, children }: { title: string; highlight?: string; children?: ReactNode }) {
  return (
    <div data-slot="step" data-title={title} data-highlight={highlight}>
      {children}
    </div>
  );
}

export function Tab({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div data-slot="tab" data-title={title}>
      {children}
    </div>
  );
}

/** `correct` is a bare attribute in MDX: <Choice correct>…</Choice>. */
export function Choice({ correct, children }: { correct?: boolean; children?: ReactNode }) {
  return (
    <div data-slot="choice" data-correct={correct ? "" : undefined}>
      {children}
    </div>
  );
}

export function Answer({ children }: { children?: ReactNode }) {
  return <div data-slot="answer">{children}</div>;
}

const RENDER: Record<Slot, (p: never) => ReactNode> = { step: Step, tab: Tab, choice: Choice, answer: Answer };

export type SlotData = {
  title: string;
  highlight?: string;
  correct: boolean;
  children: ReactNode;
};

/**
 * Read a child as a slot of `kind`. Handles both shapes a child can take: the
 * server-rendered `<div data-slot>` (post MDX), and an unrendered <Step>
 * element (the slot used directly inside another client component).
 */
export function readSlot(node: ReactNode, kind: Slot): SlotData | null {
  if (!isValidElement(node)) return null;
  if (node.type === RENDER[kind]) {
    return readSlot((RENDER[kind] as (p: unknown) => ReactNode)(node.props), kind);
  }
  const p = node.props as Record<string, unknown>;
  if (p["data-slot"] !== kind) return null;
  return {
    title: typeof p["data-title"] === "string" ? (p["data-title"] as string) : "",
    highlight: typeof p["data-highlight"] === "string" ? (p["data-highlight"] as string) : undefined,
    correct: p["data-correct"] !== undefined,
    children: p.children as ReactNode,
  };
}
