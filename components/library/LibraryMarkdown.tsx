import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/**
 * Renders a library asset's Markdown. The files are plain GFM, not MDX, so
 * they are compiled with `format: "md"`: no JSX, no expressions, and the same
 * file reads cleanly as the editable download.
 */
export function LibraryMarkdown({ source }: { source: string }) {
  return (
    <div className="prose-clay max-w-prose break-words [&_a]:[overflow-wrap:anywhere] [&_:not(pre)>code]:[overflow-wrap:anywhere]">
      <MDXRemote
        source={source}
        options={{ mdxOptions: { format: "md", remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
        components={{
          // Same rule as articles: a wide table scrolls in its own box, never the page.
          table: (props: React.ComponentProps<"table">) => (
            <div className="overflow-x-auto" role="region" aria-label="Table, scrolls sideways" tabIndex={0}>
              <table {...props} />
            </div>
          ),
        }}
      />
    </div>
  );
}
