import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { DraftBanner } from "@/components/library/DraftBanner";
import { LibraryMarkdown } from "@/components/library/LibraryMarkdown";
import { getAsset, isVisible, libraryPath } from "@/lib/library";
import { getLibrarySource } from "@/lib/library-content";
import { postPath } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * The full asset, linked from the delivery email. Print-friendly: site chrome
 * is hidden when printing. Not gated (email is capture, not DRM) but kept out
 * of search so readers land on the asset page with the request form.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const asset = getAsset((await params).id);
  if (!asset || !isVisible(asset)) return {};
  return {
    title: `${asset.title} (full workbook)`,
    alternates: { canonical: `${SITE.url}${libraryPath(asset.id)}` },
    robots: { index: false, follow: true },
  };
}

export default async function LibraryReadPage({ params }: { params: Promise<{ id: string }> }) {
  const asset = getAsset((await params).id);
  const source = asset && isVisible(asset) ? getLibrarySource(asset.id) : null;
  if (!asset || !source) notFound();

  return (
    <>
      <div className="print:hidden">
        <Nav />
      </div>
      <main className="max-w-content mx-auto px-6 md:px-10 pt-28 print:pt-0 pb-24">
        {asset.status === "draft" && <DraftBanner />}
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-text mb-3">{asset.title}</h1>
        <p className="font-mono text-xs text-meta mb-10">
          {source.version ?? ""}
          {source.updated ? ` · updated ${source.updated}` : ""} · {SITE.url.replace("https://", "")}
          {libraryPath(asset.id)}
        </p>
        <p className="mb-10 font-mono text-xs print:hidden">
          <a href={`${libraryPath(asset.id)}/workbook.md`} download className="underline hover:text-clay">
            Download the editable Markdown
          </a>
          <span className="text-meta"> · or print this page</span>
        </p>
        <LibraryMarkdown source={source.body} />
        {source.sources.length > 0 && (
          <p className="mt-12 text-sm text-meta max-w-prose print:hidden">
            Built from{" "}
            {source.sources.map((s, i) => (
              <span key={s.slug}>
                {i > 0 && (i === source.sources.length - 1 ? " and " : ", ")}
                <Link href={postPath(s.slug)} className="underline hover:text-clay">
                  {s.title}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
