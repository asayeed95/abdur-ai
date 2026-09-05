import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/site";
import { ogImageForHome, shareCard } from "@/lib/og";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import "./globals.css";

const homeTitle = `${SITE.author} — ${SITE.tagline}`;
const homeShare = shareCard({
  title: homeTitle,
  description: SITE.description,
  url: SITE.url,
  type: "website",
  image: ogImageForHome(),
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: homeTitle,
    template: `%s · ${SITE.brand}`,
  },
  description: SITE.description,
  applicationName: SITE.brand,
  authors: [{ name: SITE.author, url: SITE.url }],
  creator: SITE.author,
  publisher: SITE.author,
  keywords: [
    "AI",
    "agent systems",
    "agent verification",
    "RAG",
    "memory",
    "Northsun",
    "MOLL",
    "Abdur Rahman Sayeed",
    "AI builder",
    "applied AI engineer",
    "forward deployed engineer",
    "AI systems architect",
  ],
  alternates: {
    canonical: SITE.url,
    types: {
      "application/rss+xml": `${SITE.url}/writing/rss.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    ...homeShare.openGraph,
    siteName: SITE.brand,
    locale: "en_US",
  },
  twitter: {
    ...homeShare.twitter,
    creator: SITE.handles.x,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // The active theme follows the visitor's clock, which no meta tag can
  // express; prefers-color-scheme is the closest approximation for browser
  // chrome. The page itself is governed by data-theme, set pre-paint below.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F1E8" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0A08" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${mono.variable}`}
      // data-theme is written by the pre-paint script below, so the server
      // markup and the first client render legitimately differ on <html>.
      suppressHydrationWarning
    >
      <head>
        {/*
          Blocking, pre-paint theme resolution. This MUST stay synchronous and
          in <head>: if it ran after paint, every visitor after 18:00 would get
          a white flash before the dark theme applied. It is deliberately not a
          server computation — the clock belongs to the visitor, and this page
          is statically cached.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        {/* JSON-LD: Person + WebSite — site-wide */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": `${SITE.url}/#abdur`,
                  name: SITE.author,
                  url: SITE.url,
                  image: `${SITE.url}/abdur.jpg`,
                  jobTitle: "AI-Native Software Builder & Engineer",
                  description: SITE.description,
                  homeLocation: {
                    "@type": "Place",
                    name: "New Jersey / New York, USA",
                  },
                  sameAs: [
                    SITE.handles.linkedin,
                    SITE.handles.github,
                    `https://x.com/${SITE.handles.x.replace("@", "")}`,
                  ],
                  knowsAbout: [
                    "Large Language Models",
                    "Multi-Agent Systems",
                    "Retrieval-Augmented Generation",
                    "Vector Databases",
                    "Agent Verification",
                    "Prompt Engineering",
                  ],
                  affiliation: {
                    "@type": "Organization",
                    name: "ASEC",
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE.url}/#website`,
                  url: SITE.url,
                  name: SITE.brand,
                  description: SITE.description,
                  publisher: { "@id": `${SITE.url}/#abdur` },
                  inLanguage: "en-US",
                },
              ],
            }),
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
