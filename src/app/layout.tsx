import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { WalletButton } from "@/components/WalletButton";
import { Logo } from "@/components/Logo";
import { AppNav } from "@/components/AppNav";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteTitle = "Arc RWA";
const siteDescription = "RWA prediction markets on Arc Testnet. Trade Yes/No on real-world assets, settled in USDC.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s · ${siteTitle}`,
  },
  description: siteDescription,
  applicationName: siteTitle,
  keywords: ["Arc", "RWA", "prediction market", "USDC", "Arc Testnet"],
  authors: [{ name: "KeithinX" }],
  creator: "KeithinX",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    siteName: siteTitle,
    locale: "en_US",
    url: siteUrl,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Arc RWA — RWA prediction markets on Arc",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    creator: process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? "@KeithinX",
    site: process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? "@KeithinX",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Arc RWA — RWA prediction markets on Arc",
      },
    ],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <header className="sticky top-0 z-50 border-b border-arc-border bg-[#f4f7f6]/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
              <a href="/" className="flex items-center gap-3 no-underline">
                <Logo size={32} />
                <span className="text-xl font-bold tracking-[-0.03em] text-arc-ink">
                  Arc{" "}
                  <span className="font-semibold tracking-[-0.02em] text-arc-accent">RWA</span>
                </span>
              </a>
              <div className="flex items-center gap-4">
                <AppNav />
                <WalletButton />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-5 py-8 pb-20 md:pb-8">{children}</main>
          <footer className="hidden border-t border-arc-border md:block">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 text-sm text-arc-muted">
              <span className="font-semibold tracking-[-0.02em] text-arc-ink">
                Arc <span className="font-medium text-arc-accent">RWA</span>
              </span>
              <span>Settled in USDC</span>
            </div>
          </footer>
          <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
            <AppNav mobile />
          </div>
        </Providers>
      </body>
    </html>
  );
}
