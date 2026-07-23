import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

/**
 * One JSON file under content/applications/<slug>.json per curated job
 * application. The schema is the contract between the /apply/[slug] route,
 * the validator gate (scripts/validate-applications.mjs — keep in sync), and
 * the /apply-site authoring skill.
 */
export const applicationSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  company: z.string().min(1),
  companyUrl: z.string().url(),
  role: z.string().min(1),
  applyUrl: z.string().url().optional(),
  brand: z.object({
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    tagline: z.string().optional(),
  }),
  hero: z.object({
    headline: z.string().min(1),
    subline: z.string().min(1),
  }),
  fitMap: z
    .array(
      z.object({
        theirNeed: z.string().min(1),
        myProof: z.string().min(1),
        link: z.string().url().optional(),
      })
    )
    .min(3),
  cultureChips: z.array(z.string().min(1)).max(6).default([]),
  autonomyBand: z.boolean().default(true),
  closer: z.object({
    line: z.string().min(1),
    email: z.string().email(),
  }),
});

export type ApplicationConfig = z.infer<typeof applicationSchema>;

const APPS_DIR = path.join(process.cwd(), "content", "applications");

export function listApplicationSlugs(): string[] {
  if (!fs.existsSync(APPS_DIR)) return [];
  return fs
    .readdirSync(APPS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function loadApplication(slug: string): ApplicationConfig | null {
  // Slug arrives from the URL — untrusted; it never reaches the filesystem raw.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(APPS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
  const parsed = applicationSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
