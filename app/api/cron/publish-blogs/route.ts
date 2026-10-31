import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { notifySearchEngines } from '@/lib/search-ping';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Releases queued drafts (published=false) at a steady drip: oldest first, at
// most DAILY_CAP per UTC day across all languages. Drafts are written
// separately and reviewed before they are queued — this route never
// generates content, it only schedules it.
const DAILY_CAP = Number(process.env.BLOG_DAILY_CAP || 1);

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get('authorization')?.replace(/^Bearer /, '') || req.nextUrl.searchParams.get('secret');
  if (!secret || given !== secret) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
  const { count, error: cErr } = await supabaseAdmin.from('blog_posts').select('id', { count: 'exact', head: true })
    .eq('published', true).gte('published_at', dayStart.toISOString());
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  const room = DAILY_CAP - (count ?? 0);
  if (room <= 0) return NextResponse.json({ published: 0, reason: 'daily cap reached' });

  const { data: drafts, error } = await supabaseAdmin.from('blog_posts').select('id,slug,language')
    .eq('published', false).order('created_at', { ascending: true }).limit(room);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!drafts?.length) return NextResponse.json({ published: 0, reason: 'no drafts queued' });

  const { error: uErr } = await supabaseAdmin.from('blog_posts')
    .update({ published: true, published_at: new Date().toISOString() }).in('id', drafts.map(d => d.id));
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  const ping = await notifySearchEngines(drafts);
  return NextResponse.json({ published: drafts.length, ping });
}
