/**
 * The three registers every abdur.ai post declares.
 *
 * Publishing here does not require shipping. It requires being honest about
 * which kind of claim you are making:
 *
 *   reported — "this happened"                      · needs a receipt
 *   designed — "this is what I designed / how I'd build it" · needs nothing shipped
 *   argued   — "this is what I think is true"       · needs no artifact
 *
 * The hard line, which no register waives: no past-tense verb over an event
 * that did not happen, and no number attached to something that was not
 * measured. The register is what makes that line checkable — it tells a reader
 * (and `scripts/check-public-claims.py`) which standard of evidence this piece
 * is claiming to meet.
 */

export const REGISTERS = ["reported", "designed", "argued"] as const;
export type Register = (typeof REGISTERS)[number];

type RegisterSpec = {
  /** Badge text on the index and post header. */
  label: string;
  /** What the register asserts, in the author's voice. */
  claim: string;
  /**
   * Default one-line status note rendered near the top of the post.
   * `null` for `reported` — its status note is the receipts block, and a
   * "this happened" note under a piece that already carries PR/SHA receipts
   * would be noise. A post may override this with `status_note:`.
   */
  note: string | null;
  /**
   * Whether the register obliges a `receipts:` block. Only `reported` claims
   * an event occurred, so only `reported` owes evidence that it did.
   */
  requiresReceipts: boolean;
};

export const REGISTER_SPEC: Record<Register, RegisterSpec> = {
  reported: {
    label: "Reported",
    claim: "This happened.",
    note: null,
    requiresReceipts: true,
  },
  designed: {
    label: "Designed",
    claim: "This is what I designed, and how I would build it.",
    note: "Design. Not built yet.",
    requiresReceipts: false,
  },
  argued: {
    label: "Argued",
    claim: "This is what I think is true.",
    note: "Argument. No artifact behind it.",
    requiresReceipts: false,
  },
};

export function isRegister(value: unknown): value is Register {
  return typeof value === "string" && (REGISTERS as readonly string[]).includes(value);
}
