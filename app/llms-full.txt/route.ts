import { renderLlmsFull } from "@/lib/llms-text";

export const dynamic = "force-static";

/** Full text of published posts. Drafts are not included. */
export async function GET() {
  return new Response(renderLlmsFull(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
