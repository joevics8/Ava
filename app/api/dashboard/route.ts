import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySessionCookie } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = verifySessionCookie(req.cookies.get('ava_session')?.value);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { telegram_id } = session;

  const { data: user } = await supabaseAdmin
    .from('users').select('*').eq('telegram_id', telegram_id).single();

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Free users are only meant to have 14 days of memory retained (150 for
  // premium — see getMemoryContext) — this query previously had no date
  // filter at all, so a free user's dashboard could show history well
  // beyond what they're supposed to have access to.
  const daysBack = user.plan === 'premium' ? 150 : 14;
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const [cycleRes, logsRes] = await Promise.all([
    supabaseAdmin.from('cycle_data').select('*').eq('user_id', user.id).single(),
    supabaseAdmin.from('memory_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', since.toISOString())
      .order('logged_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    user,
    cycle: cycleRes.data,
    logs: logsRes.data,
  });
}
