import Link from "next/link";
import { Reveal } from "./Reveal";
import { getAllPosts } from "@/lib/posts";

/**
 * "Latest" section — top 5 TLDRs from MDX content. Dense list, editorial vibe.
 * Each row is a Link to /aitldr/[slug].
 */
export function LatestFeed() {
  const posts = getAllPosts().slice(0, 5);

  return (
    <Reveal
      as="section"
      id="latest"
      className="max-w-content mx-auto px-6 md:px-10 pt-28 md:pt-32 pb-20"
    >
      <p className="eyebrow mb-4">/// AITLDR · LATEST</p>
      <h2 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-12">
        Latest
      </h2>

      <ul className="divide-y divide-border border-y border-border">
        {posts.length === 0 && (
          <li className="py-8 text-muted font-mono text-sm">
            No posts yet. Drop MDX files in /content/posts.
          </li>
        )}
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/aitldr/${p.slug}`}
              className="group block py-6 md:py-8 hover:bg-surface transition-colors -mx-3 px-3 rounded-sm"
            >
              <div className="grid md:grid-cols-[100px_1fr] gap-2 md:gap-8 items-start">
                <span className="font-mono text-xs tracking-widest text-clay uppercase pt-1">
                  {p.date}
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
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link
          href="/aitldr"
          className="inline-block font-mono text-xs tracking-widest uppercase text-text border border-border hover:border-clay px-4 py-3 rounded-sm transition-colors"
        >
          Read the archive →
        </Link>
      </div>
    </Reveal>
  );
}
