import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDailyMorningAffirmation } from '@/lib/ava/affirmations';
import type { AvaUser } from '@/types';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendAffirmation(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

const ADMIN_TELEGRAM_ID = Number(process.env.ADMIN_TELEGRAM_ID || 5944321602);
async function notifyAdmin(context: string, err: unknown) {
  try {
    const detail = err instanceof Error ? err.message : String(err);
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ADMIN_TELEGRAM_ID, text: `⚠️ Ava cron error in ${context}:\n${detail.slice(0, 500)}` }),
    });
  } catch {
    // Nothing more we can do if even the alert fails.
  }
}

export async function GET(req: NextRequest) {
  // Triggered by an external service (cron-job.org), matching the pattern
  // used for cron/morning — plain query-param secret, same CRON_SECRET.
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('onboarding_complete', true)
      .eq('affirmations_enabled', true);

    if (!users?.length) return NextResponse.json({ sent: 0 });

    const text = getDailyMorningAffirmation();
    let sent = 0;
    for (const user of users as AvaUser[]) {
      try {
        await sendAffirmation(user.telegram_id, text);
        sent++;
      } catch (err) {
        console.error(`Affirmation send failed for ${user.telegram_id}:`, err);
      }
    }

    return NextResponse.json({ sent, total: users.length });
  } catch (err) {
    console.error('Affirmation cron error:', err);
    await notifyAdmin('cron/affirmation', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
