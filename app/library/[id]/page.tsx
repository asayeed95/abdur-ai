import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AssetRequestForm } from "@/components/library/AssetRequestForm";
import { DraftBanner } from "@/components/library/DraftBanner";
import { LibraryMarkdown } from "@/components/library/LibraryMarkdown";
import { getAsset, isVisible, libraryPath, type LibraryAsset } from "@/lib/library";
import { getLibrarySource } from "@/lib/library-content";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

function visibleAsset(id: string): LibraryAsset | undefined {
  const asset = getAsset(id);
  return asset && isVisible(asset) ? asset : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const asset = visibleAsset((await params).id);
  if (!asset) return {};
  return {
    title: asset.title,
    description: asset.summary,
    alternates: { canonical: `${SITE.url}${libraryPath(asset.id)}` },
    robots: asset.status === "available" ? { index: true, follow: true } : { index: false, follow: false },
  };
}

/**
 * What a no-JS request reports back: /api/library answers a native form post
 * with a 303 to this page and `?sent=1` or `?error=<kind>`.
 */
const NOTICES = {
  sent: { tone: "ok", text: "Sent. Check your inbox." },
  invalid: { tone: "err", text: "That email address doesn't look right. Check it and try again." },
  unavailable: { tone: "err", text: "Sending is unavailable right now. Please try again in a few minutes." },
} as const;

export default async function LibraryAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const asset = visibleAsset((await params).id);
  const source = asset ? getLibrarySource(asset.id) : null;
  if (!asset || !source) notFound();
  const q = await searchParams;
  const notice =
    q.sent === "1"
      ? NOTICES.sent
      : q.error === "invalid" || q.error === "unavailable"
        ? NOTICES[q.error]
        : null;

  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-28 pb-24">
        {asset.status === "draft" && <DraftBanner />}
        <p className="eyebrow mb-4">
          <Link href="/library">/// FREE LIBRARY</Link>
        </p>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-4">{asset.title}</h1>
        <p className="text-meta text-lg max-w-[640px] mb-8">{asset.summary}</p>

        <section aria-labelledby="request-heading" className="bg-band border border-border rounded-lg p-6 md:p-8 mb-16">
          <h2 id="request-heading" className="font-mono text-[10px] tracking-widest uppercase text-clay mb-4">
            /// What you get
          </h2>
          <ul className="text-text-soft leading-relaxed mb-6 list-disc pl-5 space-y-1">
            {asset.inside.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {notice && (
            <p
              role="status"
              className={`mb-4 font-mono text-sm ${notice.tone === "ok" ? "text-good-text" : "text-clay"}`}
            >
              {notice.text}
            </p>
          )}
          <AssetRequestForm assetId={asset.id} cta={asset.cta} />
        </section>

        <section aria-labelledby="preview-heading">
          <h2 id="preview-heading" className="font-mono text-[10px] tracking-widest uppercase text-meta mb-6">
            /// Preview
          </h2>
          <LibraryMarkdown source={source.preview} />
          <p className="mt-10 text-meta max-w-prose">
            The full version comes by email, with an editable Markdown copy.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
