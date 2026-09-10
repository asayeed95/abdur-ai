import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import type { FaqItem } from "@/lib/aeo";

export function AnswerPage({
  eyebrow,
  title,
  lede,
  jsonLd,
  faqs,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  jsonLd: unknown;
  faqs: FaqItem[];
  children: ReactNode;
}) {
  return (
    <>
      <Nav />
      <JsonLd data={jsonLd} />
      <main className="max-w-content mx-auto px-6 md:px-10 pt-32 pb-24">
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight text-text mb-8">
          {title}
        </h1>
        <p className="text-text text-xl md:text-2xl leading-relaxed max-w-prose mb-12">
          {lede}
        </p>
        <div className="max-w-prose space-y-6 text-text-soft text-lg leading-relaxed">
          {children}
        </div>
        <section className="max-w-prose mt-16" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-3xl text-text mb-6">
            Questions
          </h2>
          <dl className="space-y-6">
            {faqs.map((item) => (
              <div key={item.question}>
                <dt className="font-display text-xl text-text">{item.question}</dt>
                <dd className="text-text-soft text-lg leading-relaxed mt-2">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <Footer />
    </>
  );
}
