/**
 * Site-wide constants. Single source of truth.
 * Update placeholders before launch (search for `TODO_`).
 */
export const SITE = {
  brand: "abdur.ai",
  author: "Abdur Rahman Sayeed",
  tagline: "I ship AI things and write the TLDR.",
  description:
    "Abdur Rahman Sayeed — solo AI founder running a portfolio of vertical AI products on one memory spine, Mnemix. One human on strategy, an agent team on execution. This is the logbook: what shipped, what broke, what I learned.",
  url: "https://abdur.ai",
  location: "West New York, NJ · NYC metro",
  email: "hello@abdur.ai",
  handles: {
    x: "@asayeed95",
    github: "https://github.com/asayeed95",
    linkedin: "https://www.linkedin.com/in/asayeed95/",
  },
  parent: {
    name: "ASEC",
    url: "https://asec.co",
    status: "coming soon",
  },
  flagship: {
    name: "Mnemix",
    url: "https://mnemix.ai",
    tagline: "The memory layer that makes any AI agent self-driving.",
  },
} as const;

export const NAV = [
  { href: "/#latest", label: "Latest" },
  { href: "/#log", label: "Ship log" },
  { href: "/#tools", label: "Tools" },
  { href: "/#projects", label: "Mnemix" },
  { href: "/#about", label: "About" },
  { href: "/aitldr", label: "TLDR" },
] as const;

/** Whether the /hire CTA + "Currently open to roles" block renders. */
export const OPEN_TO_ROLES = true;
