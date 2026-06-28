"use client";

import { useEffect, useRef } from "react";

/**
 * Adds `data-reveal` opacity/translate animation on viewport entry.
 * Single IntersectionObserver instance is created in the page; this
 * component just registers the ref.
 *
 * Falls back to "always visible" if IntersectionObserver isn't supported
 * or if the user prefers reduced motion.
 */
export function Reveal({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // @ts-expect-error — polymorphic JSX intrinsic
    <Tag ref={ref} data-reveal className={className} {...rest}>
      {children}
    </Tag>
  );
}
