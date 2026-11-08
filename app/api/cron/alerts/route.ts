import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCycleStatus } from '@/lib/ava/cycle';
import { sortedPeriodDates } from '@/lib/ava/period';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

const ADMIN_TELEGRAM_ID = Number(process.env.ADMIN_TELEGRAM_ID || 5944321602);
async function notifyAdmin(context: string, err: unknown) {
  try {
    const detail = err instanceof Error ? err.message : String(err);
    await sendMessage(ADMIN_TELEGRAM_ID, `⚠️ Ava cron error in ${context}:\n${detail.slice(0, 500)}`);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all users with completed onboarding and cycle data
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*, cycle_data(*)')
    .eq('onboarding_complete', true);

  if (!users?.length) return NextResponse.json({ sent: 0 });

  const results = { period_soon: 0, fertile: 0, confirm: 0, contraception: 0 };

  for (const user of users) {
    // One user's bad data (a malformed date, a failed Telegram send)
    // previously could crash the whole loop for every remaining user —
    // this cron has no reason to be all-or-nothing per user.
    try {
    // Pregnant-mode users shouldn't get cycle-based alerts at all — "your
    // period is late", "did it start? reply yes/not yet", and fertile-window
    // warnings are all wrong (and confusing, potentially distressing) once
    // someone is already pregnant. This was previously unchecked, so a
    // pregnant user with leftover cycle_data would keep getting them — and
    // replying "yes" to the period-confirmation prompt would even log a
    // false period start while in pregnancy mode.
    if ((user as any).mode === 'pregnant') continue;

    const cycle = user.cycle_data?.[0];
    if (!cycle) continue;

    const name = user.name || 'there';
    const chatId = user.telegram_id;
    const goal = user.reproductive_goal;
    const wantsToConceive = goal === 'conceive';
    const preventingPregnancy = goal === 'prevent';

    // ── 1. Period arriving soon (3 days before) ────────────────────────────
    if (cycle.next_period_start) {
      const nextPeriod = new Date(cycle.next_period_start);
      nextPeriod.setHours(0, 0, 0, 0);
      const daysUntil = daysBetween(today, nextPeriod);

      if (daysUntil === 3) {
        await sendMessage(chatId,
          `Hey ${name} 🌸 Your period is likely in about *3 days*.\n\nMight be a good time to stock up on pads or tampons, and go easy on yourself if you're feeling off.`
        );
        results.period_soon++;
      }

      // The on-the-day "is your period out?" question now goes out in place of
      // the morning digest (see app/api/cron/morning), for up to 3 mornings.
    }

    // ── 3. Late-period check-ins ────────────────────────────────────────────
    // Anchored to the most likely date (last period + cycle length), NOT the
    // start of the prediction window. The old check fired "3 days late" three
    // days after the window OPENED — i.e. only ~1 day past the most likely
    // date and still inside the normal window — telling people they were late
    // when they were not.
    const startDates: string[] = sortedPeriodDates(cycle.period_start_dates);
    if (startDates.length > 0) {
      const st = getCycleStatus(
        new Date(startDates[startDates.length - 1]),
        Number(cycle.avg_cycle_length) || 28,
        cycle.period_duration || 5
      );

      if (st.daysPastExpected === 3) {
        await sendMessage(chatId,
          `Hey ${name} 🌸 Your period is about 3 days past your expected date. That's common — illness, stress, travel and poor sleep can all shift it, so there's no need to worry yet.\n\nIf there's any chance you could be pregnant, a home test is reliable from the first day of a missed period (first-morning urine works best).\n\nHas it started? Reply *yes* or *not yet* and I'll update your cycle.`
        );
        // Same hook as the on-time prompt, so "yes" logs the period start.
        await supabaseAdmin.from('users').update({ onboarding_step: 85 }).eq('id', user.id);
      }

      if (st.daysPastExpected === 7) {
        await sendMessage(chatId,
          `Hey ${name} 🌸 It's been about a week past your expected date. If you haven't tested yet and there's any chance of pregnancy, now is a good time. If a test is negative and nothing has come after another few days, or you have strong pain, dizziness or heavy bleeding, it's worth getting checked at a clinic.\n\nHas it started? Reply *yes* or *not yet*.`
        );
        await supabaseAdmin.from('users').update({ onboarding_step: 85 }).eq('id', user.id);
      }
    }

    // ── 4. Fertile window alert ─────────────────────────────────────────────
    if (cycle.next_ovulation_start && cycle.next_ovulation_end) {
      const ovStart = new Date(cycle.next_ovulation_start);
      ovStart.setHours(0, 0, 0, 0);
      const daysToOv = daysBetween(today, ovStart);

      if (daysToOv === 1) {
        if (wantsToConceive) {
          await sendMessage(chatId,
            `✨ ${name}, your fertile window starts *tomorrow* — this is your best time to try if you're planning.\n\nHow are you feeling going into this window?`
          );
        } else if (preventingPregnancy) {
          await sendMessage(chatId,
            `⚠️ ${name}, heads up — your fertile window starts *tomorrow*.\n\nIf you're avoiding pregnancy, be extra careful over the next few days.`
          );
        } else {
          await sendMessage(chatId,
            `✨ ${name}, your fertile window starts *tomorrow* — you'll be most fertile for the next few days.\n\nJust keeping you in the loop 🌸`
          );
        }
        results.fertile++;
      }
    }

    // ── 5. Contraception reminder (pill users) ──────────────────────────────
    if (user.birth_control &&
      ['pill', 'pills', 'contraceptive pill', 'oral contraceptive'].some(
        bc => user.birth_control.toLowerCase().includes(bc)
      )
    ) {
      await sendMessage(chatId,
        `💊 Just a reminder to take your pill today, ${name} 🌸`
      );
      results.contraception++;
    }
    } catch (err) {
      console.error('Alert cron per-user error:', user.telegram_id, err);
    }
  }

  // ── Premium renewal reminders ────────────────────────────────────────────
  const { data: premiumUsers } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('plan', 'premium')
    .not('premium_expires_at', 'is', null);

  for (const u of premiumUsers || []) {
    try {
    const expires = new Date(u.premium_expires_at);
    const daysLeft = Math.ceil((expires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft === 3) {
      await sendMessage(u.telegram_id,
        `Hey ${u.name} 🌸 Your Ava Premium expires in *3 days*.

Send /premium to renew and keep your full memory and daily digest.`
      );
    }
    } catch (err) {
      console.error('Renewal reminder per-user error:', u.telegram_id, err);
    }
  }

  return NextResponse.json({ ...results, total_users: users.length });
  } catch (err) {
    console.error('Alerts cron error:', err);
    await notifyAdmin('cron/alerts', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
