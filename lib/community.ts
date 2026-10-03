"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser client for the community database (Supabase project `abdur-ai`,
 * AGE-2972) — deliberately a different project from the `northsun` one that
 * lib/supabase.ts talks to server-side. Only the publishable key ships to the
 * browser; every rule (who may post, edit, vote; what anon may read) lives in
 * Postgres RLS + triggers, see supabase/community/migrations/.
 *
 * Returns null when the env is not configured, so a post with comments
 * enabled degrades to "comments unavailable" instead of crashing.
 */
let client: SupabaseClient | null | undefined;

export function communityClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_PUBLISHABLE_KEY;
  client =
    url && key
      ? createClient(url, key, {
          auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        })
      : null;
  return client;
}

export type CommentAuthor = { handle: string; display_name: string; avatar_url: string | null };

export type CommentRow = {
  id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  depth: number;
  score: number;
  is_deleted: boolean;
  created_at: string;
  edited_at: string | null;
  author: CommentAuthor | null;
};

export const COMMENT_SELECT =
  "id,parent_id,author_id,content,depth,score,is_deleted,created_at,edited_at,author:profiles!comments_author_id_fkey(handle,display_name,avatar_url)";

export type CommentNode = CommentRow & { children: CommentNode[] };

/**
 * Flat rows → tree. Siblings rank by score, then oldest first (an early good
 * answer keeps its place). Orphans — a reply whose parent was hidden by
 * moderation — are dropped with their parent rather than floating to the top.
 */
export function buildTree(rows: CommentRow[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  for (const r of rows) byId.set(r.id, { ...r, children: [] });
  const roots: CommentNode[] = [];
  for (const node of byId.values()) {
    if (!node.parent_id) roots.push(node);
    else byId.get(node.parent_id)?.children.push(node);
  }
  const sort = (xs: CommentNode[]) => {
    xs.sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
    xs.forEach((x) => sort(x.children));
    return xs;
  };
  return sort(roots);
}

/** Postgres error → a sentence a reader can act on. */
export function friendlyError(message: string | undefined): string {
  const m = message ?? "";
  if (/slow down/i.test(m)) return "Slow down — at most 8 comments per 10 minutes.";
  if (/too deep/i.test(m)) return "This thread is as deep as it goes. Reply higher up.";
  if (/empty/i.test(m)) return "Write something first.";
  if (/provider is not enabled/i.test(m)) return "That sign-in method isn't switched on yet. Try email.";
  if (/rate limit/i.test(m)) return "Too many sign-in emails right now. Try again in a little while.";
  return "Something went wrong. Please try again.";
}
