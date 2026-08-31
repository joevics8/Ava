import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://avacare-alpha.vercel.app'),
  title: {
    default: 'Ava — Your AI Cycle & Wellness Companion',
    template: '%s | Ava',
  },
  description: 'Ava is an AI-powered period and fertility tracker that learns your unique cycle, remembers your patterns, and talks to you like a friend who gets it.',
  themeColor: '#E91E63',
  openGraph: {
    type: 'website',
    siteName: 'Ava',
    title: 'Ava — Your AI Cycle & Wellness Companion',
    description: 'Ava learns your cycle, remembers your patterns, and talks to you like a friend.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Ava' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
