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

export default function SubscribePage() {
  return (
    <>
      <Nav />
      <main>
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
