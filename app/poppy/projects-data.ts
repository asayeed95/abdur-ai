export type ProjectStatus = "live" | "progress" | "source" | "internal" | "parked";

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
 */
export const PROJECTS: PoppyProject[] = [
  {
    slug: "northsun",
    name: "Northsun",
    status: "In progress",
    tone: "progress",
    detail: "AI product · #1 priority",
    body: "My main AI product. An applied-AI system with retrieval and memory plumbing; Mnemix is its free diagnostic tool for users (the mnemix-engine package — Mnemix is the tool, not the product).",
    poppy: "The closest thing to their stack — AI harnesses, context/retrieval/memory, product UX over complex AI.",
    explainer: "Northsun is the priority product in active development. This is its public explainer on abdur.ai, not a deployed product surface; it describes the work without asking a recruiter to infer product availability from northsun.ai.",
  },
  {
    slug: "heycli",
    name: "HeyCLI",
    status: "In progress",
    tone: "progress",
    body: "An AI CLI harness — the agent lives where the developer already works.",
    poppy: "A harness around an agent, not a chat box around a model. Same design instinct Poppy needs: meet the user in their workflow.",
    explainer: "HeyCLI is an active harness project. This brief presents its current scope and status directly rather than sending a recruiter to a repository URL whose public availability was not verified for this page.",
  },
  {
    slug: "abdur-ai",
    name: "abdur.ai",
    status: "Live",
    tone: "live",
    body: "My personal site and portfolio, including the hire page this brief is adapted from.",
    poppy: "The UI craft on display — and this very page is the proof of it.",
    explainer: "The live portfolio is the most direct evidence of the writing, information architecture, and candidate-facing design in this brief. Its fuller recruiter-oriented context lives on the hire page.",
    links: [
      { label: "Visit abdur.ai", href: "https://abdur.ai", external: true },
      { label: "Full portfolio", href: "/hire" },
    ],
  },
  {
    slug: "browseflow",
    name: "BrowseFlow",
    status: "Open source",
    tone: "source",
    detail: "free for users",
    body: "Agent-agnostic browser automation with accessibility-tree perception, a CDP-first hybrid engine, approval queues, and a run journal.",
    poppy: "A design posture for agentic work: explicit approval points and an inspectable journal when a person needs to understand or redirect a run.",
    explainer: "BrowseFlow is open-source work at a working-prototype stage. Its browser automation pairs approval queues with a run journal so human direction remains legible.",
  },
  {
    slug: "relay",
    name: "Relay",
    status: "Internal — not public",
    tone: "internal",
    body: "Internal infrastructure under One Asec — not a public product, and presented as exactly that.",
    poppy: "Evidence of systems thinking: the unglamorous plumbing that keeps products running.",
    explainer: "Relay is internal infrastructure, so there is no public product or source destination to imply. It remains here only as appropriately labeled evidence of the operational systems behind product work.",
  },
  {
    slug: "dockerfile-ai",
    name: "Dockerfile.ai",
    status: "In progress",
    tone: "progress",
    body: "An AI tool around Dockerfiles — applied AI on a concrete developer workflow.",
    poppy: "Applied AI with a tight feedback loop: one workflow, done well, judged by output quality.",
    explainer: "Dockerfile.ai has a public site and shipped work, while the product remains in progress. This brief focuses on its applied-AI developer workflow without implying that every planned capability is available.",
    links: [{ label: "Visit product site", href: "https://dockerfile.ai", external: true }],
  },
  {
    slug: "halo",
    name: "Halo",
    status: "Parked concept",
    tone: "parked",
    body: "A concept on the shelf — kept honest as a concept, not dressed up as a launch.",
    poppy: "I scope honestly. Parked means parked.",
    explainer: "Halo is intentionally parked. Its inclusion is a status example, not a request to treat a concept as a currently available product.",
  },
  {
    slug: "baylio",
    name: "Baylio",
    status: "Parked concept",
    tone: "parked",
    detail: "early prototype exists",
    body: "AI call-assistant SaaS concept for auto repair shops (ElevenLabs + Twilio + Claude + Stripe) — a repo exists and work started, but it is parked, not launched.",
    poppy: "Voice AI + integrations (telephony, payments) — the connector/integration muscle the role asks for.",
    explainer: "Baylio has an early prototype but remains parked and unlaunched. The useful evidence is the implementation scope—voice, telephony, model, and payments integrations—not a public availability claim.",
  },
];
