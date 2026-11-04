import '../globals.css';
import { rootMetadata } from '@/lib/root-metadata';
import { RootDocument } from '@/components/site/RootDocument';

export const metadata = rootMetadata;

// English pages (everything outside /[lang]). Language-prefixed pages have their
// own root layout in app/(i18n)/[lang]/layout.tsx so <html lang> is always right.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
