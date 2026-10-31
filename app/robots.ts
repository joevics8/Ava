import { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

const SCRAPERS = ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'PetalBot', 'Bytespider', 'BLEXBot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/login', '/premium/'] },
      ...SCRAPERS.map(userAgent => ({ userAgent, disallow: '/' })),
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
