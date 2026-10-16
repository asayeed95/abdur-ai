/**
 * The Agent Reliability Kit (AGE-2391): one list of what's in it, read by the
 * /kit landing page, the /kit/thanks page and the post-signup download block,
 * so the three can't drift. The files live in public/kit/; the zip is built
 * from them by scripts/build-kit.mjs (`npm run kit:build`).
 */
export type KitFile = {
  /** Coarse analytics key for `kit:download` (never user input). */
  key: string;
  href: string;
  title: string;
  format: string;
  summary: string;
};

export const KIT_PATH = "/kit";

export const KIT_ZIP: KitFile = {
  key: "zip",
  href: "/kit/agent-reliability-kit.zip",
  title: "The whole kit",
  format: "zip",
  summary: "All three, with a README, in one folder.",
};

export const KIT_FILES: readonly KitFile[] = [
  {
    key: "checklist",
    href: "/kit/agent-verification-checklist.md",
    title: "Agent verification checklist",
    format: "markdown",
    summary:
      "Seven checks to run before you trust an agent's report: read the diff, re-run the gate, confirm the check ran, trace claims to commits, reject evidence without provenance, measure what shipped, and don't let every check read one input. The command for each.",
  },
  {
    key: "memory",
    href: "/kit/durable-memory-starter/memory.mjs",
    title: "Durable-memory starter",
    format: "one Node.js file",
    summary:
      "An append-only JSONL memory log that survives a restart, with bounded replay. Strict UTF-8, an owner-only log, recovery from a half-written record. No dependencies, no API key.",
  },
  {
    key: "memory-readme",
    href: "/kit/durable-memory-starter/README.md",
    title: "Durable-memory starter README",
    format: "markdown",
    summary: "How to run it, and the limits it has on purpose.",
  },
  {
    key: "postmortem",
    href: "/kit/incident-postmortem-template.md",
    title: "Incident postmortem template",
    format: "markdown",
    summary:
      "The blank form of the Mistakes TLDR format: what broke, what it cost, the receipts, one named pattern, the fix.",
  },
];
