import { ENABLED_LANGS, HUB_MIN_PAGES, absolute, homePath, hubPath, toolPath } from '@/lib/site';
import { TOOLS, toolAlternates, toolsFor } from '@/lib/tools/registry';
export const revalidate = 86400;

// Hub-withholding rule (from naira.autos): a non-English language's home and
// tools hub only enter the sitemap once it has HUB_MIN_PAGES tools.
export function GET() {
  const urls: { loc: string; alt?: Record<string, string> }[] = [{ loc: absolute('/') }, { loc: absolute('/privacy') }, { loc: absolute('/terms') }];

  for (const lang of ENABLED_LANGS) {
    if (lang !== 'en' && toolsFor(lang).length < HUB_MIN_PAGES) continue;
    if (lang !== 'en') urls.push({ loc: absolute(homePath(lang)) });
    urls.push({ loc: absolute(hubPath(lang, 'tools')) });
  }
  for (const tool of TOOLS) {
    const group = toolAlternates(tool);
    const multi = Object.keys(group).length > 1;
    for (const lang of ENABLED_LANGS) {
      const t = tool.text[lang];
      if (!t) continue;
      const alt: Record<string, string> = {};
      if (multi) {
        for (const l of ENABLED_LANGS) if (group[l]) alt[l] = absolute(group[l]!);
        if (group.en) alt['x-default'] = absolute(group.en);
      }
      urls.push({ loc: absolute(toolPath(lang, t.slug)), alt });
    }
  }
  const body = urls.map(u => `  <url><loc>${u.loc}</loc>${Object.entries(u.alt ?? {}).map(([l, h]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`).join('')}</url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate' } });
}
