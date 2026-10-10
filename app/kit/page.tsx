import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { KitSignupForm } from "@/components/KitSignupForm";
import { KIT_FILES, KIT_PATH } from "@/lib/kit";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Agent Reliability Kit",
  description:
    "A free kit for engineers building AI agents: a verification checklist with commands, a durable-memory starter, and a postmortem template.",
  alternates: { canonical: `${SITE.url}${KIT_PATH}` },
  robots: { index: true, follow: true },
};

/**
 * What a native (no-JS) form post reports back. /api/subscribe answers a post
 * carrying `return_to=/kit` with a 303 to /kit/thanks on success or
 * `/kit?error=<kind>` here; the JS path never lands here with a query.
 */
const NOTICES = {
  invalid: "That email address doesn't look right. Check it and try again.",
  unavailable: "Signup is unavailable right now. Please try again in a few minutes.",
} as const;

/** The three things in the kit; the starter's README ships alongside it. */
const INSIDE = KIT_FILES.filter((f) => f.key !== "memory-readme");

/*
 * No <Reveal> on this page on purpose: [data-reveal] starts at opacity 0 and
 * only JS reveals it, and this page has to work with JS off.
 */
export default async function KitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const q = await searchParams;
  const notice = q.error === "invalid" || q.error === "unavailable" ? NOTICES[q.error] : null;

  return (
    <>
      <Nav />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-24">
        <p className="eyebrow mb-4">/// Free · For engineers building AI agents</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight text-text mb-8">
          The Agent Reliability Kit
        </h1>

        <div className="max-w-prose space-y-5 text-text-soft text-lg leading-relaxed mb-12">
          <p>
            Three files I use when I build with agents: a checklist for checking
            an agent&apos;s work before I trust it, a memory log that survives a
            restart, and the template I write postmortems in. Each one comes
            out of work I&apos;ve already done and written about, not written for
            this page.
          </p>
          <p>
            It&apos;s for engineers who have had an agent report &ldquo;done&rdquo;
            when it wasn&apos;t, who need an agent to remember something across a
            restart, or who want to write up what broke in a way the next person
            can use.
          </p>
        </div>

        <section aria-labelledby="kit-inside" className="mb-14">
          <h2 id="kit-inside" className="eyebrow-muted mb-5">
            What&apos;s inside
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {INSIDE.map((f, i) => (
              <li key={f.key} className="bg-surface border border-border rounded-lg p-6">
                <p className="font-mono text-[11px] tracking-widest uppercase text-meta mb-3">
                  {String(i + 1).padStart(2, "0")} · {f.format}
                </p>
                <h3 className="font-display text-2xl text-text leading-snug mb-3">{f.title}</h3>
                <p className="text-text-soft leading-relaxed">{f.summary}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="kit-get" className="bg-band border border-border rounded-lg p-6 md:p-10">
          <h2 id="kit-get" className="font-display text-3xl text-text mb-4">
            Get the kit
          </h2>
          <p className="text-text-soft leading-relaxed max-w-prose mb-6">
            Leave your email and the download links appear right here. You also
            join the TLDR list: an email when I publish a new essay about what I
            built, what broke and what I learned. Leave whenever you like.
          </p>
          {notice && (
            <p role="alert" className="mb-4 font-mono text-sm text-clay">
              {notice}
            </p>
          )}
          <KitSignupForm />
          <p className="mt-6 font-mono text-[11px] text-meta max-w-prose">
            Free. Not an ebook, not a course, not a product demo. The memory
            starter is a demonstration with stated limits; read them before you
            rely on it.
          </p>
        </section>

        <p className="mt-12 text-meta">
          Want the essays these came from?{" "}
          <Link href="/writing" className="text-text underline decoration-border underline-offset-4 hover:text-clay hover:decoration-clay">
            Read the writing
          </Link>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}
