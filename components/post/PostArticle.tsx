import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { MnemixCTA, AsecWaitlistCTA, NewsletterCTA } from "@/components/post/LeadMagnets";
import { PostSubscribe } from "@/components/post/PostSubscribe";
import { ReceiptsBlock } from "@/components/post/ReceiptsBlock";
import { PatternsBlock } from "@/components/post/PatternsBlock";
import { POST_VISUALS } from "@/components/post/mdx-components";
import { RegisterBadge, RegisterNote } from "@/components/post/RegisterNote";
import { postPath, type PostMeta } from "@/lib/posts";
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
            isPartOf: {
              "@type": "Blog",
              "@id": `${SITE.url}/writing#blog`,
              name: "abdur.ai writing",
              url: `${SITE.url}/writing`,
            },
          }),
        }}
      />

      <header className="max-w-prose mx-auto">
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

      {/* Long unbroken strings (inline-code paths, bare URLs in source ledgers,
          receipt notes) widened a 360 px page to as much as 549 px. Text may break
          inside a word that would overflow; links and inline code may break anywhere.
          Code blocks keep white-space: pre, so they never wrap and still scroll
          sideways in their own box. */}
      <div className="prose-clay max-w-prose mx-auto mt-12 break-words [&_a]:[overflow-wrap:anywhere] [&_:not(pre)>code]:[overflow-wrap:anywhere]">
        <MDXRemote
          source={source}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug],
            },
          }}
          components={{
            ...POST_VISUALS,
            // A wide table must scroll inside its own box, never widen the page: on a
            // 390 px phone an unwrapped four-column table pushed the layout viewport
            // out to 406 px. Keyboard-focusable so it can be scrolled without a pointer.
            table: (props: React.ComponentProps<"table">) => (
              <div className="overflow-x-auto" role="region" aria-label="Table, scrolls sideways" tabIndex={0}>
                <table {...props} />
              </div>
            ),
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

      {/* Every article ends with a way to subscribe. Posts that already embed
          <NewsletterCTA /> keep their own; the rest get the inline form. */}
      {!source.includes("<NewsletterCTA") && <PostSubscribe />}

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
