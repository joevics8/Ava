import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { predictNextPeriod, predictOvulationWindow } from '@/lib/ava/cycle';

export async function POST(req: NextRequest) {
  const session = req.cookies.get('ava_session');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { telegram_id } = JSON.parse(session.value);
  const { last_period, cycle_length, period_duration } = await req.json();
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('telegram_id', telegram_id).single();
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const lastDate = new Date(last_period);
  const avg = parseInt(cycle_length) || 28;
  const dur = parseInt(period_duration) || 5;
  const { start: ns, end: ne, confidence } = predictNextPeriod(lastDate, avg);
  const { start: os, end: oe } = predictOvulationWindow(ns, avg);

  await supabaseAdmin.from('cycle_data').upsert({
    user_id: user.id,
    period_start_dates: [lastDate.toISOString().split('T')[0]],
    avg_cycle_length: avg, period_duration: dur,
    next_period_start: ns.toISOString().split('T')[0],
    next_period_end: ne.toISOString().split('T')[0],
    next_ovulation_start: os.toISOString().split('T')[0],
    next_ovulation_end: oe.toISOString().split('T')[0],
    confidence_pct: confidence,
    updated_at: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
