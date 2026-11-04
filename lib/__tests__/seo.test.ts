import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ENABLED_LANGS, HUB_MIN_PAGES, SITE } from '@/lib/site';
import { TOOLS, toolAlternates, toolsFor } from '@/lib/tools/registry';
import { UI } from '@/lib/ui-strings';
import {
  DESCRIPTION_LIMIT, ORG_ID, SITE_ID, TITLE_LIMIT, articleLd, breadcrumbLd, collectionLd, graphLd, homeGroup, indexableHomeLangs, pageMetadata, webPageLd,
} from '@/lib/seo';
import { Markdown } from '@/components/site/Markdown';

const withBrand = (t: string) => `${t} | Ava`;

describe('tool page copy (CLAUDE.md page checklist)', () => {
  const rows = TOOLS.flatMap(tool => Object.entries(tool.text).map(([lang, text]) => ({ id: tool.id, lang, text: text! })));

  it.each(rows.map(r => [`${r.id} (${r.lang})`, r] as const))('%s: title and description fit in search results', (_n, { text }) => {
    expect(withBrand(text.title).length).toBeLessThanOrEqual(TITLE_LIMIT);
    expect(text.description.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
    expect(text.description.length).toBeGreaterThan(70);
  });

  it.each(rows.map(r => [`${r.id} (${r.lang})`, r] as const))('%s: has a heading, intro and at least 4 FAQs', (_n, { text }) => {
    expect(text.h1.length).toBeGreaterThan(3);
    expect(text.intro.length).toBeGreaterThan(40);
    expect(text.faqs.length).toBeGreaterThanOrEqual(4);
    for (const f of text.faqs) { expect(f.q.trim()).not.toBe(''); expect(f.a.trim()).not.toBe(''); }
  });

  it('slugs are lowercase ASCII and unique within a language', () => {
    for (const lang of ENABLED_LANGS) {
      const slugs = toolsFor(lang).map(({ text }) => text.slug);
      for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it('titles and descriptions are unique across the site', () => {
    const titles = rows.map(r => r.text.title);
    const descs = rows.map(r => r.text.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descs).size).toBe(descs.length);
  });

  it('hreflang groups are reciprocal: every language of a tool lists every other', () => {
    for (const tool of TOOLS) {
      const group = toolAlternates(tool);
      expect(Object.keys(group).sort()).toEqual(ENABLED_LANGS.filter(l => tool.text[l]).sort());
    }
  });
});

describe('hub and home copy per language', () => {
  for (const lang of ENABLED_LANGS) {
    const t = UI[lang]!;
    it(`${lang}: hub titles and descriptions fit`, () => {
      for (const title of [t.toolsTitle, t.blogTitle]) expect(withBrand(title).length).toBeLessThanOrEqual(TITLE_LIMIT);
      for (const d of [t.toolsDesc, t.blogDesc]) expect(d.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
    });
  }
});

describe('pageMetadata', () => {
  const base = { lang: 'en' as const, path: '/tools', description: 'x'.repeat(100) };

  it('adds the brand when it fits in 60 characters, otherwise uses the bare title', () => {
    expect(pageMetadata({ ...base, title: 'Short title' }).title).toBe('Short title');
    const long = 'A'.repeat(58);
    expect(pageMetadata({ ...base, title: long }).title).toEqual({ absolute: long });
    expect(pageMetadata({ ...base, title: 'Ava: AI period tracker' }).title).toEqual({ absolute: 'Ava: AI period tracker' });
  });

  it('sets canonical, locale, share image and a Twitter card', () => {
    const m = pageMetadata({ ...base, title: 'T' });
    expect(m.alternates?.canonical).toBe(`${SITE}/tools`);
    expect((m.openGraph as any).locale).toBe('en_US');
    expect((m.openGraph as any).images[0].url).toBe(`${SITE}/og-image.png`);
    expect((m.twitter as any).card).toBe('summary_large_image');
  });

  it('emits hreflang with x-default only for groups of two or more', () => {
    const solo = pageMetadata({ ...base, title: 'T', group: { en: '/tools' } });
    expect(solo.alternates?.languages).toBeUndefined();
    const pair = pageMetadata({ ...base, title: 'T', group: { en: '/tools', es: '/es/herramientas' } });
    expect(pair.alternates?.languages).toEqual({ en: `${SITE}/tools`, es: `${SITE}/es/herramientas`, 'x-default': `${SITE}/tools` });
  });

  it('noindex keeps links followable', () => {
    expect(pageMetadata({ ...base, title: 'T', noindex: true }).robots).toEqual({ index: false, follow: true });
  });
});

describe('home page indexability', () => {
  it('a non-English home is indexable only once it has enough tools', () => {
    const expected = ENABLED_LANGS.filter(l => l === 'en' || toolsFor(l).length >= HUB_MIN_PAGES);
    expect(indexableHomeLangs()).toEqual(expected);
  });
  it('hreflang for the home is offered only when two or more homes are indexable', () => {
    expect(homeGroup() !== undefined).toBe(indexableHomeLangs().length > 1);
  });
});

describe('JSON-LD', () => {
  it('every graph carries the same Organization and WebSite nodes', () => {
    const g: any = graphLd([]);
    const ids = g['@graph'].map((n: any) => n['@id']);
    expect(ids).toContain(ORG_ID);
    expect(ids).toContain(SITE_ID);
    const org = g['@graph'].find((n: any) => n['@id'] === ORG_ID);
    expect(org.logo.url).toBe(`${SITE}/logo.png`);
  });

  it('the page node points at the breadcrumb node that actually exists', () => {
    const path = '/tools/period-calculator';
    const page: any = webPageLd(path, 'T', 'D', 'en');
    const crumbs: any = breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Period', path }]);
    expect(page.breadcrumb['@id']).toBe(crumbs['@id']);
    expect(crumbs.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
  });

  it('article headlines stay under Google’s 110-character limit and include dates', () => {
    const a: any = articleLd({ lang: 'en', path: '/blog/x', headline: 'H'.repeat(150), description: 'd', datePublished: '2026-11-01T00:00:00Z', words: 900 });
    expect(a.headline.length).toBeLessThanOrEqual(110);
    expect(a.datePublished).toBe('2026-11-01T00:00:00Z');
    expect(a.dateModified).toBe('2026-11-01T00:00:00Z');
    expect(a.wordCount).toBe(900);
    expect(a.author['@id']).toBe(ORG_ID);
  });

  it('hub pages list what they link to', () => {
    const c: any = collectionLd('/tools', 'Tools', 'D', 'en', [{ name: 'A', path: '/tools/a' }, { name: 'B', path: '/tools/b' }]);
    expect(c['@type']).toBe('CollectionPage');
    expect(c.mainEntity.numberOfItems).toBe(2);
    expect(c.mainEntity.itemListElement[1].url).toBe(`${SITE}/tools/b`);
  });
});

describe('Markdown renderer', () => {
  const render = (md: string) => renderToStaticMarkup(createElement(Markdown, null, md));

  it('renders headings with anchor ids and demotes a body h1 to h2', () => {
    const html = render('# Big\n\n## Second\n\n### Third');
    expect(html).not.toContain('<h1');
    expect(html).toContain('<h2 id="big">Big</h2>');
    expect(html).toContain('<h2 id="second">Second</h2>');
    expect(html).toContain('<h3 id="third">Third</h3>');
  });

  it('renders GitHub-flavoured tables inside a scroll wrapper', () => {
    const html = render('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('overflow-x-auto');
  });

  it('does not render raw HTML or scripts', () => {
    const html = render('Hello <script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img[^>]*onerror/i);
  });

  it('turns javascript:, data: and vbscript: links into plain text', () => {
    for (const md of ['[x](javascript:alert(1))', '[x](JaVaScRiPt:alert(1))', '[x](data:text/html;base64,AAAA)', '[x](vbscript:msgbox(1))']) {
      const html = render(md);
      expect(html).not.toMatch(/<a[\s>]/i);
      expect(html).not.toMatch(/href=/i);
      expect(html).toContain('<span>x</span>');
    }
  });

  it('does not leak react-markdown internals onto the DOM', () => {
    expect(render('# Big')).not.toContain('level=');
  });

  it('keeps same-site links internal and opens external links safely', () => {
    const internal = render('[tools](/tools/period-calculator)');
    expect(internal).toContain('href="/tools/period-calculator"');
    expect(internal).not.toContain('target=');
    const external = render('[who](https://www.who.int/)');
    expect(external).toContain('rel="noopener noreferrer"');
    expect(external).toContain('target="_blank"');
  });

  it('lazy-loads images and always emits alt text', () => {
    const html = render('![Cycle chart](https://example.com/c.png)');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('alt="Cycle chart"');
  });
});
