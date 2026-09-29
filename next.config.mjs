import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  experimental: {
    mdxRs: false,
  },
  async rewrites() {
    return [
      {
        source: "/writing/:slug.md",
        destination: "/writing/:slug/markdown",
      },
    ];
  },
  async redirects() {
    // Legacy brand-era paths (Sentinel 2026-08-22: both 404'd). Neither route
    // ever existed in this repo; map them to the surfaces that own the intent
    // today. Recorded in content/brand/brand-map.json (legacy_routes).
    return [
      // Product path from the Mnemix brand era → the Northsun flagship section.
      { source: "/mnemix", destination: "/#projects", statusCode: 301 },
      // This site's writing has always lived under /aitldr; map the legacy
      // /blog namespace (e.g. /blog/mnemix-vs-general-memory) to the index.
      // Static assets are carved out: post images live in public/blog/<slug>/
      // and redirects run before the public/ filesystem, so a bare catch-all
      // would 301 image requests to HTML (prod bug: four-evidence-states
      // SVG). Paths ending in a static-file extension must fall through.
      { source: "/blog", destination: "/aitldr", statusCode: 301 },
      {
        source:
          "/blog/:slug((?!.*\\.(?:svg|png|jpg|jpeg|webp|gif|css|js|woff|woff2)$).*)",
        destination: "/aitldr",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/llms.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
      {
        source: "/llms-full.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
      {
        source: "/writing/feed.json",
        headers: [{ key: "Content-Type", value: "application/feed+json; charset=utf-8" }],
      },
      // No header rule for /writing/:slug.md on purpose: a headers() rule matches
      // by path, so it would also stamp text/markdown on the 404 for an unknown
      // slug. The markdown route sets Content-Type on real twins itself.
      {
        source: "/writing/rss.xml",
        headers: [{ key: "Content-Type", value: "application/rss+xml" }],
      },
      {
        source: "/aitldr/rss.xml",
        headers: [{ key: "Content-Type", value: "application/rss+xml" }],
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
  },
});

export default withMDX(nextConfig);
