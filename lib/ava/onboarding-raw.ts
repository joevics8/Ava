import { updateUser, upsertCycleData, addMemoryLog, getCycleData, getMemoryContext } from './db';
import { calcAverageCycleLength, predictNextPeriod, predictOvulationWindow, getCurrentPhase, phaseEmoji } from './cycle';
import { generateDailyTip } from './ai';
import type { AvaUser } from '@/types';

type SendFn = (chatId: number, text: string) => Promise<void>;

export async function handleOnboardingStep(
  chatId: number,
  telegramId: number,
  user: AvaUser,
  message: string,
  send: SendFn
): Promise<void> {
  const step = user.onboarding_step;

  // Step 0: waiting for name
  if (step === 0) {
    await updateUser(telegramId, { name: message.trim(), onboarding_step: 1 });
    await send(chatId, `Beautiful name, ${message.trim()} 🌸\n\nHow old are you? (Just a number)`);
    return;
  }

  // Step 1: age
  if (step === 1) {
    const age = parseInt(message.trim());
    if (isNaN(age) || age < 10 || age > 65) {
      await send(chatId, 'Please enter a valid age (e.g. 24)');
      return;
    }
    await updateUser(telegramId, { age, onboarding_step: 2 });
    await send(chatId, `Got it! What's your height and weight?\n\nSend it like: *165cm 58kg*\n_(Or type "skip")_`);
    return;
  }

  // Step 2: height/weight
  if (step === 2) {
    let height = null, weight = null;
    if (message.toLowerCase() !== 'skip') {
      const hm = message.match(/(\d+)\s*cm/i);
      const wm = message.match(/(\d+)\s*kg/i);
      height = hm ? parseFloat(hm[1]) : null;
      weight = wm ? parseFloat(wm[1]) : null;
    }
    await updateUser(telegramId, { height, weight, onboarding_step: 3 });
    await send(chatId, `When did your *last 3 periods start?* (at least 1 required)\n\nFormat: *14 Jan 2025, 16 Feb 2025, 18 Mar 2025*\nOr just one: *14 Jan 2025*`);
    return;
  }

  // Step 3: period dates
  if (step === 3) {
    const parts = message.split(',').map(s => s.trim());
    const parsed: Date[] = [];
    for (const p of parts) {
      const d = new Date(p);
      if (!isNaN(d.getTime())) parsed.push(d);
    }
    if (parsed.length === 0) {
      await send(chatId, `I couldn't read those dates 😅\n\nTry: *14 Jan 2025*`);
      return;
    }
    const avg = calcAverageCycleLength(parsed);
    const last = parsed.sort((a, b) => b.getTime() - a.getTime())[0];
    const { start: ns, end: ne, confidence } = predictNextPeriod(last, avg);
    const { start: os, end: oe } = predictOvulationWindow(ns, avg);
    await upsertCycleData(user.id, {
      period_start_dates: parsed.map(d => d.toISOString().split('T')[0]),
      avg_cycle_length: avg,
      next_period_start: ns.toISOString().split('T')[0],
      next_period_end: ne.toISOString().split('T')[0],
      next_ovulation_start: os.toISOString().split('T')[0],
      next_ovulation_end: oe.toISOString().split('T')[0],
      confidence_pct: confidence,
    });
    await updateUser(telegramId, { onboarding_step: 4 });
    await send(chatId, `How long does your period usually last? (e.g. *5* days)`);
    return;
  }

  // Step 4: period duration
  if (step === 4) {
    const dur = parseInt(message.trim());
    if (isNaN(dur) || dur < 1 || dur > 10) {
      await send(chatId, 'Please enter a number between 1 and 10');
      return;
    }
    await upsertCycleData(user.id, { period_duration: dur });
    await updateUser(telegramId, { onboarding_step: 5 });
    await send(chatId,
      `What's your current goal? 🎯\n\nReply with a number:\n1. Track my cycle\n2. Plan pregnancy\n3. Avoid pregnancy\n4. Understand my body`
    );
    return;
  }

  // Step 5: reproductive goal
  if (step === 5) {
    const goals: Record<string, string> = { '1': 'track', '2': 'conceive', '3': 'prevent', '4': 'understand' };
    const goal = goals[message.trim()] || 'track';
    await updateUser(telegramId, { reproductive_goal: goal as any, onboarding_step: 6 });
    await send(chatId,
      `How active are you day to day?\n\n1. Not very active\n2. Lightly active\n3. Moderately active\n4. Very active`
    );
    return;
  }

  // Step 6: activity level
  if (step === 6) {
    const levels: Record<string, string> = { '1': 'sedentary', '2': 'light', '3': 'moderate', '4': 'active' };
    const level = levels[message.trim()] || 'moderate';
    await updateUser(telegramId, { activity_level: level as any, onboarding_step: 7 });
    await send(chatId, `Are you on any birth control or medication?\n\nType the name(s) or send *none*`);
    return;
  }

  // Step 7: birth control
  if (step === 7) {
    const bc = message.toLowerCase() === 'none' ? null : message.trim();
    await updateUser(telegramId, { birth_control: bc, onboarding_step: 8 });
    await send(chatId, `Do you have any known conditions like PCOS, endometriosis, fibroids?\n\nType them or send *none*`);
    return;
  }

  // Step 8: conditions → complete
  if (step === 8) {
    const conditions = message.toLowerCase() === 'none' ? [] : message.split(',').map(s => s.trim());
    await updateUser(telegramId, { conditions, onboarding_step: 9, onboarding_complete: true });
    await addMemoryLog(user.id, 'insight', 'Completed onboarding');
    await sendWelcomeInsight(chatId, user, send);
    return;
  }
}

async function sendWelcomeInsight(chatId: number, user: AvaUser, send: SendFn) {
  const cycleData = await getCycleData(user.id);
  const memoryLogs = await getMemoryContext(user.id, user.plan);

  let phaseInfo = '';
  let nextInfo = '';

  if (cycleData?.period_start_dates?.length) {
    const last = new Date(cycleData.period_start_dates[cycleData.period_start_dates.length - 1]);
    const avg = cycleData.avg_cycle_length || 28;
    const { phase } = getCurrentPhase(last, avg, cycleData.period_duration || 5);
    phaseInfo = `${phaseEmoji[phase]} You're currently in your *${phase} phase*.`;
    if (cycleData.next_period_start && cycleData.next_period_end) {
      const s = new Date(cycleData.next_period_start).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
      const e = new Date(cycleData.next_period_end).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
      nextInfo = `Your next period is likely *${s} – ${e}* (${cycleData.confidence_pct}% confidence).`;
    }
  }

  const tip = await generateDailyTip(user, 'current', memoryLogs);

  await send(chatId,
    `You're all set, ${user.name}! I'm *Ava* 🌸\n\n` +
    `${phaseInfo}\n${nextInfo}\n\n` +
    `💡 ${tip}\n\n` +
    `Here's what you can do:\n` +
    `• /today — your daily summary\n` +
    `• /log — track symptoms\n` +
    `• Just talk to me anytime 🌷`
  );
}
