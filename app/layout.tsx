import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

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
    default: `${SITE.author} — ${SITE.tagline}`,
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
    "Mnemix",
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
      "application/rss+xml": `${SITE.url}/aitldr/rss.xml`,
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
    type: "website",
    siteName: SITE.brand,
    locale: "en_US",
    url: SITE.url,
    title: `${SITE.author} — ${SITE.tagline}`,
    description: SITE.description,
    images: [
      {
        url: `${SITE.url}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: `${SITE.brand} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: SITE.handles.x,
    title: `${SITE.author} — ${SITE.tagline}`,
    description: SITE.description,
    images: [`${SITE.url}/og-default.jpg`],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0A08",
  colorScheme: "dark",
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
    >
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
      </body>
    </html>
  );
}
