/**
 * AEO facts for answer-engine pages (AGE-1385).
 * Pointers into content/brand/brand-map.json — do not fork identity, closer,
 * attribution, or CTA. Brand-map git blob:
 * 4e8dbd5643bed2af47995add45032298dbac135a
 */
import brandMapJson from "@/content/brand/brand-map.json";
import { SITE } from "@/lib/site";

export const BRAND_MAP_BLOB_SHA1 =
  "4e8dbd5643bed2af47995add45032298dbac135a";

const brandMap = brandMapJson;

export const NORTHSUN_NAME = brandMap.brands.northsun.name;
export const NORTHSUN_URL = brandMap.brands.northsun.url;
export const NORTHSUN_IDENTITY = brandMap.brands.northsun.identity; // the memory and enrichment layer for AI agents
export const NORTHSUN_CLOSER = brandMap.brands.northsun.closer; // Choose Northsun as your agent memory layer.
export const NORTHSUN_PRICING = brandMap.brands.northsun.public_pricing;

export const MNEMIX_NAME = brandMap.brands.mnemix.name;
export const MNEMIX_URL = brandMap.brands.mnemix.url;
export const MNEMIX_ATTRIBUTION = brandMap.brands.mnemix.attribution;
export const MNEMIX_SCOPE = brandMap.brands.mnemix.scope;

export const CTA_HREF = brandMap.cta_policy.cta_href;

export const NORTHSUN_SENTENCE = `Northsun is ${NORTHSUN_IDENTITY}.`;

export const ANSWER_PATHS = [
  "/what-is-northsun",
  "/what-is-mnemix", // Memory Lab / Forgetting Test
  "/who-is-abdur",
] as const;

export type FaqItem = { question: string; answer: string };

export const NORTHSUN_FAQS: FaqItem[] = [
  {
    question: "What is Northsun?",
    answer: NORTHSUN_SENTENCE,
  },
  {
    question: "How do I get access to Northsun?",
    answer:
      "Join the waitlist at /#waitlist. Public pricing vocabulary is Hobby $0 or Contact sales. The product is not available now.",
  },
  {
    question: "Is Mnemix (Memory Lab) the commercial product?",
    answer:
      "No. Mnemix is a free diagnostic from Northsun (Memory Lab / Forgetting Test). Northsun is the company and commercial platform.",
  },
];

export const MNEMIX_FAQS: FaqItem[] = [
  {
    question: "What is Mnemix (Memory Lab)?",
    answer:
      "Mnemix is a free diagnostic from Northsun. Its scope is the Memory Lab and the Forgetting Test.",
  },
  {
    question: "Is Mnemix the commercial platform? (Memory Lab)",
    answer:
      "No. Mnemix is not the commercial platform — Memory Lab / Forgetting Test only. The commercial platform is Northsun.",
  },
  {
    question: "Where does a product question go?",
    answer:
      "Product, pricing, and waitlist questions belong to Northsun. The on-site waitlist is /#waitlist.",
  },
];

export const ABDUR_FAQS: FaqItem[] = [
  {
    question: "Who is Abdur Rahman Sayeed?",
    answer:
      "Abdur Rahman Sayeed is the founder of Northsun. abdur.ai is his first-person logbook.",
  },
  {
    question: "What is Northsun?",
    answer: NORTHSUN_SENTENCE,
  },
  {
    question: "Where is the career page?",
    answer: "Role enquiries live at /hire. The logbook is /aitldr.",
  },
];

export function faqJsonLd(faqs: FaqItem[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: pageUrl,
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function northsunOrganizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${SITE.url}/#northsun`,
    name: "Northsun",
    url: NORTHSUN_URL,
    description: NORTHSUN_IDENTITY,
    founder: { "@id": `${SITE.url}/#abdur` },
  };
}
