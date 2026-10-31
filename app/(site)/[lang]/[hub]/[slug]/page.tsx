import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BlogPostPage, ToolPage, blogPostMetadata, toolMetadata } from '@/components/site/views';
import { hubKind, isEnabledLang } from '@/lib/site';
export const revalidate = 3600;
type P = { params: { lang: string; hub: string; slug: string } };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  if (!isEnabledLang(params.lang) || params.lang === 'en') return {};
  const kind = hubKind(params.lang, params.hub);
  if (kind === 'tools') return toolMetadata(params.lang, params.slug);
  if (kind === 'blog') return blogPostMetadata(params.lang, params.slug);
  return {};
}
export default function Page({ params }: P) {
  if (!isEnabledLang(params.lang) || params.lang === 'en') notFound();
  const kind = hubKind(params.lang, params.hub);
  if (kind === 'tools') return <ToolPage lang={params.lang} slug={params.slug} />;
  if (kind === 'blog') return <BlogPostPage lang={params.lang} slug={params.slug} />;
  notFound();
}
