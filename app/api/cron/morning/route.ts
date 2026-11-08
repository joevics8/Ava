import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildMorningDigest, moodButtons } from '@/lib/ava/morning';
import { getCycleStatus } from '@/lib/ava/cycle';
import { latestPeriodStart, localDateStr, periodCheckButtons, periodCheckMessage, periodCheckNote, planPeriodCheck } from '@/lib/ava/period';
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

      // "Is your period out?" For the first 3 mornings it REPLACES the digest, which
      // would otherwise start counting days past the expected date before she has
      // answered. From morning 4 the digest comes back and the question follows it.
      // Asking continues for as long as she keeps answering (Yes or No); it stops
      // after 3 asked mornings in a row go unanswered. Pregnant users are skipped.
      const plan = (user as any).mode === 'pregnant' ? null : planPeriodCheck(cycle);
      const askPeriodCheck = async () => {
        if (!plan) return;
        const last = latestPeriodStart(cycle);
        const status = last ? getCycleStatus(last, Number(cycle.avg_cycle_length) || 28, cycle.period_duration || 5) : null;
        const note = status ? periodCheckNote(status.daysPastExpected) : '';
        const hour = new Date().getUTCHours() + 1;
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        await sendMorning(
          user.telegram_id,
          periodCheckMessage(user.name || 'there', plan.check, greeting, note, plan.replaceDigest),
          false,
          periodCheckButtons(plan.check.date),
        );
        const { error: stateErr } = await supabaseAdmin.from('cycle_data').update({
          period_check_for: plan.check.date,
          period_check_last_asked: localDateStr(),
          period_check_unanswered: plan.unansweredAfter,
        }).eq('user_id', user.id);
        // If this fails the migration 20261108100000_period_check_state.sql has not been run.
        if (stateErr) console.error('Period check state not saved (run the migration):', stateErr.message);
        // Lets a typed "yes"/"no" answer the question too (webhook only honours those when this is set).
        await supabaseAdmin.from('users').update({ onboarding_step: 85 }).eq('id', user.id);
      };
      if (plan?.replaceDigest) {
        await askPeriodCheck();
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
      await askPeriodCheck();
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
