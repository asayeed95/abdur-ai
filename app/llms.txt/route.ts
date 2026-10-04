import { LLMS_IDENTITY, renderLlmsTxt } from "@/lib/llms-text";

export const dynamic = "force-static";

/**
 * The claims gate reads this file as text and requires the Northsun identity
 * verbatim. The rendered document lives in lib/llms-text.ts; this constant
 * must stay equal to LLMS_IDENTITY or the build throws.
 */
const PUBLIC_TRUTH_IDENTITY = "the memory and enrichment layer for AI agents";

export async function GET() {
  if (PUBLIC_TRUTH_IDENTITY !== LLMS_IDENTITY) {
    throw new Error("llms.txt identity drifted from the claims-gate literal");
  }
  const body = renderLlmsTxt();
  if (!body.toLowerCase().includes(PUBLIC_TRUTH_IDENTITY.toLowerCase())) {
    throw new Error("llms.txt dropped the Northsun identity line");
  }
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
