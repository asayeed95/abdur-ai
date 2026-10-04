import { COMMENT_SELECT, type CommentRow } from "@/lib/community";

/** How stale the server-rendered snapshot of a discussion may get. */
export const COMMENTS_REVALIDATE_SECONDS = 300;

/**
 * Visible comments for a post, read on the server with the publishable key
 * (the same anon view RLS gives any reader). The post page renders them into
 * its HTML, so a discussion can be read without JavaScript, by crawlers and
 * by agents fetching the page (Forge F1 on AGE-2972). The browser then
 * refreshes the list live.
 *
 * Cached for COMMENTS_REVALIDATE_SECONDS. Returns null (the client loads
 * instead) when the env is unset or the database is unreachable, so a paused
 * free-tier project can never fail a build or a page render.
 */
export async function fetchVisibleComments(slug: string): Promise<CommentRow[] | null> {
  const url = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const query = new URLSearchParams({
    select: COMMENT_SELECT,
    post_slug: `eq.${slug}`,
    status: "eq.visible",
    order: "created_at.asc",
    limit: "500",
  });
  try {
    const res = await fetch(`${url}/rest/v1/comments?${query}`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: COMMENTS_REVALIDATE_SECONDS, tags: [`comments:${slug}`] },
    });
    if (!res.ok) return null;
    return (await res.json()) as CommentRow[];
  } catch {
    return null;
  }
}
