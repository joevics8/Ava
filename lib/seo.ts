import type { Metadata } from 'next';
import { ENABLED_LANGS, Lang, SITE, absolute } from '@/lib/site';

export type LangPaths = Partial<Record<Lang, string>>;

/**
 * canonical + hreflang. Every member of a group lists every other member
 * (hreflang must be reciprocal or Google ignores it) and x-default is English.
 * Only one language in the group → canonical only, no alternates.
 */
export function pageMetadata(opts: {
  lang: Lang; path: string; title: string; description: string; group?: LangPaths; noindex?: boolean; type?: 'website' | 'article';
}): Metadata {
  const { lang, path, title, description, group, noindex, type = 'website' } = opts;
  const languages: Record<string, string> = {};
  if (group && Object.keys(group).length > 1) {
    for (const l of ENABLED_LANGS) if (group[l]) languages[l] = absolute(group[l]!);
    if (group.en) languages['x-default'] = absolute(group.en);
  }
  return {
    title,
    description,
    alternates: { canonical: absolute(path), ...(Object.keys(languages).length ? { languages } : {}) },
    openGraph: { title, description, url: absolute(path), type, locale: lang, siteName: 'Ava' },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export interface Crumb { name: string; path: string }

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absolute(c.path) })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** One @graph per page: WebPage + breadcrumbs (+ FAQ, + app/article). */
export function graphLd(parts: object[]) {
  return { '@context': 'https://schema.org', '@graph': parts };
}

export const webPageLd = (path: string, name: string, description: string, lang: Lang) => ({
  '@type': 'WebPage', '@id': `${absolute(path)}#webpage`, url: absolute(path), name, description, inLanguage: lang,
  isPartOf: { '@type': 'WebSite', name: 'Ava', url: SITE },
});

/** Strip scripts/iframes/inline handlers. Blog HTML comes from our own pipeline, this is defence in depth. */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2');
}
