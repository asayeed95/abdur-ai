import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PostArticle } from "@/components/post/PostArticle";
import { getAllPosts, getNeighbors, getPost, getPostSource, postPath, resolveOgPath } from "@/lib/posts";
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
  const og = resolveOgPath(post);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      images: [{ url: og, width: 1200, height: 630 }],
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
