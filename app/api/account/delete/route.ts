import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = verifySessionCookie(req.cookies.get('ava_session')?.value);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { telegram_id } = session;
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_id', telegram_id).single();
  if (user) {
    await supabaseAdmin.from('memory_log').delete().eq('user_id', user.id);
    await supabaseAdmin.from('cycle_data').delete().eq('user_id', user.id);
    await supabaseAdmin.from('users').delete().eq('telegram_id', telegram_id);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('ava_session');
  return res;
}
