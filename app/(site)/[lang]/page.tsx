import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LocalHome } from '@/components/site/views';
import { isEnabledLang, homePath } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { ENABLED_LANGS } from '@/lib/site';
export const revalidate = 86400;
export const dynamicParams = true;
export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  if (!isEnabledLang(params.lang) || params.lang === 'en') return {};
  const group = Object.fromEntries(ENABLED_LANGS.map(l => [l, homePath(l)]));
  return pageMetadata({ lang: params.lang, path: homePath(params.lang), group,
    title: 'Ava: tu ciclo y tu cuerpo, explicados', description: 'Calculadoras gratuitas y una compañera en Telegram que aprende tu ciclo y responde tus dudas.' });
}
export default function Page({ params }: { params: { lang: string } }) {
  if (!isEnabledLang(params.lang) || params.lang === 'en') notFound();
  return <LocalHome lang={params.lang} />;
}
