import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { KitDownloads } from "@/components/KitDownloads";
import { KIT_PATH } from "@/lib/kit";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your Agent Reliability Kit",
  description: "Download links for the Agent Reliability Kit.",
  alternates: { canonical: `${SITE.url}${KIT_PATH}` },
  // The landing page is the indexable surface; this one only holds the links.
  robots: { index: false, follow: true },
};

/**
 * Where a no-JS kit signup lands: /api/subscribe answers a native form post
 * carrying `return_to=/kit` with a 303 here on success. The JS path reveals
 * the same <KitDownloads /> in place on /kit and never navigates here.
 */
export default function KitThanksPage() {
  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-24">
        <p className="eyebrow mb-4">/// Agent Reliability Kit</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-6">
          The kit is yours.
        </h1>
        <p role="status" className="font-mono text-sm text-good-text mb-10">
          You&apos;re on the list.
        </p>
        <div className="max-w-2xl">
          <KitDownloads />
        </div>
        <p className="mt-12 text-meta max-w-prose">
          Only have a minute? Start with the checklist. Or{" "}
          <Link href="/writing" className="text-text underline decoration-border underline-offset-4 hover:text-clay hover:decoration-clay">
            read the writing
          </Link>{" "}
          the kit came out of.
        </p>
      </main>
      <Footer />
    </>
  );
}
