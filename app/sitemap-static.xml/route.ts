import { ENABLED_LANGS, HUB_MIN_PAGES, absolute, homePath, hubPath, toolPath } from '@/lib/site';
import { TOOLS, toolAlternates, toolsFor } from '@/lib/tools/registry';
import { homeGroup, isIndexableHome } from '@/lib/seo';
export const revalidate = 86400;

type Entry = { loc: string; alt?: Record<string, string> };

/** xhtml:link alternates for a hreflang group, plus x-default → English. Empty unless the group has 2+ members. */
function alternates(group: Partial<Record<string, string>> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!group || Object.keys(group).length < 2) return out;
  for (const l of ENABLED_LANGS) if (group[l]) out[l] = absolute(group[l]!);
  if (group.en) out['x-default'] = absolute(group.en);
  return out;
}

// Hub-withholding rule (CLAUDE.md): a non-English home or tools hub only enters
// the sitemap once it has HUB_MIN_PAGES tools. This uses the same predicate that
// sets noindex on those pages, so the sitemap and the robots meta never disagree.
export function GET() {
  const urls: Entry[] = [{ loc: absolute('/'), alt: alternates(homeGroup()) }, { loc: absolute('/privacy') }, { loc: absolute('/terms') }];

  for (const lang of ENABLED_LANGS) {
    if (lang !== 'en' && isIndexableHome(lang)) urls.push({ loc: absolute(homePath(lang)), alt: alternates(homeGroup()) });
    if (lang === 'en' || toolsFor(lang).length >= HUB_MIN_PAGES) urls.push({ loc: absolute(hubPath(lang, 'tools')), alt: alternatesForHub() });
  }
  for (const tool of TOOLS) {
    const alt = alternates(toolAlternates(tool));
    for (const lang of ENABLED_LANGS) {
      const t = tool.text[lang];
      if (t) urls.push({ loc: absolute(toolPath(lang, t.slug)), alt });
    }
  }
  const body = urls.map(u => `  <url><loc>${u.loc}</loc>${Object.entries(u.alt ?? {}).map(([l, h]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`).join('')}</url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate' } });
}

function alternatesForHub() {
  const live = ENABLED_LANGS.filter(l => (l === 'en' ? toolsFor(l).length > 0 : toolsFor(l).length >= HUB_MIN_PAGES));
  return alternates(live.length > 1 ? Object.fromEntries(live.map(l => [l, hubPath(l, 'tools')])) : undefined);
}
