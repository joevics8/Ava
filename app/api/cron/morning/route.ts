import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildMorningDigest, moodButtons } from '@/lib/ava/morning';
import type { AvaUser } from '@/types';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMorning(chatId: number, text: string, showButtons: boolean) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  };

  if (showButtons) {
    body.reply_markup = { inline_keyboard: moodButtons };
  }

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // All users — free and premium
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('onboarding_complete', true);

  if (!users?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const user of users as AvaUser[]) {
    try {
      const { data: cycle } = await supabaseAdmin
        .from('cycle_data').select('*').eq('user_id', user.id).single();

      // Free users get 14 days of logs, premium get 5 months
      const since = new Date();
      since.setDate(since.getDate() - (user.plan === 'premium' ? 150 : 14));

      const { data: logs } = await supabaseAdmin
        .from('memory_log').select('*').eq('user_id', user.id)
        .gte('logged_at', since.toISOString())
        .order('logged_at', { ascending: false }).limit(60);

      const { text, showMoodButtons } = await buildMorningDigest(user, cycle, logs || []);
      await sendMorning(user.telegram_id, text, showMoodButtons);
      sent++;
    } catch (err) {
      console.error(`Morning digest failed for ${user.telegram_id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: users.length });
}
