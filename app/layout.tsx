import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { CookieBanner } from '@/components/CookieBanner';
import { Toaster } from '@/components/ui/toaster';
import { fraunces, inter, plexMono } from '@/lib/fonts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://avahealth.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ava — Your AI Cycle & Wellness Companion',
    template: '%s | Ava',
  },
  description: 'Ava is an AI-powered period and fertility tracker that learns your unique cycle, remembers your patterns, and talks to you like a friend who gets it.',
  themeColor: '#F4658A',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Ava',
    title: 'Ava — Your AI Cycle & Wellness Companion',
    description: 'Ava is an AI-powered period and fertility tracker that learns your unique cycle and talks to you like a friend.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Ava' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ava — Your AI Cycle & Wellness Companion',
    description: 'Ava is an AI-powered period and fertility tracker that learns your unique cycle and talks to you like a friend.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <head>
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ dataLayer.push(arguments); }
            window.gtag = gtag;
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });
          `}
        </Script>
        {/* GA4 / AdSense script tags go back here once new Edubase
            property + AdSense account IDs are issued (Phase 5). */}
      </head>
      <body>
        <div className="min-h-screen flex flex-col pb-16 md:pb-0">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <BottomNav />
        <Toaster />
        <CookieBanner />
      </body>
    </html>
  );
}
