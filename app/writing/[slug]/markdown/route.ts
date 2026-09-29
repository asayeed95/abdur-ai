import { fullPostMarkdown, absolutePostUrl } from "@/lib/legibility";
import { getAllPosts, getPost } from "@/lib/posts";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/** Markdown twin. Public URL is `/writing/<slug>.md` via the rewrite in next.config.mjs. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return new Response("Not found\n", { status: 404 });
  }
  return new Response(fullPostMarkdown(post), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${absolutePostUrl(post.slug)}>; rel="canonical"`,
    },
  });
}
