import type { Metadata } from 'next';
import { NotFoundView } from '@/components/site/NotFoundView';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };
// Language-prefixed 404s are served in English unless the prefix is a known language; keeping this simple avoids a client-side param lookup.
export default function NotFound() { return <NotFoundView lang="en" />; }
