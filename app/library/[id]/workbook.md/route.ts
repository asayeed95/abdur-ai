import { getAsset, isVisible } from "@/lib/library";
import { getLibrarySource } from "@/lib/library-content";

export const dynamic = "force-dynamic";

/** The editable Markdown copy the delivery email links to. Same visibility rule as the pages. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const asset = getAsset((await params).id);
  const source = asset && isVisible(asset) ? getLibrarySource(asset.id) : null;
  if (!asset || !source) return new Response("Not found", { status: 404 });
  return new Response(source.raw, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${asset.id}.md"`,
      "X-Robots-Tag": "noindex",
    },
  });
}
