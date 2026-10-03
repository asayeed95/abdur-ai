import { Diagram, NODE_STATE } from "./parts";

/**
 * "12 of my 15 meta descriptions were too long for search": a results snippet
 * whose description is cut to fit the device width before the sentence
 * finishes, then the lengths behind it on one scale. Before the fix the worst
 * description ran 271 characters; after it the ten posts run 141 to 152,
 * inside a ~155-character budget (a budget the author chose, not a limit
 * Google publishes). Only numbers the post states; bars drawn to scale.
 *
 * Nodes for <StepThrough highlight="…">: serp, cut, before, after, budget.
 */
const X0 = 20;
const SPAN = 280;
const MAX = 271;
const at = (chars: number) => X0 + Math.round((SPAN * chars) / MAX);

export function MetaDescriptionTruncationDiagram() {
  const budget = at(155);
  return (
    <Diagram
      height={348}
      title="A meta description cut short in a search snippet"
      desc="A search result shows a URL, a title and two lines of description. The description is longer than the snippet has room for, so it is cut with an ellipsis before the sentence finishes, and the rest is never shown. Google truncates to fit the device width and publishes no character limit. On a scale of characters: before the fix the worst description ran 271 characters, well past a budget of about 155 that the author chose. After the fix the ten post descriptions run 141 to 152 characters, each one complete thought inside the budget."
    >
      <text x={X0} y={14} fontSize={11} letterSpacing="0.12em" className="font-mono fill-meta" aria-hidden="true">
        THE SNIPPET, BEFORE THE FIX
      </text>

      <g data-node="serp" aria-hidden="true" className={NODE_STATE}>
        <rect x={X0} y={26} width={SPAN} height={100} rx={6} strokeWidth={1.5} className="fill-surface stroke-border-2 group-data-[active]/node:stroke-clay" />
        <text x={X0 + 14} y={48} fontSize={11} className="font-mono fill-meta">
          abdur.ai › writing › …
        </text>
        <text x={X0 + 14} y={72} fontSize={15} fontWeight={500} className="fill-text">
          Post title · abdur.ai
        </text>
        <rect x={X0 + 14} y={88} width={SPAN - 28} height={8} rx={4} className="fill-muted" />
        <rect x={X0 + 14} y={106} width={SPAN - 64} height={8} rx={4} className="fill-muted" />
        <text x={X0 + SPAN - 44} y={114} fontSize={16} fontWeight={500} className="fill-text">
          …
        </text>
      </g>

      <g data-node="cut" aria-hidden="true" className={NODE_STATE}>
        <rect x={X0 + 14} y={136} width={150} height={8} rx={4} fill="none" strokeWidth={1.25} strokeDasharray="4 3" className="stroke-muted" />
        <text x={X0 + 174} y={140} dominantBaseline="central" fontSize={12} className="font-mono fill-clay">
          never shown
        </text>
        <text x={X0} y={166} fontSize={13} className="fill-text-soft">
          Cut to fit the device width, before
        </text>
        <text x={X0} y={184} fontSize={13} className="fill-text-soft">
          the sentence finished.
        </text>
      </g>

      <text x={X0} y={218} fontSize={11} letterSpacing="0.12em" className="font-mono fill-meta" aria-hidden="true">
        DESCRIPTION LENGTH, CHARACTERS
      </text>

      <g data-node="before" aria-hidden="true" className={NODE_STATE}>
        <text x={X0} y={242} fontSize={13} className="fill-text">
          Before, worst: 271
        </text>
        <rect x={X0} y={250} width={budget - X0} height={12} className="fill-muted" />
        <rect x={budget} y={250} width={at(MAX) - budget} height={12} className="fill-clay" />
      </g>

      <g data-node="after" aria-hidden="true" className={NODE_STATE}>
        <text x={X0} y={284} fontSize={13} className="fill-text">
          After: 141 to 152
        </text>
        <rect x={X0} y={292} width={at(141) - X0} height={12} className="fill-good-text" />
        <rect x={at(141)} y={292} width={at(152) - at(141)} height={12} className="fill-good-text opacity-50" />
      </g>

      <g data-node="budget" aria-hidden="true" className={NODE_STATE}>
        <line x1={budget} y1={232} x2={budget} y2={312} strokeWidth={1.5} strokeDasharray="3 3" className="stroke-text" />
        <text x={budget} y={330} textAnchor="middle" fontSize={12} className="font-mono fill-meta">
          ~155: my budget, not a Google limit
        </text>
      </g>
    </Diagram>
  );
}
