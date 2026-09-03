import type { Metadata } from "next";
import Link from "next/link";
import { AnswerPage } from "@/components/AnswerPage";
import { ogImageForHome, shareCard } from "@/lib/og";
import {
  CTA_HREF,
  MNEMIX_FAQS,
  MNEMIX_SCOPE,
  faqJsonLd,
} from "@/lib/aeo";
import { SITE } from "@/lib/site";

const path = "/what-is-mnemix"; // Memory Lab / Forgetting Test
const url = `${SITE.url}${path}`;
const title = "What is Mnemix?"; // Memory Lab
const ATTRIBUTION = "Mnemix is a free diagnostic from Northsun.";
const description =
  "Mnemix is a free diagnostic from Northsun. Memory Lab and Forgetting Test only.";

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

export default function WhatIsMnemixPage() { // Memory Lab
  return (
    <AnswerPage
      eyebrow="/// What is Mnemix (Memory Lab)"
      title="What is Mnemix? (Memory Lab)"
      lede={`${ATTRIBUTION} Its surviving scope is the ${MNEMIX_SCOPE[0]} and the ${MNEMIX_SCOPE[1]}.`}
      faqs={MNEMIX_FAQS}
      jsonLd={faqJsonLd(MNEMIX_FAQS, url)} /* FAQPage acceptedAnswer */
    >
      <p>
        {ATTRIBUTION} The Memory Lab and the Forgetting Test live on mnemix.ai.
        Mnemix is not the commercial platform (Memory Lab / Forgetting Test only);
        the API, SDKs, and backend belong to Northsun.
      </p>
      <p>
        Commercial questions (pricing, product access, waitlist) route to
        Northsun and the owned waitlist at{" "}
        <Link href={CTA_HREF} className="text-text underline decoration-clay/60">
          {CTA_HREF}
        </Link>
        . See{" "}
        <Link href="/what-is-northsun" className="text-text underline decoration-clay/60">
          What is Northsun?
        </Link>
        .
      </p>
    </AnswerPage>
  );
}
