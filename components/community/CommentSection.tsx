"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Session } from "@supabase/supabase-js";
import {
  buildTree,
  COMMENT_SELECT,
  communityClient,
  friendlyError,
  type CommentNode,
  type CommentRow,
} from "@/lib/community";
import { trackEvent } from "@/lib/analytics";

const MAX = 5000;

/**
 * Threaded discussion under a post (AGE-2972). Renders only on posts that opt
 * in with `comments: true`. Reading needs no account; posting, voting,
 * editing and deleting need a sign-in. The database (RLS + triggers) is the
 * authority — this component only shows optimistic state and reconciles it
 * with what the server returns.
 */
export function CommentSection({ slug }: { slug: string }) {
  const sb = communityClient();
  const [rows, setRows] = useState<CommentRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, 1 | -1>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("post_slug", slug)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) {
      setLoadError(true);
      return;
    }
    setRows((data ?? []) as unknown as CommentRow[]);
  }, [sb, slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!sb || !userId || !rows?.length) {
      setMyVotes({});
      return;
    }
    sb.from("comment_votes")
      .select("comment_id,vote")
      .in("comment_id", rows.map((r) => r.id))
      .then(({ data }) => {
        const v: Record<string, 1 | -1> = {};
        for (const x of data ?? []) v[x.comment_id as string] = x.vote as 1 | -1;
        setMyVotes(v);
      });
  }, [sb, userId, rows]);

  const tree = useMemo(() => (rows ? buildTree(rows) : []), [rows]);
  const count = rows?.filter((r) => !r.is_deleted).length ?? 0;

  const post = async (content: string, parentId: string | null): Promise<boolean> => {
    if (!sb || !userId) return false;
    const { data, error } = await sb
      .from("comments")
      .insert({ post_slug: slug, author_id: userId, content, parent_id: parentId })
      .select(COMMENT_SELECT)
      .single();
    if (error) {
      setNotice(friendlyError(error.message));
      return false;
    }
    setRows((rs) => [...(rs ?? []), data as unknown as CommentRow]);
    trackEvent("community:comment", { slug, kind: parentId ? "reply" : "top" });
    return true;
  };

  const vote = async (c: CommentRow, dir: 1 | -1) => {
    if (!sb || !userId) return;
    const prev = myVotes[c.id];
    const next = prev === dir ? undefined : dir;
    const delta = (next ?? 0) - (prev ?? 0);
    // Optimistic: move the score and the arrow now, reconcile below.
    setMyVotes((v) => {
      const copy = { ...v };
      if (next) copy[c.id] = next;
      else delete copy[c.id];
      return copy;
    });
    setRows((rs) => rs?.map((r) => (r.id === c.id ? { ...r, score: r.score + delta } : r)) ?? rs);
    const q =
      next === undefined
        ? sb.from("comment_votes").delete().eq("user_id", userId).eq("comment_id", c.id)
        : prev
          ? sb.from("comment_votes").update({ vote: next }).eq("user_id", userId).eq("comment_id", c.id)
          : sb.from("comment_votes").insert({ user_id: userId, comment_id: c.id, vote: next });
    const { error } = await q;
    // Server score is the truth either way (other readers vote too).
    const { data } = await sb.from("comments").select("score").eq("id", c.id).maybeSingle();
    if (error) {
      setMyVotes((v) => {
        const copy = { ...v };
        if (prev) copy[c.id] = prev;
        else delete copy[c.id];
        return copy;
      });
      setNotice(friendlyError(error.message));
    } else {
      trackEvent("community:vote", { slug, dir: next === undefined ? "retract" : next > 0 ? "up" : "down" });
    }
    if (data) setRows((rs) => rs?.map((r) => (r.id === c.id ? { ...r, score: data.score as number } : r)) ?? rs);
  };

  const edit = async (c: CommentRow, content: string): Promise<boolean> => {
    if (!sb) return false;
    const { data, error } = await sb.from("comments").update({ content }).eq("id", c.id).select(COMMENT_SELECT).single();
    if (error) {
      setNotice(friendlyError(error.message));
      return false;
    }
    setRows((rs) => rs?.map((r) => (r.id === c.id ? (data as unknown as CommentRow) : r)) ?? rs);
    return true;
  };

  const remove = async (c: CommentRow) => {
    if (!sb || !window.confirm("Delete this comment? Replies stay, your text goes.")) return;
    const { error } = await sb.from("comments").update({ is_deleted: true }).eq("id", c.id);
    if (error) setNotice(friendlyError(error.message));
    else setRows((rs) => rs?.map((r) => (r.id === c.id ? { ...r, is_deleted: true, content: "" } : r)) ?? rs);
  };

  return (
    <section aria-labelledby="discussion" className="max-w-prose mx-auto mt-20 pt-8 border-t border-border">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <h2 id="discussion" className="font-display text-2xl text-text">
          Discussion{rows ? <span className="font-mono text-sm text-meta ml-3">{count}</span> : null}
        </h2>
        {session && sb ? (
          <button
            type="button"
            onClick={() => sb.auth.signOut()}
            className="font-mono text-[11px] tracking-widest uppercase text-meta hover:text-text cursor-pointer"
          >
            Sign out
          </button>
        ) : null}
      </div>

      {!sb ? (
        <p className="text-sm text-meta">Comments are not available right now.</p>
      ) : (
        <>
          {notice && (
            <p role="alert" className="mb-4 font-mono text-xs text-clay">
              {notice}{" "}
              <button type="button" className="underline cursor-pointer" onClick={() => setNotice(null)}>
                dismiss
              </button>
            </p>
          )}

          {session ? <Composer onSubmit={(t) => post(t, null)} label="Add to the discussion" /> : <SignIn />}

          {loadError ? (
            <p className="mt-8 text-sm text-meta">Couldn&apos;t load the discussion. Refresh to try again.</p>
          ) : rows === null ? (
            <p className="mt-8 font-mono text-xs text-meta">Loading…</p>
          ) : tree.length === 0 ? (
            <p className="mt-8 text-sm text-meta">No comments yet. Questions, corrections and war stories are welcome.</p>
          ) : (
            <ol className="mt-8 space-y-6">
              {tree.map((n) => (
                <Comment
                  key={n.id}
                  node={n}
                  userId={userId}
                  myVotes={myVotes}
                  onVote={vote}
                  onReply={post}
                  onEdit={edit}
                  onDelete={remove}
                />
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}

function Comment({
  node,
  userId,
  myVotes,
  onVote,
  onReply,
  onEdit,
  onDelete,
}: {
  node: CommentNode;
  userId: string | null;
  myVotes: Record<string, 1 | -1>;
  onVote: (c: CommentRow, dir: 1 | -1) => void;
  onReply: (content: string, parentId: string) => Promise<boolean>;
  onEdit: (c: CommentRow, content: string) => Promise<boolean>;
  onDelete: (c: CommentRow) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const mine = userId !== null && node.author_id === userId;
  const v = myVotes[node.id];
  const when = new Date(node.created_at);
  const arrow = (dir: 1 | -1) =>
    `font-mono text-xs leading-none px-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
      v === dir ? "text-clay" : "text-meta hover:text-text"
    }`;

  return (
    <li id={`c-${node.id}`}>
      <div className="flex gap-3">
        <div className="flex flex-col items-center pt-0.5 min-w-[1.75rem]" aria-label={`Score ${node.score}`}>
          <button
            type="button"
            className={arrow(1)}
            aria-label="Upvote"
            aria-pressed={v === 1}
            disabled={!userId || node.is_deleted}
            title={userId ? undefined : "Sign in to vote"}
            onClick={() => onVote(node, 1)}
          >
            ▲
          </button>
          <span className="font-mono text-xs text-text">{node.score}</span>
          <button
            type="button"
            className={arrow(-1)}
            aria-label="Downvote"
            aria-pressed={v === -1}
            disabled={!userId || node.is_deleted}
            title={userId ? undefined : "Sign in to vote"}
            onClick={() => onVote(node, -1)}
          >
            ▼
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] text-meta mb-1.5">
            {node.is_deleted ? (
              "[deleted]"
            ) : (
              <>
                <span className="text-text">{node.author?.display_name ?? "reader"}</span>{" "}
                <span>@{node.author?.handle ?? "unknown"}</span>
              </>
            )}{" "}
            · <time dateTime={node.created_at}>{when.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>
            {node.edited_at && !node.is_deleted ? " · edited" : ""}
          </p>

          {node.is_deleted ? (
            <p className="text-sm text-meta italic">This comment was deleted.</p>
          ) : editing ? (
            <Composer
              initial={node.content}
              label="Edit comment"
              submitLabel="Save"
              onCancel={() => setEditing(false)}
              onSubmit={async (t) => {
                const ok = await onEdit(node, t);
                if (ok) setEditing(false);
                return ok;
              }}
            />
          ) : (
            <Markdown text={node.content} />
          )}

          {!node.is_deleted && !editing && (
            <div className="flex gap-4 mt-2 font-mono text-[11px] tracking-wide uppercase text-meta">
              {userId && node.depth < 6 && (
                <button type="button" className="hover:text-text cursor-pointer" onClick={() => setReplying((r) => !r)}>
                  {replying ? "Cancel" : "Reply"}
                </button>
              )}
              {mine && (
                <>
                  <button type="button" className="hover:text-text cursor-pointer" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                  <button type="button" className="hover:text-clay cursor-pointer" onClick={() => onDelete(node)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-3">
              <Composer
                label={`Reply to @${node.author?.handle ?? "reader"}`}
                submitLabel="Reply"
                autoFocus
                onCancel={() => setReplying(false)}
                onSubmit={async (t) => {
                  const ok = await onReply(t, node.id);
                  if (ok) setReplying(false);
                  return ok;
                }}
              />
            </div>
          )}

          {node.children.length > 0 && (
            <ol className="mt-5 space-y-5 pl-3 sm:pl-4 border-l border-border">
              {node.children.map((c) => (
                <Comment
                  key={c.id}
                  node={c}
                  userId={userId}
                  myVotes={myVotes}
                  onVote={onVote}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </ol>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Comment markdown: GFM, no raw HTML (react-markdown never renders it without
 * rehype-raw), no images (no tracking pixels or hotlinked junk), and links
 * that cannot be used to buy PageRank or take over the opener.
 */
function Markdown({ text }: { text: string }) {
  return (
    <div className="prose-clay text-[15px] break-words [&_pre]:overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={["img"]}
        unwrapDisallowed
        components={{
          a: ({ href, children }) => (
            <a href={href} rel="nofollow ugc noopener noreferrer" target="_blank">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function Composer({
  onSubmit,
  label,
  initial = "",
  submitLabel = "Post",
  onCancel,
  autoFocus,
}: {
  onSubmit: (text: string) => Promise<boolean>;
  label: string;
  initial?: string;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const trimmed = text.trim();
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!trimmed || busy) return;
        setBusy(true);
        const ok = await onSubmit(trimmed);
        setBusy(false);
        if (ok && !initial) setText("");
      }}
    >
      <label className="sr-only" htmlFor={`composer-${label}`}>
        {label}
      </label>
      <textarea
        id={`composer-${label}`}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX))}
        placeholder={label}
        rows={3}
        autoFocus={autoFocus}
        className="w-full bg-surface border border-border rounded-sm p-3 text-sm text-text placeholder:text-meta focus:outline-none focus:border-clay"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!trimmed || busy}
          className="font-mono text-[11px] tracking-widest uppercase text-bg bg-clay px-4 py-2 rounded-sm hover:opacity-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? "…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="font-mono text-[11px] uppercase text-meta hover:text-text cursor-pointer">
            Cancel
          </button>
        )}
        <span className="ml-auto font-mono text-[10px] text-meta">Markdown · {text.length}/{MAX}</span>
      </div>
    </form>
  );
}

function SignIn() {
  const sb = communityClient();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  if (!sb) return null;
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}#discussion` : undefined;

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <p className="text-sm text-text mb-4">Sign in to comment and vote. Reading is open to everyone.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          className="font-mono text-[11px] tracking-widest uppercase border border-border text-text px-4 py-2.5 rounded-sm hover:border-clay cursor-pointer"
          onClick={async () => {
            trackEvent("community:signin", { method: "github" });
            const { error } = await sb.auth.signInWithOAuth({ provider: "github", options: { redirectTo } });
            if (error) {
              setState("error");
              setMsg(friendlyError(error.message));
            }
          }}
        >
          Continue with GitHub
        </button>
        <form
          className="flex flex-1 gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("sending");
            trackEvent("community:signin", { method: "email" });
            const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
            if (error) {
              setState("error");
              setMsg(friendlyError(error.message));
            } else setState("sent");
          }}
        >
          <label htmlFor="community-email" className="sr-only">
            Email
          </label>
          <input
            id="community-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="min-w-0 flex-1 bg-bg border border-border rounded-sm px-3 py-2 text-sm text-text placeholder:text-meta focus:outline-none focus:border-clay"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="font-mono text-[11px] tracking-widest uppercase text-bg bg-clay px-4 py-2 rounded-sm hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            Email link
          </button>
        </form>
      </div>
      <p aria-live="polite" className="mt-3 font-mono text-[11px] text-meta">
        {state === "sent"
          ? "Check your inbox for a sign-in link."
          : state === "error"
            ? msg
            : "Signing in does not subscribe you to the newsletter."}
      </p>
    </div>
  );
}
