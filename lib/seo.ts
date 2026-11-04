import type { Metadata } from 'next';
import { BOT_URL, ENABLED_LANGS, HUB_MIN_PAGES, Lang, SITE, absolute, homePath } from '@/lib/site';
import { toolsFor } from '@/lib/tools/registry';

export type LangPaths = Partial<Record<Lang, string>>;

export const BRAND = 'Ava';
/** Share image used when a page doesn't have its own. 1200×630. */
export const OG_IMAGE = '/og-image.png';
export const LOGO_PATH = '/logo.png';

/** og:locale wants language_TERRITORY, not a bare language code. */
export const OG_LOCALE: Record<Lang, string> = {
  en: 'en_US', es: 'es_ES', pt: 'pt_BR', fr: 'fr_FR', de: 'de_DE', id: 'id_ID', hi: 'hi_IN', ar: 'ar_AR', tr: 'tr_TR', it: 'it_IT',
};

/** Stable @ids so every page's JSON-LD points at the same Organization and WebSite nodes. */
export const ORG_ID = `${SITE}/#organization`;
export const SITE_ID = `${SITE}/#website`;

/** Google truncates titles around 60 characters. The root layout appends " | Ava". */
export const TITLE_LIMIT = 60;
export const DESCRIPTION_LIMIT = 155;

/**
 * Languages whose *home page* should be indexed: English always, others only
 * once they have HUB_MIN_PAGES tools (thin language homes hurt more than they
 * help; see CLAUDE.md). The same rule drives noindex, the sitemap and hreflang,
 * so the three can never disagree.
 */
export function indexableHomeLangs(): Lang[] {
  return ENABLED_LANGS.filter(l => l === 'en' || toolsFor(l).length >= HUB_MIN_PAGES);
}
export const isIndexableHome = (lang: Lang) => indexableHomeLangs().includes(lang);

/** hreflang group for the home pages: only languages whose home is indexable, reciprocal by construction. */
export function homeGroup(): LangPaths | undefined {
  const langs = indexableHomeLangs();
  return langs.length > 1 ? Object.fromEntries(langs.map(l => [l, homePath(l)])) : undefined;
}

/**
 * canonical + hreflang + Open Graph + Twitter card. Every member of a group
 * lists every other member (hreflang must be reciprocal or Google ignores it)
 * and x-default is English. Only one language in the group → canonical only.
 */
export function pageMetadata(opts: {
  lang: Lang; path: string; title: string; description: string; group?: LangPaths; noindex?: boolean;
  type?: 'website' | 'article'; image?: string; publishedTime?: string | null; modifiedTime?: string | null; section?: string | null;
}): Metadata {
  const { lang, path, title, description, group, noindex, type = 'website', image = OG_IMAGE, publishedTime, modifiedTime, section } = opts;
  const languages: Record<string, string> = {};
  if (group && Object.keys(group).length > 1) {
    for (const l of ENABLED_LANGS) if (group[l]) languages[l] = absolute(group[l]!);
    if (group.en) languages['x-default'] = absolute(group.en);
  }
  // "Title | Ava" when it fits in 60 characters; otherwise the bare title, so it never gets cut off mid-word in results.
  const branded = `${title} | ${BRAND}`;
  const useBare = title.includes(BRAND) || branded.length > TITLE_LIMIT;
  const imageUrl = absolute(image);
  const article = type === 'article'
    ? { publishedTime: publishedTime ?? undefined, modifiedTime: modifiedTime ?? undefined, section: section ?? undefined }
    : {};
  return {
    title: useBare ? { absolute: title } : title,
    description,
    alternates: { canonical: absolute(path), ...(Object.keys(languages).length ? { languages } : {}) },
    openGraph: {
      title, description, url: absolute(path), type, locale: OG_LOCALE[lang], siteName: BRAND,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      ...article,
    } as Metadata['openGraph'],
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// ── JSON-LD ──────────────────────────────────────────────────────────────

export interface Crumb { name: string; path: string }

export function organizationLd() {
  return {
    '@type': 'Organization', '@id': ORG_ID, name: BRAND, url: SITE,
    logo: { '@type': 'ImageObject', url: absolute(LOGO_PATH), width: 512, height: 512 },
    image: absolute(OG_IMAGE),
    description: 'Ava is an AI period and cycle companion on Telegram, with free cycle calculators and plain-language guides.',
    sameAs: [BOT_URL],
  };
}

export function websiteLd() {
  return {
    '@type': 'WebSite', '@id': SITE_ID, url: SITE, name: BRAND,
    publisher: { '@id': ORG_ID }, inLanguage: [...ENABLED_LANGS],
  };
}

/** The breadcrumb node's @id is derived from the page it ends on, so webPageLd can point at it. */
export function breadcrumbLd(crumbs: Crumb[]) {
  const last = crumbs[crumbs.length - 1];
  return {
    '@type': 'BreadcrumbList', '@id': `${absolute(last.path)}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absolute(c.path) })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/**
 * One @graph per page. Organization and WebSite are always included (same @ids
 * everywhere) so search engines can connect every page to one publisher.
 */
export function graphLd(parts: object[]) {
  return { '@context': 'https://schema.org', '@graph': [organizationLd(), websiteLd(), ...parts] };
}

export function webPageLd(path: string, name: string, description: string, lang: Lang, opts: {
  type?: 'WebPage' | 'CollectionPage' | 'AboutPage'; breadcrumb?: boolean; image?: string; datePublished?: string | null; dateModified?: string | null;
} = {}) {
  const { type = 'WebPage', breadcrumb = true, image = OG_IMAGE, datePublished, dateModified } = opts;
  const url = absolute(path);
  return {
    '@type': type, '@id': `${url}#webpage`, url, name, description, inLanguage: lang,
    isPartOf: { '@id': SITE_ID }, publisher: { '@id': ORG_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: absolute(image), width: 1200, height: 630 },
    ...(breadcrumb ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
}

/** A hub page (tools list, blog list) as a CollectionPage with an ItemList of what it links to. */
export function collectionLd(path: string, name: string, description: string, lang: Lang, items: { name: string; path: string }[]) {
  return {
    ...webPageLd(path, name, description, lang, { type: 'CollectionPage' }),
    mainEntity: {
      '@type': 'ItemList', numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: absolute(it.path), name: it.name })),
    },
  };
}

export function articleLd(opts: {
  lang: Lang; path: string; headline: string; description: string; datePublished?: string | null; dateModified?: string | null;
  section?: string | null; words?: number; image?: string;
}) {
  const { lang, path, headline, description, datePublished, dateModified, section, words, image = OG_IMAGE } = opts;
  const url = absolute(path);
  return {
    '@type': 'Article', '@id': `${url}#article`, url,
    // Google recommends headlines under 110 characters.
    headline: headline.length > 110 ? `${headline.slice(0, 107).trimEnd()}…` : headline,
    description, inLanguage: lang, isAccessibleForFree: true,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID },
    image: [absolute(image)],
    ...(datePublished ? { datePublished } : {}),
    ...((dateModified ?? datePublished) ? { dateModified: dateModified ?? datePublished } : {}),
    ...(section ? { articleSection: section } : {}),
    ...(words ? { wordCount: words } : {}),
  };
}

export function softwareAppLd(opts: { lang: Lang; path: string; name: string; description: string }) {
  const { lang, path, name, description } = opts;
  return {
    '@type': 'SoftwareApplication', '@id': `${absolute(path)}#app`, name, description, url: absolute(path),
    applicationCategory: 'HealthApplication', operatingSystem: 'Web', inLanguage: lang, isAccessibleForFree: true,
    provider: { '@id': ORG_ID },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}
