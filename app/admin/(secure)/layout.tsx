import Link from "next/link";
import { requireAdmin } from "@/lib/admin/supabase";

export const dynamic = "force-dynamic";

export default async function SecureAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <>
      <header className="border-b border-border">
        <nav className="max-w-content mx-auto px-6 h-14 flex items-center gap-6 font-mono text-[11px] tracking-widest uppercase text-meta">
          <Link href="/admin" className="text-text">
            abdur.ai <span className="text-clay">///</span> admin
          </Link>
          <Link href="/admin/posts" className="hover:text-text">Posts</Link>
          <Link href="/admin/posts/new" className="hover:text-text">New draft</Link>
          <Link href="/admin/comments" className="hover:text-text">Comments</Link>
          <span className="ml-auto normal-case tracking-normal">{user.email}</span>
        </nav>
      </header>
      <main className="max-w-content mx-auto px-6 py-10">{children}</main>
    </>
  );
}
