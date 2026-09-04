import { updateUser, upsertCycleData, getCycleData } from './db';
import { calcAverageCycleLength, predictNextPeriod, predictOvulationWindow } from './cycle';
import { supabaseAdmin } from '@/lib/supabase';
import type { AvaUser } from '@/types';

type SendFn = (chatId: number, text: string, markdown?: boolean) => Promise<void>;

function parseDate(input: string): Date | null {
  const cleaned = input.replace(/(\d+)(st|nd|rd|th)/gi, '$1').replace(/,/g, '').trim();
  const d = new Date(cleaned);
  const now = new Date();
  if (!isNaN(d.getTime()) && d.getFullYear() >= 1990 && d <= now) return d;
  return null;
}

// Step 90 = settings menu, 91-96 = individual setting flows, 99 = delete confirm
export async function handleSettingsStep(
  chatId: number,
  telegramId: number,
  user: AvaUser,
  message: string,
  send: SendFn
): Promise<void> {
  const step = user.onboarding_step;
  const text = message.trim();

  // ── Settings menu selection ───────────────────────────────────────────────
  if (step === 90) {
    switch (text) {
      case '1':
        await updateUser(telegramId, { onboarding_step: 91 });
        await send(chatId, `What would you like your name to be?`);
        break;
      case '2':
        await updateUser(telegramId, { onboarding_step: 92 });
        await send(chatId, `When did your last period start?\n\n_Example: 15 Aug 2026_`);
        break;
      case '3':
        await updateUser(telegramId, { onboarding_step: 93 });
        await send(chatId, `How long is your cycle usually? _(e.g. 28, 30, 32 days)_`);
        break;
      case '4':
        await updateUser(telegramId, { onboarding_step: 94 });
        await send(chatId, `How many days does your period usually last? _(e.g. 5)_`);
        break;
      case '5':
        await updateUser(telegramId, { onboarding_step: 95 });
        await send(chatId,
          `What's your main goal?\n\n1. Track my cycle\n2. Plan pregnancy\n3. Avoid pregnancy\n4. Understand my body`
        );
        break;
      case '6': {
        const isPregnant = (user as any).mode === 'pregnant';
        await updateUser(telegramId, { onboarding_step: 96 });
        await send(chatId, isPregnant
          ? `You're currently in *pregnancy mode* 🤰\n\nSend *1* to switch back to cycle tracking.`
          : `You're currently in *cycle tracking mode* 🌸\n\nSend *1* to switch to pregnancy mode.`
        );
        break;
      }
      case '7':
        await updateUser(telegramId, { onboarding_step: 99 });
        await send(chatId, `⚠️ Are you sure you want to delete *all* your data? This cannot be undone.\n\nSend *YES DELETE* to confirm or anything else to cancel.`);
        break;
      default:
        await updateUser(telegramId, { onboarding_step: 0 });
        await send(chatId, `No problem — settings closed. Just talk to me anytime 🌸`);
    }
    return;
  }

  // ── Update name ───────────────────────────────────────────────────────────
  if (step === 91) {
    const name = text.split(' ')[0];
    await updateUser(telegramId, { name, onboarding_step: 0 });
    await send(chatId, `Done — I'll call you ${name} from now on 🌸`);
    return;
  }

  // ── Update last period date ───────────────────────────────────────────────
  if (step === 92) {
    const d = parseDate(text);
    if (!d) {
      await send(chatId, `Couldn't read that date. Try: *15 Aug 2026*`);
      return;
    }
    const existing = await getCycleData(user.id);
    const avg = Number(existing?.avg_cycle_length) || 28;
    const { start: ns, end: ne, confidence } = predictNextPeriod(d, avg);
    const { start: os, end: oe } = predictOvulationWindow(ns, avg);

    await upsertCycleData(user.id, {
      period_start_dates: [d.toISOString().split('T')[0]],
      next_period_start: ns.toISOString().split('T')[0],
      next_period_end: ne.toISOString().split('T')[0],
      next_ovulation_start: os.toISOString().split('T')[0],
      next_ovulation_end: oe.toISOString().split('T')[0],
      confidence_pct: confidence,
    });

    await updateUser(telegramId, { onboarding_step: 0 });
    const nextStr = ns.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    await send(chatId, `Updated 🌸 Your next period is now estimated around *${nextStr}*.`);
    return;
  }

  // ── Update cycle length ───────────────────────────────────────────────────
  if (step === 93) {
    const len = parseInt(text.replace(/\D/g, ''));
    if (isNaN(len) || len < 15 || len > 60) {
      await send(chatId, `Most cycles are 21–45 days — what's yours?`);
      return;
    }
    const existing = await getCycleData(user.id);
    const dates = (existing?.period_start_dates || []).map((s: string) => new Date(s)).sort((a: Date, b: Date) => b.getTime() - a.getTime());
    const lastPeriod = dates[0] || new Date();
    const { start: ns, end: ne } = predictNextPeriod(lastPeriod, len);
    const { start: os, end: oe } = predictOvulationWindow(ns, len);

    await upsertCycleData(user.id, {
      avg_cycle_length: len,
      next_period_start: ns.toISOString().split('T')[0],
      next_period_end: ne.toISOString().split('T')[0],
      next_ovulation_start: os.toISOString().split('T')[0],
      next_ovulation_end: oe.toISOString().split('T')[0],
    });
    await updateUser(telegramId, { onboarding_step: 0 });
    await send(chatId, `Got it — cycle updated to *${len} days* 🌸`);
    return;
  }

  // ── Update period duration ────────────────────────────────────────────────
  if (step === 94) {
    const dur = parseInt(text.replace(/\D/g, ''));
    if (isNaN(dur) || dur < 1 || dur > 10) {
      await send(chatId, `Usually between 2–8 days — what's yours?`);
      return;
    }
    await upsertCycleData(user.id, { period_duration: dur });
    await updateUser(telegramId, { onboarding_step: 0 });
    await send(chatId, `Updated — period duration set to *${dur} days* 🌸`);
    return;
  }

  // ── Update goal ───────────────────────────────────────────────────────────
  if (step === 95) {
    const goalMap: Record<string, string> = {
      '1': 'track', '2': 'conceive', '3': 'prevent', '4': 'understand',
    };
    const goal = goalMap[text.trim()];
    if (!goal) {
      await send(chatId, `Just send a number: 1, 2, 3, or 4`);
      return;
    }
    await updateUser(telegramId, { reproductive_goal: goal as any, onboarding_step: 0 });
    await send(chatId, `Goal updated 🌸 I'll tailor everything to that from now on.`);
    return;
  }

  // ── Mode switch ───────────────────────────────────────────────────────────
  if (step === 96) {
    if (text === '1') {
      const isPregnant = (user as any).mode === 'pregnant';
      if (isPregnant) {
        await updateUser(telegramId, { mode: 'cycle', pregnancy_start_date: null, onboarding_step: 0 } as any);
        await send(chatId, `Switched back to cycle tracking 🌸 Send /today for your summary.`);
      } else {
        const { getCycleData } = await import('./db');
        const existing = await getCycleData(user.id);
        const lastPeriod = existing?.period_start_dates?.slice(-1)[0] || new Date().toISOString().split('T')[0];
        const { activatePregnancyMode } = await import('./pregnancy');
        await updateUser(telegramId, { onboarding_step: 0 } as any);
        await activatePregnancyMode(telegramId, lastPeriod, send, chatId, user.name || 'there');
      }
    } else {
      await updateUser(telegramId, { onboarding_step: 0 });
      await send(chatId, `No changes made 🌸`);
    }
    return;
  }

  // ── Delete data confirmation ──────────────────────────────────────────────
  if (step === 99) {
    if (text.toUpperCase() === 'YES DELETE') {
      await supabaseAdmin.from('memory_log').delete().eq('user_id', user.id);
      await supabaseAdmin.from('cycle_data').delete().eq('user_id', user.id);
      await supabaseAdmin.from('users').delete().eq('telegram_id', telegramId);
      await send(chatId, `All your data has been deleted. Take care 🌸\n\nIf you ever want to start again, just send /start.`);
    } else {
      await updateUser(telegramId, { onboarding_step: 0 });
      await send(chatId, `No problem — your data is safe 🌸`);
    }
    return;
  }
}
