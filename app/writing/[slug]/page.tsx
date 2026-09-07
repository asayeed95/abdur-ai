import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PostArticle } from "@/components/post/PostArticle";
import { getAllPosts, getNeighbors, getPost, getPostSource, postPath } from "@/lib/posts";
import { ogImageForPost, shareCard } from "@/lib/og";
import { SITE } from "@/lib/site";

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
  const url = `${SITE.url}${postPath(post.slug)}`;
  const share = shareCard({
    title: post.title,
    description: post.description,
    url: url,
    type: "article",
    image: ogImageForPost(post),
  });
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      ...share.openGraph,
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [SITE.url],
      tags: post.tags,
    },
    twitter: { ...share.twitter, creator: SITE.handles.x },
  };
}

export default async function WritingPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  const source = getPostSource(slug);
  if (!post || !source) notFound();
  const { prev, next } = getNeighbors(slug);

  return (
    <>
      <Nav />
      <PostArticle post={post} source={source} prev={prev} next={next} />
      <Footer />
    </>
  );
}
