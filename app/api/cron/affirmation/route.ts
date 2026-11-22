import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDailyMorningAffirmation } from '@/lib/ava/affirmations';
import type { AvaUser } from '@/types';
import { sendTelegram } from '@/lib/telegram';
import { DEFAULT_TZ, localDateIn, morningDue, useUserTimezone } from '@/lib/ava/timezone';

async function sendAffirmation(chatId: number, text: string) {
  await sendTelegram(chatId, text);
}

const ADMIN_TELEGRAM_ID = Number(process.env.ADMIN_TELEGRAM_ID || 5944321602);
async function notifyAdmin(context: string, err: unknown) {
  try {
    const detail = err instanceof Error ? err.message : String(err);
    await sendTelegram(ADMIN_TELEGRAM_ID, `⚠️ Ava cron error in ${context}:\n${detail.slice(0, 500)}`);
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
    const { listTracks, trackForDay, sendTrack } = await import('@/lib/ava/audio');
    const motivation = trackForDay(await listTracks('motivation'));
    let sent = 0;
    for (const user of users as AvaUser[]) {
      try {
        const tz = (user as any).timezone || DEFAULT_TZ;
        useUserTimezone(tz);
        if (!morningDue(tz, (user as any).affirmation_last_sent_on)) continue;
        await sendAffirmation(user.telegram_id, text);
        if (motivation) await sendTrack(user.telegram_id, motivation, 'Today’s motivation 🌸');
        await supabaseAdmin.from('users').update({ affirmation_last_sent_on: localDateIn(new Date(), tz) }).eq('id', user.id);
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
