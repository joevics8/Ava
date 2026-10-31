import { SITE, blogPath, isLang } from '@/lib/site';

// IndexNow (Bing, Yandex, Seznam, Naver). Google has no open ping: it finds
// new posts through the sitemap, so we just keep sitemap-blogs.xml fresh.
export const indexNowKey = () => process.env.INDEXNOW_KEY || '';

export async function notifySearchEngines(posts: { slug: string; language?: string | null }[]) {
  const urls = posts.map(p => `${SITE}${blogPath(p.language && isLang(p.language) ? p.language : 'en', p.slug)}`);
  const key = indexNowKey();
  if (!urls.length || !key) return { urls, indexNow: 'skipped' };
  try {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation: `${SITE}/indexnow-key.txt`, urlList: urls }),
    });
    return { urls, indexNow: r.status };
  } catch (e) { return { urls, indexNow: String(e) }; }
}
