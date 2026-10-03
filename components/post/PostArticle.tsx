import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { MnemixCTA, AsecWaitlistCTA, NewsletterCTA } from "@/components/post/LeadMagnets";
import { ReceiptsBlock } from "@/components/post/ReceiptsBlock";
import { PatternsBlock } from "@/components/post/PatternsBlock";
import { RegisterBadge, RegisterNote } from "@/components/post/RegisterNote";
import { PostActions } from "@/components/post/PostActions";
import { agentPreamble, embedUrl, markdownTwinPath } from "@/lib/legibility";
import { postPath, resolveRelated, type PostMeta } from "@/lib/posts";
import { ogImageForPost } from "@/lib/og";
import { SITE } from "@/lib/site";

/**
 * The whole post surface, rendered identically at `/writing/<slug>` (canonical)
 * and `/aitldr/<slug>` (retained). Both routes call this one component, so the
 * two URLs cannot drift apart in content — only the `<link rel="canonical">`
 * each route emits differs, and every internal link below points at the
 * canonical base regardless of which URL the reader arrived on.
 */
export function PostArticle({
  post,
  source,
  prev,
  next,
}: {
  post: PostMeta;
  source: string;
  prev: PostMeta | null;
  next: PostMeta | null;
}) {
  const canonical = `${SITE.url}${postPath(post.slug)}`;
  const related = resolveRelated(post);
  const isPartOf = [
    {
      "@type": "Blog",
      "@id": `${SITE.url}/writing#blog`,
      name: "abdur.ai writing",
      url: `${SITE.url}/writing`,
    },
    ...(post.series
      ? [{ "@type": "CreativeWorkSeries", name: post.series, url: `${SITE.url}/writing` }]
      : []),
  ];

  return (
    <article className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": `${canonical}#post`,
            headline: post.title,
            description: post.description,
            image: ogImageForPost(post).url,
            datePublished: post.date,
            dateModified: post.updated || post.date,
            wordCount: post.wordCount,
            timeRequired: `PT${post.readingTime}M`,
            inLanguage: "en-US",
            articleSection: post.section,
            keywords: post.tags,
            author: { "@id": `${SITE.url}/#abdur` },
            publisher: { "@id": `${SITE.url}/#abdur` },
            mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
            url: canonical,
            isPartOf,
            ...(post.citation ? { citation: post.citation } : {}),
            ...(related.length
              ? { relatedLink: related.map((item) => `${SITE.url}${postPath(item.slug)}`) }
              : {}),
          }),
        }}
      />

      <header className="max-w-prose mx-auto">
        {post.series ? (
          <p className="font-mono text-[10px] tracking-widest uppercase text-clay mb-3">
            {post.series}
          </p>
        ) : null}
        <p className="eyebrow mb-6">{(post.tags || []).slice(0, 4).join(" · ")}</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight text-text leading-[1.04] mb-6">
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="font-display italic text-xl md:text-2xl text-meta mb-6">
            {post.subtitle}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-meta">
          <RegisterBadge register={post.register} />
          <span>{post.dateDisplay}</span>
          <span>·</span>
          <span>{post.readingTime} min read</span>
          <span>·</span>
          <span>by {post.author}</span>
        </div>
        <div className="w-[60px] h-[2px] bg-clay mt-8" />
        <RegisterNote register={post.register} note={post.statusNote} />
      </header>

      <PostActions
        slug={post.slug}
        title={post.title}
        canonical={canonical}
        markdownUrl={markdownTwinPath(post.slug)}
        embedUrl={embedUrl(post.slug)}
        agentPreamble={agentPreamble(post)}
      />

      <div className="prose-clay max-w-prose mx-auto mt-12">
        <MDXRemote
          source={source}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug],
            },
          }}
          components={{
            MnemixCTA,
            AsecWaitlistCTA,
            NewsletterCTA,
            ReceiptsBlock: () =>
              post.receipts ? <ReceiptsBlock items={post.receipts} /> : null,
            PatternsBlock: () =>
              post.patterns ? <PatternsBlock items={post.patterns} /> : null,
          }}
        />
      </div>

      {(post.citation || related.length > 0) && (
        <footer className="max-w-prose mx-auto mt-16 pt-8 border-t border-border space-y-8">
          {post.citation ? (
            <div>
              <p className="eyebrow mb-3">Preferred citation</p>
              <p className="font-mono text-sm text-muted">{post.citation}</p>
            </div>
          ) : null}
          {related.length > 0 ? (
            <div>
              <p className="eyebrow mb-3">Related</p>
              <ul className="space-y-2">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link href={postPath(item.slug)} className="text-text hover:text-clay">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </footer>
      )}

      <nav aria-label="Previous and next post" className="max-w-prose mx-auto mt-20 pt-8 border-t border-border grid sm:grid-cols-2 gap-6">
        {prev ? (
          <Link
            href={postPath(prev.slug)}
            className="group block bg-surface border border-border rounded-lg p-5 hover:border-clay transition-colors"
          >
            <p className="font-mono text-[10px] tracking-widest uppercase text-meta mb-2">
              ← Previous
            </p>
            <p className="font-display text-lg text-text group-hover:text-clay transition-colors leading-tight">
              {prev.title}
            </p>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={postPath(next.slug)}
            className="group block bg-surface border border-border rounded-lg p-5 hover:border-clay transition-colors text-right"
          >
            <p className="font-mono text-[10px] tracking-widest uppercase text-meta mb-2">
              Next →
            </p>
            <p className="font-display text-lg text-text group-hover:text-clay transition-colors leading-tight">
              {next.title}
            </p>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}
