import { buildJsonFeed } from "@/lib/legibility";

export const dynamic = "force-static";

export async function GET() {
  return new Response(buildJsonFeed(), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
    },
  });
}
