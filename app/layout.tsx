import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://freshpools.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FreshPools — Verified fresher talent, proven through competitive nature",
    template: "%s — FreshPools",
  },
  description:
    "Every FreshPools candidate has shipped working code in a live competition, passed a code review, and explained their own work on camera.",
  keywords: [
    "fresher hiring",
    "campus recruitment India",
    "verified developers",
    "hackathon hiring",
    "graduate hiring",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "FreshPools",
    title: "FreshPools — Verified fresher talent, proven through competitive nature",
    description:
      "Hire freshers who have already built something. Verified through live competition, code review and a recorded viva.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FreshPools — Verified fresher talent",
    description:
      "Hire freshers who have already built something. Verified through live competition, code review and a recorded viva.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F2F0EB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <html
      lang="en-IN"
      className={`${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Satoshi is not on Google Fonts — served from Fontshare */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink antialiased">
        {/* Keyboard users land here first */}
        <a
          href="#main"
          className="mono sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:border focus:border-ink focus:bg-block-yellow focus:px-4 focus:py-3 focus:text-label"
        >
          Skip to content
        </a>
        {children}
        {plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
      </body>
    </html>
  );
}
