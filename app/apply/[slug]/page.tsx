import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { loadApplication, listApplicationSlugs } from "@/lib/applications";

/**
 * Curated per-application microsite: one page per top-priority job
 * application, rendered entirely from content/applications/<slug>.json.
 * Unlisted by design — every page is noindex; the URL travels only inside
 * the application itself.
 */

export function generateStaticParams() {
  return listApplicationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = loadApplication(slug);
  if (!app) return { robots: { index: false, follow: false } };
  return {
    title: `${app.company} × Abdur — ${app.role}`,
    description: `A curated application: ${app.role} at ${app.company}. Built as a working sample of the job itself.`,
    robots: { index: false, follow: false },
  };
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = loadApplication(slug);
  if (!app) notFound();

  const accent = app.brand.accent;

  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-24">
        {/* Hero */}
        <p className="eyebrow mb-4">
          /// {app.company.toUpperCase()} × ABDUR — {app.role.toUpperCase()}
        </p>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-6 max-w-[20ch]">
          {app.hero.headline}
        </h1>
        <p className="text-muted text-xl leading-relaxed max-w-[640px] mb-4">
          {app.hero.subline}
        </p>
        {app.brand.tagline ? (
          <p className="text-sm text-text-soft mb-12">
            <span
              className="inline-block rounded-full border px-3 py-1"
              style={{ borderColor: accent, color: accent }}
            >
              {app.brand.tagline}
            </span>
          </p>
        ) : (
          <div className="mb-12" />
        )}

        {/* Fit map */}
        <section className="max-w-prose">
          <h2 className="font-display text-3xl text-text pt-2 mb-2">
            Your job description, already running.
          </h2>
          <p className="text-muted mb-8">
            Each row pairs a line from the role with something I already ship —
            not something I plan to learn.
          </p>
          <div className="space-y-8">
            {app.fitMap.map((row, i) => (
              <div
                key={i}
                className="border-l-2 pl-5"
                style={{ borderColor: accent }}
              >
                <p className="text-sm uppercase tracking-wide text-text-soft mb-2">
                  You need
                </p>
                <p className="text-text text-lg leading-relaxed mb-3">
                  {row.theirNeed}
                </p>
                <p className="text-sm uppercase tracking-wide text-text-soft mb-2">
                  I already do
                </p>
                <p className="text-text-soft text-lg leading-relaxed">
                  {row.myProof}
                  {row.link ? (
                    <>
                      {" "}
                      <a href={row.link} className="text-clay">
                        proof →
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Culture chips */}
        {app.cultureChips.length > 0 && (
          <section className="max-w-prose mt-16">
            <h2 className="font-display text-3xl text-text mb-6">
              On your terms, literally.
            </h2>
            <div className="flex flex-wrap gap-3">
              {app.cultureChips.map((chip, i) => (
                <span
                  key={i}
                  className="rounded-full border border-white/10 px-4 py-2 text-text-soft text-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Autonomy band — condensed from /hire */}
        {app.autonomyBand && (
          <section className="max-w-prose mt-16">
            <h2 className="font-display text-3xl text-text mb-4">
              Autonomy you can audit.
            </h2>
            <p className="text-text-soft text-lg leading-relaxed">
              I build AI agent teams that decide from evidence, review each
              other&apos;s work, and ship through gated, independently reviewed
              pipelines — every decision logged with its rejected alternatives
              and rollback path, humans escalated only for the calls that
              genuinely need one. This page was produced by that system:
              researched, written, gated, and reviewed by agents under a
              written operating doctrine, with one human approval at the end.
              The same discipline drops into support, finance, marketing, or
              engineering.
            </p>
          </section>
        )}

        {/* Closer */}
        <section className="max-w-prose mt-16">
          <h2 className="font-display text-3xl text-text mb-4">
            {app.closer.line}
          </h2>
          <p className="text-text-soft text-lg leading-relaxed mb-8">
            This page was built for {app.company} — it isn&apos;t a template
            blast. If it reads like I already work here, that&apos;s the point.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={`mailto:${app.closer.email}`}
              className="inline-block rounded-md px-5 py-3 text-sm font-medium text-black"
              style={{ backgroundColor: accent }}
            >
              Email me
            </a>
            {app.applyUrl ? (
              <a
                href={app.applyUrl}
                className="inline-block rounded-md border border-white/15 px-5 py-3 text-sm font-medium text-text"
              >
                The role at {app.company} →
              </a>
            ) : null}
            <a
              href="/hire"
              className="inline-block rounded-md border border-white/15 px-5 py-3 text-sm font-medium text-text-soft"
            >
              Full hire page →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
