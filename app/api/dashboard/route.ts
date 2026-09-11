import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySessionCookie } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = verifySessionCookie(req.cookies.get('ava_session')?.value);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { telegram_id } = session;

  const [userRes, cycleRes, logsRes] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('telegram_id', telegram_id).single(),
    supabaseAdmin.from('cycle_data').select('*').eq('user_id',
      (await supabaseAdmin.from('users').select('id').eq('telegram_id', telegram_id).single()).data?.id
    ).single(),
    supabaseAdmin.from('memory_log')
      .select('*')
      .eq('user_id',
        (await supabaseAdmin.from('users').select('id').eq('telegram_id', telegram_id).single()).data?.id
      )
      .order('logged_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    user: userRes.data,
    cycle: cycleRes.data,
    logs: logsRes.data,
  });
}
