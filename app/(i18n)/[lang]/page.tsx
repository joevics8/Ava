import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LocalHome, localHomeMetadata } from '@/components/site/views';
import { isEnabledLang } from '@/lib/site';

export const revalidate = 86400;
export const dynamicParams = true;

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  if (!isEnabledLang(params.lang) || params.lang === 'en') return {};
  return localHomeMetadata(params.lang);
}

export default function Page({ params }: { params: { lang: string } }) {
  if (!isEnabledLang(params.lang) || params.lang === 'en') notFound();
  return <LocalHome lang={params.lang} />;
}
