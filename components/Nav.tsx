"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/85 backdrop-blur-md border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-content mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-text hover:text-clay transition-colors flex items-center gap-2"
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-clay animate-pulse-clay"
            aria-hidden
          />
          <span>{SITE.brand}</span>
        </Link>

        <ul className="hidden md:flex items-center gap-7">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="font-mono text-[11px] tracking-widest uppercase text-muted hover:text-text transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="#subscribe"
          className="font-mono text-[11px] tracking-widest uppercase text-clay border border-clay/40 hover:border-clay px-3 py-1.5 rounded-sm transition-colors"
        >
          Subscribe
        </Link>
      </div>
    </nav>
  );
}
