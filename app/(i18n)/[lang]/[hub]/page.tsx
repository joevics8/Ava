import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BlogHub, ToolsHub, blogHubMetadata, toolsHubMetadata } from '@/components/site/views';
import { hubKind, isEnabledLang } from '@/lib/site';
import { listPosts } from '@/lib/blog';
export const revalidate = 3600;
export async function generateMetadata({ params }: { params: { lang: string; hub: string } }): Promise<Metadata> {
  if (!isEnabledLang(params.lang) || params.lang === 'en') return {};
  const kind = hubKind(params.lang, params.hub);
  if (kind === 'tools') return toolsHubMetadata(params.lang);
  if (kind === 'blog') return blogHubMetadata(params.lang, (await listPosts(params.lang)).length);
  return {};
}
export default function Page({ params }: { params: { lang: string; hub: string } }) {
  if (!isEnabledLang(params.lang) || params.lang === 'en') notFound();
  const kind = hubKind(params.lang, params.hub);
  if (kind === 'tools') return <ToolsHub lang={params.lang} />;
  if (kind === 'blog') return <BlogHub lang={params.lang} />;
  notFound();
}
