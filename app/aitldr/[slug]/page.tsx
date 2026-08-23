import type { Metadata } from "next";
import type { ImgHTMLAttributes } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { MDXRemote } from "next-mdx-remote/rsc";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MnemixCTA, AsecWaitlistCTA, NewsletterCTA } from "@/components/post/LeadMagnets";
import { ReceiptsBlock } from "@/components/post/ReceiptsBlock";
import { PatternsBlock } from "@/components/post/PatternsBlock";
import { getAllPosts, getPost } from "@/lib/posts";
import { SITE } from "@/lib/site";
import { ogImageForPost } from "@/lib/og";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${SITE.url}/aitldr/${post.slug}`;
  const og = ogImageForPost(post.slug, post.ogImage);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      images: [og],
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [SITE.url],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [og],
      creator: SITE.handles.x,
    },
  };
}

async function loadMdxSource(slug: string) {
  const candidates = [
    path.join(process.cwd(), "content", "posts", `${slug}.mdx`),
    path.join(process.cwd(), "content", "posts", `${slug}.md`),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const raw = fs.readFileSync(c, "utf8");
      const { content } = matter(raw);
      return content;
    }
  }
  return null;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  const source = await loadMdxSource(slug);
  if (!post || !source) notFound();

  const allPosts = getAllPosts();
  const idx = allPosts.findIndex((p) => p.slug === slug);
  const prev = idx >= 0 ? allPosts[idx + 1] : null;
  const next = idx > 0 ? allPosts[idx - 1] : null;

  return (
    <>
      <Nav />

      {/* Per-post JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": `${SITE.url}/aitldr/${post.slug}#post`,
            headline: post.title,
            description: post.description,
            image: ogImageForPost(post.slug, post.ogImage).url,
            datePublished: post.date,
            dateModified: post.updated || post.date,
            wordCount: post.wordCount,
            timeRequired: `PT${post.readingTime}M`,
            inLanguage: "en-US",
            articleSection: post.section,
            keywords: post.tags,
            author: { "@id": `${SITE.url}/#abdur` },
            publisher: { "@id": `${SITE.url}/#abdur` },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${SITE.url}/aitldr/${post.slug}`,
            },
            url: `${SITE.url}/aitldr/${post.slug}`,
            isPartOf: {
              "@type": "Blog",
              "@id": `${SITE.url}/aitldr#blog`,
              name: "abdur.ai builder logs",
              url: `${SITE.url}/aitldr`,
            },
          }),
        }}
      />

      <article className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-20">
        {/* Header */}
        <header className="aitldr-measure">
          <p className="eyebrow mb-6">
            {(post.tags || []).slice(0, 4).join(" · ")}
          </p>
          {/* No mb on title/subtitle: .aitldr-dateline owns the title→date gap. */}
          <h1 className="font-display text-4xl md:text-6xl tracking-tight text-text leading-[1.04]">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="font-display italic text-xl md:text-2xl text-muted mt-6">
              {post.subtitle}
            </p>
          )}
          <div className="aitldr-dateline mb-2">
            <p className="font-display text-text-soft">
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-3">
              <span>{post.readingTime} min read</span>
              <span>·</span>
              <span>by {post.author}</span>
            </p>
          </div>
          <div className="w-[60px] h-[2px] bg-clay mt-10" />
        </header>

        {/* Body */}
        <div className="prose-clay aitldr-measure mt-12">
          <MDXRemote
            source={source}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug],
              },
            }}
            components={{
              // Keep in-post figures visibly narrower than the widened text column.
              img: (props: ImgHTMLAttributes<HTMLImageElement>) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  {...props}
                  alt={props.alt ?? ""}
                  loading="lazy"
                  className="aitldr-figure block mx-auto my-8 w-full h-auto rounded-lg"
                />
              ),
              MnemixCTA,
              AsecWaitlistCTA,
              NewsletterCTA,
              ReceiptsBlock: () => post.receipts ? <ReceiptsBlock items={post.receipts} /> : null,
              PatternsBlock: () => post.patterns ? <PatternsBlock items={post.patterns} /> : null,
            }}
          />
        </div>

        {/* Prev / Next */}
        <nav className="aitldr-measure mt-20 pt-8 border-t border-border grid sm:grid-cols-2 gap-6">
          {prev ? (
            <Link
              href={`/aitldr/${prev.slug}`}
              className="group block bg-surface border border-border rounded-lg p-5 hover:border-clay transition-colors"
            >
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-3 mb-2">
                ← Previous
              </p>
              <p className="font-display text-lg text-text group-hover:text-clay transition-colors leading-tight">
                {prev.title}
              </p>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              href={`/aitldr/${next.slug}`}
              className="group block bg-surface border border-border rounded-lg p-5 hover:border-clay transition-colors text-right"
            >
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-3 mb-2">
                Next →
              </p>
              <p className="font-display text-lg text-text group-hover:text-clay transition-colors leading-tight">
                {next.title}
              </p>
            </Link>
          ) : <div />}
        </nav>
      </article>

      <Footer />
    </>
  );
}
