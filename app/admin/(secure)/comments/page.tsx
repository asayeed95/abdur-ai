import { requireAdmin } from "@/lib/admin/supabase";
import { ModerateButton } from "./ModerateButton";

type Row = {
  id: string; post_slug: string; content: string; status: "visible" | "hidden"; is_deleted: boolean;
  score: number; created_at: string; author: { handle: string } | null;
};

export default async function AdminComments() {
  const { sb } = await requireAdmin();
  // RLS shows hidden rows only to public.is_admin() accounts.
  const { data, error } = await sb
    .from("comments")
    .select("id,post_slug,content,status,is_deleted,score,created_at,author:profiles!comments_author_id_fkey(handle)")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <h1 className="font-display text-3xl mb-8">Comments</h1>
      {error && <p role="alert" className="font-mono text-xs text-clay">{error.message}</p>}
      {rows.length === 0 ? (
        <p className="text-sm text-meta">No comments yet.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((r) => (
            <li key={r.id} className={`py-4 flex gap-4 ${r.status === "hidden" ? "opacity-60" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-meta mb-1">
                  @{r.author?.handle ?? "?"} · <a className="hover:text-clay" href={`/writing/${r.post_slug}#c-${r.id}`} target="_blank" rel="noopener">{r.post_slug}</a> · {new Date(r.created_at).toLocaleString()} · score {r.score}
                  {r.status === "hidden" && <span className="text-clay"> · hidden</span>}
                </p>
                <p className="text-sm whitespace-pre-wrap break-words">{r.is_deleted ? <em className="text-meta">[deleted by author]</em> : r.content}</p>
              </div>
              <ModerateButton id={r.id} status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
