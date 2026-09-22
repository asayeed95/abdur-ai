export type ProjectStatus = "live" | "progress" | "internal" | "parked";

type ProjectLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type PoppyProject = {
  slug: string;
  name: string;
  status: string;
  tone: ProjectStatus;
  detail?: string;
  body: string;
  poppy: string;
  explainer: string;
  links?: ProjectLink[];
};

/**
 * Candidate-facing project records. Each entry has a route-local explainer so
 * public evidence never depends on an unverified external product or source URL.
 *
 * Status labels must stay consistent with the public-truth surfaces: /hire,
 * the product sites themselves, and the C-12 status vocabulary (AGE-1684).
 */
export const PROJECTS: PoppyProject[] = [
  {
    slug: "northsun",
    name: "Northsun",
    status: "In development",
    tone: "progress",
    detail: "AI product · #1 priority · not GA",
    body: "My main AI product. Northsun is the memory and enrichment layer for AI agents. The work is retrieval and memory plumbing, with a client SDK published on npm.",
    poppy: "The closest thing to their stack — AI harnesses, context/retrieval/memory, product UX over complex AI.",
    explainer: "Northsun is my priority product and is in active development. Its client SDK is published on npm; the platform is not generally available.",
  },
  {
    slug: "heycli",
    name: "HeyCLI",
    status: "In engineering",
    tone: "progress",
    body: "Voice-driven, multi-session orchestration for coding agents: an iOS client and a Node.js/TypeScript bridge over an authenticated WebSocket.",
    poppy: "A harness around an agent, not a chat box around a model. Same design instinct Poppy needs: meet the user in their workflow.",
    explainer: "HeyCLI is in engineering. It lets one person direct several coding-agent sessions by voice, through an iOS-first client and a Node.js/TypeScript bridge over an authenticated WebSocket.",
  },
  {
    slug: "abdur-ai",
    name: "abdur.ai",
    status: "Live",
    tone: "live",
    body: "My personal site and portfolio: the writing, the ship log, and the hire page.",
    poppy: "The UI craft on display — and this very page is the proof of it.",
    explainer: "The live portfolio is the most direct evidence of the writing, information architecture, and candidate-facing design in this brief. Its fuller recruiter-oriented context lives on the hire page.",
    links: [
      { label: "Visit abdur.ai", href: "/" },
      { label: "Full portfolio", href: "/hire" },
    ],
  },
  {
    slug: "browseflow",
    name: "BrowseFlow",
    status: "Working prototype",
    tone: "progress",
    detail: "reproducible locally",
    body: "Agent-agnostic browser automation with accessibility-tree perception, a CDP-first hybrid engine, approval queues, and a run journal.",
    poppy: "A design posture for agentic work: explicit approval points and an inspectable journal when a person needs to understand or redirect a run.",
    explainer: "BrowseFlow is a working prototype, reproducible locally. Its browser automation pairs approval queues with a run journal so human direction remains legible.",
  },
  {
    slug: "relay",
    name: "Relay",
    status: "Internal — not public",
    tone: "internal",
    body: "Internal infrastructure at One Asec: the event spine for the company's automations. Not a public product.",
    poppy: "Evidence of systems thinking: the unglamorous plumbing that keeps products running.",
    explainer: "Relay is the event spine for One Asec's automations: authenticated webhook ingress, fenced leases, and receipts that make a duplicate impossible. It is internal infrastructure, not a public product.",
  },
  {
    slug: "dockerfile-ai",
    name: "Dockerfile.ai",
    status: "In engineering",
    tone: "progress",
    body: "An AI tool around Dockerfiles — applied AI on a concrete developer workflow.",
    poppy: "Applied AI with a tight feedback loop: one workflow, done well, judged by output quality.",
    explainer: "Dockerfile.ai is in engineering and is not yet a released service. Its public site describes the workflow: Dockerfile generation, explanation, and optimization.",
    links: [{ label: "Visit product site", href: "https://dockerfile.ai", external: true }],
  },
  {
    slug: "halo",
    name: "Halo",
    status: "Parked concept",
    tone: "parked",
    body: "A concept on the shelf — kept honest as a concept, not dressed up as a launch.",
    poppy: "I scope honestly. Parked means parked.",
    explainer: "Halo is intentionally parked: a concept on the shelf, not an available product.",
  },
];
