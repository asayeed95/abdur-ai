import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "AI TLDR — the logbook",
  description:
    "Short, evidence-anchored builder logs from Abdur Rahman Sayeed. Postmortems, architecture decisions, and the things you only learn by shipping AI solo.",
  alternates: { canonical: "https://abdur.ai/aitldr" },
};

export default function FeedPage() {
  const posts = getAllPosts();
  const flagship = posts.find((p) => p.flagship);
  const rest = posts.filter((p) => !p.flagship || p.pinned === false);

  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-24">
        <p className="eyebrow mb-4">/// AITLDR</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight text-text mb-4">
          The logbook.
        </h1>
        <p className="text-muted text-lg max-w-[640px] mb-16">
          {posts.length} {posts.length === 1 ? "entry" : "entries"} · evidence-anchored builder logs · RSS available.
        </p>

        {flagship && (
          <Link
            href={`/aitldr/${flagship.slug}`}
            className="group block bg-bg-2 border border-clay rounded-lg p-8 md:p-10 mb-16 hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="font-mono text-[10px] tracking-widest uppercase text-bg bg-clay px-2 py-1 rounded-sm">
                FLAGSHIP · PINNED
              </span>
              <span className="font-mono text-xs text-muted">
                {flagship.dateDisplay} · {flagship.readingTime} MIN
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl tracking-tight text-text group-hover:text-clay transition-colors mb-4">
              {flagship.title}
            </h2>
            {flagship.dek && (
              <p className="text-lg text-muted leading-relaxed max-w-[68ch] mb-5">
                {flagship.dek}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-5">
              {flagship.tags?.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] tracking-wider uppercase text-muted-2"
                >
                  #{t}
                </span>
              ))}
            </div>
          </Link>
        )}

        <ul className="divide-y divide-border border-y border-border">
          {rest.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/aitldr/${p.slug}`}
                className="group block py-7 md:py-9 hover:bg-surface transition-colors -mx-3 px-3 rounded-sm"
              >
                <div className="grid md:grid-cols-[110px_1fr_70px] gap-2 md:gap-8 items-start">
                  <span className="font-mono text-xs tracking-widest text-clay uppercase pt-1">
                    {p.dateDisplay}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl md:text-3xl tracking-tight text-text group-hover:text-clay transition-colors">
                      {p.title}
                    </h3>
                    {p.dek && (
                      <p className="text-base text-muted leading-relaxed mt-2 max-w-[60ch]">
                        {p.dek}
                      </p>
                    )}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="font-mono text-[10px] tracking-wider uppercase text-muted-2"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="justify-self-end font-mono text-[10px] tracking-wider text-muted-3 pt-2">
                    {p.readingTime} MIN
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 font-mono text-xs text-muted-3">
          Subscribe via{" "}
          <Link href="/aitldr/rss.xml" className="hover:text-clay">RSS</Link>{" "}
          ·{" "}
          <Link href="#subscribe" className="hover:text-clay">email</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
