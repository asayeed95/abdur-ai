"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

/** Outbound link from an embedded card: new tab, opener cut, click counted. */
export function EmbedLink({
  slug,
  target,
  href,
  className,
  children,
}: {
  slug: string;
  target: "post" | "subscribe" | "home";
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => trackEvent("embed:read-click", { slug, target })}
    >
      {children}
    </a>
  );
}
