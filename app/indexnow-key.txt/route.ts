import { indexNowKey } from '@/lib/search-ping';
export const dynamic = 'force-dynamic';
export function GET() {
  const key = indexNowKey();
  return key ? new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }) : new Response('Not found', { status: 404 });
}
