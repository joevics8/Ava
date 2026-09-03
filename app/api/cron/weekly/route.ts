import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateWeeklyBriefing } from '@/lib/ava/insights';
import type { AvaUser } from '@/types';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('plan', 'premium')
    .eq('onboarding_complete', true);

  if (!users?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const user of users as AvaUser[]) {
    try {
      const { data: cycle } = await supabaseAdmin
        .from('cycle_data').select('*').eq('user_id', user.id).single();
      const { data: logs } = await supabaseAdmin
        .from('memory_log').select('*').eq('user_id', user.id)
        .order('logged_at', { ascending: false }).limit(60);

      const briefing = await generateWeeklyBriefing(user, logs || [], cycle);
      await sendMessage(user.telegram_id, `📊 *Your Weekly Briefing*\n\n${briefing}`);
      sent++;
    } catch (err) {
      console.error(`Weekly briefing failed for ${user.telegram_id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: users.length });
}
