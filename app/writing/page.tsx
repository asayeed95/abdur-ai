import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RegisterBadge } from "@/components/post/RegisterNote";
import { getAllPosts, postPath } from "@/lib/posts";
import { REGISTERS, REGISTER_SPEC } from "@/lib/registers";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Evidence-anchored builder logs, designs, and arguments from Abdur Rahman Sayeed. Every piece declares whether it is reported, designed, or argued.",
  alternates: { canonical: `${SITE.url}/writing` },
};

export default function WritingIndexPage() {
  const posts = getAllPosts();
  const flagship = posts.find((p) => p.flagship);
  const rest = posts.filter((p) => p.slug !== flagship?.slug);

  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-24">
        <p className="eyebrow mb-4">/// WRITING</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight text-text mb-4">
          Writing.
        </h1>
        <p className="text-muted text-lg max-w-[640px] mb-8">
          {posts.length} {posts.length === 1 ? "piece" : "pieces"} · every one
          declares what kind of claim it is making ·{" "}
          <Link href="/writing/rss.xml" className="hover:text-clay underline underline-offset-4">
            RSS
          </Link>
        </p>

        <dl className="flex flex-wrap gap-x-8 gap-y-3 mb-16 pb-8 border-b border-border">
          {REGISTERS.map((r) => (
            <div key={r} className="flex items-center gap-3">
              <dt>
                <RegisterBadge register={r} />
              </dt>
              <dd className="font-mono text-[11px] text-muted-3">
                {REGISTER_SPEC[r].claim}
              </dd>
            </div>
          ))}
        </dl>

        {flagship && (
          <Link
            href={postPath(flagship.slug)}
            className="group block bg-bg-2 border border-clay rounded-lg p-8 md:p-10 mb-16 hover:bg-surface transition-colors"
          >
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="font-mono text-[10px] tracking-widest uppercase text-bg bg-clay px-2 py-1 rounded-sm">
                FLAGSHIP
              </span>
              <RegisterBadge register={flagship.register} />
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
                href={postPath(p.slug)}
                className="group block py-7 md:py-9 hover:bg-surface transition-colors -mx-3 px-3 rounded-sm"
              >
                <div className="grid md:grid-cols-[110px_1fr_70px] gap-2 md:gap-8 items-start">
                  <span className="font-mono text-xs tracking-widest text-clay uppercase pt-1">
                    {p.dateDisplay}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <RegisterBadge register={p.register} />
                      {p.statusNote && (
                        <span className="font-mono text-[10px] text-muted-3">
                          {p.statusNote}
                        </span>
                      )}
                    </div>
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
      </main>
      <Footer />
    </>
  );
}
