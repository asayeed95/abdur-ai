import Link from "next/link";
import { requireAdmin } from "@/lib/admin/supabase";
import { configFromEnv } from "@/lib/publish";

export default async function AdminHome() {
  const { sb } = await requireAdmin();
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const [{ count: week }, { count: hidden }, isAdmin] = await Promise.all([
    sb.from("comments").select("id", { count: "exact", head: true }).gte("created_at", since),
    sb.from("comments").select("id", { count: "exact", head: true }).eq("status", "hidden"),
    sb.rpc("is_admin"),
  ]);
  const canWrite = Boolean(configFromEnv().token);
  const cards = [
    { href: "/admin/posts/new", label: "New draft", note: canWrite ? "Commits to drafts/<slug> and opens a draft PR" : "Dry run: no ABDUR_PUBLISH_GITHUB_TOKEN on this deployment" },
    { href: "/admin/posts", label: "Posts", note: "Published + drafts on main" },
    { href: "/admin/comments", label: "Comments", note: `${week ?? 0} in the last 7 days · ${hidden ?? 0} hidden` },
  ];
  return (
    <>
      <h1 className="font-display text-3xl mb-8">Admin</h1>
      {isAdmin.data !== true && (
        <p role="alert" className="mb-6 font-mono text-xs text-clay">
          This account is allowlisted for /admin but not in <code>public.admins</code>, so the database will refuse moderation.
        </p>
      )}
      <ul className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="block bg-surface border border-border rounded-lg p-5 hover:border-clay">
              <p className="font-display text-xl">{c.label}</p>
              <p className="font-mono text-[11px] text-meta mt-2">{c.note}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
