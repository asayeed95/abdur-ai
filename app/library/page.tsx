import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getVisibleAssets, libraryPath } from "@/lib/library";
import { SITE } from "@/lib/site";

// Visibility depends on the asset's status and, on preview builds, on
// LIBRARY_PREVIEW, so the page is decided per request rather than at build.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  // Indexable only once something approved is on it; a preview build that
  // shows nothing but drafts stays out of search.
  const approved = getVisibleAssets().some((a) => a.status === "available");
  return {
    title: "Free library",
    description: "Free workbooks from the abdur.ai logbook, sent by email.",
    alternates: { canonical: `${SITE.url}/library` },
    robots: approved ? { index: true, follow: true } : { index: false, follow: false },
  };
}

/** A no-JS request with an id we don't know lands here (/library?error=invalid). */
export default async function LibraryIndex({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const assets = getVisibleAssets();
  if (assets.length === 0) notFound();
  const { error } = await searchParams;

  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-28 pb-24">
        <p className="eyebrow mb-4">/// FREE LIBRARY</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-3">Free, by email.</h1>
        <p className="text-meta text-lg max-w-[640px] mb-12">
          Workbooks built from the logbook&apos;s postmortems. Each one is sent to your inbox; joining the list is a
          separate, optional box.
        </p>
        {error === "invalid" && (
          <p role="status" className="mb-8 font-mono text-sm text-clay">
            That item isn&apos;t available. Pick one below.
          </p>
        )}
        <div className="grid md:grid-cols-3 gap-4">
          {assets.map((a) => (
            <Link
              key={a.id}
              href={libraryPath(a.id)}
              className="flex flex-col bg-surface border border-border rounded-lg p-6 hover:border-clay transition-colors"
            >
              <span className="font-mono text-[10px] tracking-wider uppercase text-meta mb-3">
                {a.status === "draft" ? "Draft preview" : "Free · by email"}
              </span>
              <span className="font-display text-2xl text-text mb-3">{a.title}</span>
              <span className="text-sm text-meta leading-relaxed">{a.summary}</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
