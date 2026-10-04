import Link from "next/link";
import { requireAdmin } from "@/lib/admin/supabase";
import { configFromEnv, Publisher } from "@/lib/publish";
import { POST_BASE } from "@/lib/site";

export default async function AdminPosts() {
  await requireAdmin();
  let data: { published: string[]; drafts: string[]; inReview: string[] } | null = null;
  let error = "";
  try {
    data = await new Publisher(configFromEnv()).listPosts();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  return (
    <>
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-display text-3xl">Posts</h1>
        <Link href="/admin/posts/new" className="font-mono text-xs uppercase tracking-widest text-clay">+ New draft</Link>
      </div>
      {error ? (
        <p role="alert" className="font-mono text-xs text-clay">Could not list posts from GitHub: {error}</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <section className="md:col-span-2">
            <h2 className="eyebrow mb-3">In review: drafts/* branches ({data!.inReview.length})</h2>
            {data!.inReview.length === 0 ? (
              <p className="text-sm text-meta">None. Drafts you save here appear in this list until their PR is merged.</p>
            ) : (
              <ul className="space-y-2 font-mono text-sm">
                {data!.inReview.map((s) => (
                  <li key={s}><Link className="hover:text-clay" href={`/admin/posts/${s}`}>{s}</Link></li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="eyebrow mb-3">Drafts on main ({data!.drafts.length})</h2>
            <ul className="space-y-2 font-mono text-sm">
              {data!.drafts.map((s) => (
                <li key={s}><Link className="hover:text-clay" href={`/admin/posts/${s}`}>{s}</Link></li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="eyebrow mb-3">Published ({data!.published.length})</h2>
            <ul className="space-y-2 font-mono text-sm text-meta">
              {data!.published.map((s) => (
                <li key={s}><a className="hover:text-text" href={`${POST_BASE}/${s}`} target="_blank" rel="noopener">{s} ↗</a></li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
