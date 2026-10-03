import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/supabase";
import { configFromEnv, Publisher } from "@/lib/publish";
import { parseDraft, SLUG_RE } from "@/lib/publish/draft";
import { Editor } from "../Editor";

export default async function EditDraft({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) notFound();
  const found = await new Publisher(configFromEnv()).getPost(slug).catch(() => null);
  if (!found) notFound();
  if (!found.path.includes("/_drafts/")) {
    return (
      <p className="text-sm text-meta">
        <code>{slug}</code> is already published. Edit published posts in the repo so the diff gets a normal review.
      </p>
    );
  }
  return (
    <>
      <h1 className="font-display text-3xl mb-2">Edit draft</h1>
      <p className="font-mono text-[11px] text-meta mb-8">from <code>{found.ref}</code>: {found.path}</p>
      <Editor mode="update" initial={{ ...parseDraft(found.raw), slug }} />
    </>
  );
}
