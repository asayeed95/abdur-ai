import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Subscribe } from "@/components/Subscribe";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Subscribe — abdur.ai TLDR",
  description:
    "Get the TLDR in your inbox. One email when Abdur ships something or learns something the hard way. No drip campaigns, no growth hacks — just the logbook.",
  alternates: { canonical: "https://abdur.ai/subscribe" },
  robots: { index: true, follow: true },
};

/**
 * What a native (no-JS) form post reports back. /api/subscribe answers those
 * with a 303 to `/subscribe?subscribed=1` or `/subscribe?error=<kind>`; the JS
 * path never lands here with a query, it updates the form in place.
 */
const NOTICES = {
  subscribed: { tone: "ok", text: "You're on the list." },
  invalid: { tone: "err", text: "That email address doesn't look right. Check it and try again." },
  unavailable: { tone: "err", text: "Signup is unavailable right now. Please try again in a few minutes." },
} as const;

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; error?: string }>;
}) {
  const q = await searchParams;
  const notice =
    q.subscribed === "1"
      ? NOTICES.subscribed
      : q.error === "invalid" || q.error === "unavailable"
        ? NOTICES[q.error]
        : null;

  return (
    <>
      <Nav />
      <main>
        {/* The page's only heading. Visually hidden: the form block below
            carries the visible copy, and the page had no h1 for assistive
            tech or crawlers. */}
        <h1 className="sr-only">Subscribe to the abdur.ai logbook</h1>
        {notice && (
          <p
            role="status"
            className={`max-w-content mx-auto px-6 md:px-10 pt-28 font-mono text-sm ${
              notice.tone === "ok" ? "text-good-text" : "text-clay"
            }`}
          >
            {notice.text}
          </p>
        )}
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
