import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="max-w-content mx-auto px-6 md:px-10 py-12 grid md:grid-cols-3 gap-8 items-start">
        <div>
          <Link
            href="/"
            className="font-display text-lg text-text inline-flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-clay inline-block" />
            {SITE.brand}
          </Link>
          <p className="text-muted text-sm mt-3 max-w-[40ch]">
            Made in NJ. Shipped at 2am.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 font-mono text-xs tracking-widest uppercase">
          <ul className="space-y-2">
            <li><Link href="/aitldr" className="text-muted hover:text-text">TLDR</Link></li>
            <li><Link href="/#tools" className="text-muted hover:text-text">Tools</Link></li>
            <li><Link href="/#projects" className="text-muted hover:text-text">Mnemix</Link></li>
          </ul>
          <ul className="space-y-2">
            <li><Link href="/about" className="text-muted hover:text-text">About</Link></li>
            <li><Link href="/now" className="text-muted hover:text-text">Now</Link></li>
            <li><Link href="/hire" className="text-muted hover:text-text">Hire</Link></li>
          </ul>
        </div>

        <div className="text-right md:text-right">
          <p className="font-mono text-xs text-muted-3 mb-3 tracking-widest uppercase">
            Find me
          </p>
          <ul className="font-mono text-xs space-y-1.5">
            <li>
              <a href={`mailto:${SITE.email}`} className="text-muted hover:text-clay">
                {SITE.email}
              </a>
            </li>
            <li>
              <a href={SITE.handles.linkedin} className="text-muted hover:text-clay">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={SITE.handles.github} className="text-muted hover:text-clay">
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-content mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-[10px] tracking-widest uppercase text-muted-3">
          <p>
            © 2026 {SITE.author} ·{" "}
            <Link
              href={SITE.parent.url}
              className="hover:text-clay transition-colors"
            >
              An {SITE.parent.name} property — coming
            </Link>
          </p>
          <p className="flex gap-4">
            <Link href="/aitldr/rss.xml" className="hover:text-text">RSS</Link>
            <Link href="/llms.txt" className="hover:text-text">llms.txt</Link>
            <Link href="/sitemap.xml" className="hover:text-text">Sitemap</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
