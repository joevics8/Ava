import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

      // ── 2. Period confirmation (on predicted start date) ────────────────
      if (daysUntil === 0) {
        await sendMessage(chatId,
          `Hey ${name} — today is around when your period was expected 🩸\n\nDid it start? Just reply *yes* or *not yet* and I'll update your cycle.`
        );
        results.confirm++;
      }

      // ── 3. Late period alert (3 days late) ─────────────────────────────
      if (daysUntil === -3) {
        await sendMessage(chatId,
          `Hey ${name} 🌸 Your period is about 3 days late — that's not unusual, but worth noting.\n\nWant to log a pregnancy test, or just let me know how you're feeling?`
        );
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
  }

  // ── Premium renewal reminders ────────────────────────────────────────────
  const { data: premiumUsers } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('plan', 'premium')
    .not('premium_expires_at', 'is', null);

  for (const u of premiumUsers || []) {
    const expires = new Date(u.premium_expires_at);
    const daysLeft = Math.ceil((expires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft === 3) {
      await sendMessage(u.telegram_id,
        `Hey ${u.name} 🌸 Your Ava Premium expires in *3 days*.

Send /premium to renew and keep your full memory and daily digest.`
      );
    }
  }

  return NextResponse.json({ ...results, total_users: users.length });
}
