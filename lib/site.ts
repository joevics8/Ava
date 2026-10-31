// Single source of truth for site-wide constants and URL building.
// Pattern copied from naira.autos: English lives at the root, every other
// language lives under /{lang}/ with a translated hub segment.

export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://avacare-alpha.vercel.app').replace(/\/$/, '');

// Bare bot URL on purpose: the bot treats "/start <payload>" as a referral code.
export const BOT_URL = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'Ava_care_bot'}`;

export const LANGS = ['en', 'es', 'pt', 'fr', 'de', 'id', 'hi', 'ar', 'tr', 'it'] as const;
export type Lang = (typeof LANGS)[number];

// A language is only routable once its content exists. Add codes here as each
// language wave ships (see CLAUDE.md → "Adding a language").
export const ENABLED_LANGS: readonly Lang[] = ['en', 'es'];

export const LANG_NAMES: Record<Lang, string> = {
  en: 'English', es: 'Español', pt: 'Português', fr: 'Français', de: 'Deutsch',
  id: 'Bahasa Indonesia', hi: 'हिन्दी', ar: 'العربية', tr: 'Türkçe', it: 'Italiano',
};

export const RTL_LANGS: readonly Lang[] = ['ar'];

// Translated hub segments (ASCII slugs, like naira.autos).
export const SEGMENTS: Record<Lang, { tools: string; blog: string }> = {
  en: { tools: 'tools', blog: 'blog' },
  es: { tools: 'herramientas', blog: 'blog' },
  pt: { tools: 'ferramentas', blog: 'blog' },
  fr: { tools: 'outils', blog: 'blog' },
  de: { tools: 'werkzeuge', blog: 'blog' },
  id: { tools: 'alat', blog: 'blog' },
  hi: { tools: 'upkaran', blog: 'blog' },
  ar: { tools: 'adawat', blog: 'blog' },
  tr: { tools: 'araclar', blog: 'blog' },
  it: { tools: 'strumenti', blog: 'blog' },
};

export function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v);
}
export function isEnabledLang(v: string): v is Lang {
  return isLang(v) && ENABLED_LANGS.includes(v);
}

const prefix = (lang: Lang) => (lang === 'en' ? '' : `/${lang}`);

export const homePath = (lang: Lang) => (lang === 'en' ? '/' : `/${lang}`);
export const hubPath = (lang: Lang, kind: 'tools' | 'blog') => `${prefix(lang)}/${SEGMENTS[lang][kind]}`;
export const toolPath = (lang: Lang, slug: string) => `${hubPath(lang, 'tools')}/${slug}`;
export const blogPath = (lang: Lang, slug: string) => `${hubPath(lang, 'blog')}/${slug}`;
export const absolute = (path: string) => `${SITE}${path === '/' ? '' : path}`;

/** Resolve /{lang}/{hub} back to a hub kind, or null when the segment is wrong for that language. */
export function hubKind(lang: Lang, segment: string): 'tools' | 'blog' | null {
  if (SEGMENTS[lang].tools === segment) return 'tools';
  if (SEGMENTS[lang].blog === segment) return 'blog';
  return null;
}

// Hub pages stay out of the sitemap (and noindex) until a language has this
// many pages of that kind — thin hubs hurt more than they help.
export const HUB_MIN_PAGES = 5;
