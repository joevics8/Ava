import { supabase } from '@/lib/supabase';
import { absolute, blogPath, isLang } from '@/lib/site';
export const revalidate = 3600;

export async function GET() {
  let rows: { slug: string; language: string; updated_at: string | null }[] = [];
  try {
    const { data } = await supabase.from('blog_posts').select('slug,language,updated_at').eq('published', true).order('updated_at', { ascending: false }).limit(5000);
    rows = data ?? [];
  } catch (e) { console.error('sitemap-blogs', e); }
  const urls = rows.filter(r => isLang(r.language)).map(r =>
    `  <url><loc>${absolute(blogPath(r.language as any, r.slug))}</loc>${r.updated_at ? `<lastmod>${new Date(r.updated_at).toISOString()}</lastmod>` : ''}</url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate' } });
}
