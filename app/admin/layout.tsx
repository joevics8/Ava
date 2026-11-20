import '../globals.css';
import type { Metadata } from 'next';
import { RootDocument } from '@/components/site/RootDocument';

// Shared by the login page and the panel. Never cached, never indexed.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
