import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegisterBadge } from "@/components/post/RegisterNote";
import { EmbedLink } from "@/components/post/EmbedLinks";
import { getAllPosts, getPost, postPath } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
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
  return {
    title: post.seoTitle ?? post.title,
    // The card is a pointer, not a copy: keep it out of the index and point
    // any crawler that lands here at the canonical post.
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE.url}${postPath(post.slug)}` },
  };
}

/**
 * Embeddable post card — the target of the "Embed" snippet on every post.
 * No nav, no footer, nothing that needs the parent page to cooperate. Every
 * link opens the canonical site in a new tab and carries embed UTMs, so a
 * subscriber who arrived through someone else's page is attributed to it
 * (lib/attribution.ts records first-touch UTMs).
 */
export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const utm = `utm_source=embed&utm_medium=iframe&utm_campaign=${encodeURIComponent(post.slug)}`;
  const readHref = `${SITE.url}${postPath(post.slug)}?${utm}`;
  const subscribeHref = `${SITE.url}/subscribe?${utm}`;
  const summary = post.dek || post.description;

  return (
    <main className="min-h-screen bg-bg p-3">
      <article className="h-full bg-surface border border-border rounded-lg p-5 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] tracking-widest uppercase text-meta">
          <EmbedLink slug={post.slug} target="home" href={`${SITE.url}/?${utm}`} className="hover:text-clay">
            {SITE.brand} <span className="text-clay">///</span> writing
          </EmbedLink>
          <RegisterBadge register={post.register} />
        </div>
        <h1 className="font-display text-xl md:text-2xl leading-tight text-text line-clamp-2">
          <EmbedLink slug={post.slug} target="post" href={readHref} className="hover:text-clay">
            {post.title}
          </EmbedLink>
        </h1>
        {summary && <p className="text-sm text-meta leading-relaxed line-clamp-2">{summary}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs">
          <EmbedLink slug={post.slug} target="post" href={readHref} className="text-clay hover:underline">
            Read the post →
          </EmbedLink>
          <EmbedLink slug={post.slug} target="subscribe" href={subscribeHref} className="text-meta hover:text-text">
            Get the TLDR by email
          </EmbedLink>
          <span className="text-meta">
            {post.dateDisplay} · {post.readingTime} min
          </span>
        </div>
      </article>
    </main>
  );
}
