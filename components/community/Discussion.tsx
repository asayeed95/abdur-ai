import { CommentSection } from "@/components/community/CommentSection";
import { fetchVisibleComments } from "@/lib/community-server";

/**
 * Server entry for a post's discussion: renders the visible comments into the
 * page HTML (readable with JavaScript off), then hands them to the client
 * component, which refreshes the list and adds sign-in, posting and voting.
 */
export async function Discussion({ slug }: { slug: string }) {
  const initialRows = await fetchVisibleComments(slug);
  return <CommentSection slug={slug} initialRows={initialRows} />;
}
