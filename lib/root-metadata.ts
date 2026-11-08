import type { Metadata } from 'next';
import { SITE } from '@/lib/site';
import { BRAND, OG_IMAGE } from '@/lib/seo';

const TITLE = 'Ava: Your AI Health & Cycle Companion';
const DESCRIPTION = 'Ava is an AI health companion on Telegram. Track your cycle, ask health questions, and use free health tools and plain-language guides.';

// Search Console / Bing Webmaster verification tags. Set the env vars in Vercel
// and the <meta> tags appear; nothing is emitted when they are unset.
const verification: Metadata['verification'] = {
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
  ...(process.env.BING_SITE_VERIFICATION ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } } : {}),
};

/** Site-wide defaults. Pages override what they need through pageMetadata(). */
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE),
  applicationName: BRAND,
  title: { default: TITLE, template: `%s | ${BRAND}` },
  description: DESCRIPTION,
  manifest: '/site.webmanifest',
  themeColor: '#151a42',
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // Allow full-size image previews and unlimited snippets in results.
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  openGraph: {
    type: 'website', siteName: BRAND, title: TITLE,
    description: 'Ava learns your cycle, remembers your patterns, and talks to you like a friend.',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Ava: AI health and cycle companion on Telegram' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, images: [OG_IMAGE] },
  ...(Object.keys(verification).length ? { verification } : {}),
};
