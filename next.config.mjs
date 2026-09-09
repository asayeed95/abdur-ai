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
        source: "/aitldr/:slug/llms.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
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
