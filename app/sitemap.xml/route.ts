import { SITE } from '@/lib/site';
import { supabase } from '@/lib/supabase';
export const revalidate = 3600;

// <lastmod> is only worth including when it is true: search engines learn to
// ignore sitemaps whose dates always say "now". The blog sitemap's date is the
// newest post change; the static sitemap has no reliable date, so it has none.
export async function GET() {
  let blogMod: string | null = null;
  try {
    const { data } = await supabase.from('blog_posts').select('updated_at').eq('published', true).order('updated_at', { ascending: false }).limit(1);
    if (data?.[0]?.updated_at) blogMod = new Date(data[0].updated_at).toISOString();
  } catch (e) { console.error('sitemap index', e); }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE}/sitemap-static.xml</loc></sitemap>
  <sitemap><loc>${SITE}/sitemap-blogs.xml</loc>${blogMod ? `<lastmod>${blogMod}</lastmod>` : ''}</sitemap>
</sitemapindex>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate' } });
}
