#!/usr/bin/env node
// Gate: every content/applications/*.json must satisfy the schema, and the
// schema must still REJECT a known-bad config (negative self-test), so a
// loosened schema fails loudly instead of passing garbage.
// Schema mirrors lib/applications.ts — keep the two in sync.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  company: z.string().min(1),
  companyUrl: z.string().url(),
  role: z.string().min(1),
  applyUrl: z.string().url().optional(),
  brand: z.object({
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    tagline: z.string().optional(),
  }),
  hero: z.object({ headline: z.string().min(1), subline: z.string().min(1) }),
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
  closer: z.object({ line: z.string().min(1), email: z.string().email() }),
});

let fails = 0;

const KNOWN_BAD = { slug: "BAD SLUG!", company: "", fitMap: [] };
if (schema.safeParse(KNOWN_BAD).success) {
  console.error("✗ negative self-test FAILED: schema accepted a known-bad config");
  fails++;
} else {
  console.log("✓ negative self-test: schema rejects known-bad config");
}

const dir = path.join(process.cwd(), "content", "applications");
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
if (files.length === 0) console.log("! no application configs yet");
for (const f of files) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  } catch (e) {
    console.error(`✗ ${f}: invalid JSON — ${e.message}`);
    fails++;
    continue;
  }
  const res = schema.safeParse(raw);
  if (!res.success) {
    console.error(
      `✗ ${f}: ${res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
    );
    fails++;
  } else if (res.data.slug !== f.replace(/\.json$/, "")) {
    console.error(`✗ ${f}: slug field must equal filename`);
    fails++;
  } else {
    console.log(`✓ ${f}`);
  }
}

process.exit(fails ? 1 : 0);
