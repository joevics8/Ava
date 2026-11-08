import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildMorningDigest, moodButtons } from '@/lib/ava/morning';
import { periodCheckFor, periodCheckButtons, periodCheckMessage } from '@/lib/ava/period';
import type { AvaUser } from '@/types';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMorning(chatId: number, text: string, showButtons: boolean, keyboard?: unknown) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
  };

  if (keyboard) {
    body.reply_markup = { inline_keyboard: keyboard };
  } else if (showButtons) {
    body.reply_markup = { inline_keyboard: moodButtons };
  }

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
  // Triggered by an external service (cron-job.org), not Vercel's native
  // cron — plain query-param secret, matching the original setup.
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

      // On the expected day (and the next two mornings) ask "is your period
      // out?" INSTEAD of the digest. The digest would otherwise start counting
      // days past the expected date before she has had a chance to answer.
      // Pregnant users never get this. After 3 unanswered mornings the check
      // lapses, the digest resumes, and the old date stays in use.
      const check = (user as any).mode === 'pregnant' ? null : periodCheckFor(cycle);
      if (check) {
        const hour = new Date().getUTCHours() + 1;
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        await sendMorning(user.telegram_id, periodCheckMessage(user.name || 'there', check, greeting), false, periodCheckButtons(check.date));
        // Lets a typed "yes"/"no" answer the question too (webhook only honours those when this is set).
        await supabaseAdmin.from('users').update({ onboarding_step: 85 }).eq('id', user.id);
        sent++;
        continue;
      }

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
  } catch (err) {
    console.error('Morning cron error:', err);
    await notifyAdmin('cron/morning', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
