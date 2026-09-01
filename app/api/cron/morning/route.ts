import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildTodaySummary } from '@/lib/ava/today';
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

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('plan', 'premium')
    .eq('onboarding_complete', true);

  if (error || !users?.length) {
    return NextResponse.json({ sent: 0, message: 'No premium users yet' });
  }

  let sent = 0;
  for (const user of users as AvaUser[]) {
    try {
      const summary = await buildTodaySummary(user);
      await sendMessage(user.telegram_id, summary);
      sent++;
    } catch (err) {
      console.error(`Failed for ${user.telegram_id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: users.length });
}
