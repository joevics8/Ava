import { supabase } from '@/lib/supabase';
import { ENABLED_LANGS, absolute, blogPath, isLang } from '@/lib/site';
export const revalidate = 3600;

// Posts that are translations of each other share a translation_group; each one
// lists all the others as hreflang alternates (reciprocal, with x-default → English).
export async function GET() {
  let rows: { slug: string; language: string; updated_at: string | null; translation_group: string | null }[] = [];
  try {
    const { data } = await supabase.from('blog_posts').select('slug,language,updated_at,translation_group')
      .eq('published', true).order('updated_at', { ascending: false }).limit(5000);
    rows = data ?? [];
  } catch (e) { console.error('sitemap-blogs', e); }

  const live = rows.filter(r => isLang(r.language) && (ENABLED_LANGS as readonly string[]).includes(r.language));
  const groups = new Map<string, typeof live>();
  for (const r of live) if (r.translation_group) groups.set(r.translation_group, [...(groups.get(r.translation_group) ?? []), r]);

  const urls = live.map(r => {
    const members = r.translation_group ? groups.get(r.translation_group) ?? [] : [];
    const alt = members.length > 1
      ? members.map(m => `<xhtml:link rel="alternate" hreflang="${m.language}" href="${absolute(blogPath(m.language as any, m.slug))}"/>`).join('')
        + (members.find(m => m.language === 'en') ? `<xhtml:link rel="alternate" hreflang="x-default" href="${absolute(blogPath('en', members.find(m => m.language === 'en')!.slug))}"/>` : '')
      : '';
    return `  <url><loc>${absolute(blogPath(r.language as any, r.slug))}</loc>${r.updated_at ? `<lastmod>${new Date(r.updated_at).toISOString()}</lastmod>` : ''}${alt}</url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate' } });
}
