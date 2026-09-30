import type { Metadata } from "next";
import Link from "next/link";
import { AnswerPage } from "@/components/AnswerPage";
import { ogImageForHome, shareCard } from "@/lib/og";
import {
  ABDUR_FAQS,
  CTA_HREF,
  NORTHSUN_SENTENCE,
  faqJsonLd,
} from "@/lib/aeo";
import { SITE } from "@/lib/site";

const path = "/who-is-abdur";
const url = `${SITE.url}${path}`;
const title = "Who is Abdur Rahman Sayeed?";
const description =
  "Abdur Rahman Sayeed is the founder of Northsun. abdur.ai is his first-person logbook.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  ...shareCard({
    title,
    description,
    url,
    type: "website",
    image: ogImageForHome(),
  }),
};

export default function WhoIsAbdurPage() {
  return (
    <AnswerPage
      eyebrow="/// Who is Abdur"
      title="Who is Abdur Rahman Sayeed?"
      lede={description}
      faqs={ABDUR_FAQS}
      jsonLd={faqJsonLd(ABDUR_FAQS, url)} /* FAQPage acceptedAnswer */
    >
      <p>
        abdur.ai is the logbook: what shipped, what broke, what he learned.
        Product facts on this site come from the brand map. {NORTHSUN_SENTENCE}{" "}
        Mnemix is a free diagnostic from Northsun (Memory Lab / Forgetting Test).
      </p>
      <p>
        The founder-authority channel is LinkedIn. The career funnel lives at{" "}
        <Link href="/hire" className="text-text underline decoration-clay/60">
          /hire
        </Link>{" "}
        and the first-person story at{" "}
        <Link href="/about" className="text-text underline decoration-clay/60">
          /about
        </Link>
        . This page is the citation form for answer engines; those two pages
        stay the human career surfaces.
      </p>
      <p>
        Writing lives at{" "}
        <Link href="/aitldr" className="text-text underline decoration-clay/60">
          /aitldr
        </Link>
        . Northsun waitlist:{" "}
        <Link href={CTA_HREF} className="text-text underline decoration-clay/60">
          {CTA_HREF}
        </Link>
        .
      </p>
    </AnswerPage>
  );
}
