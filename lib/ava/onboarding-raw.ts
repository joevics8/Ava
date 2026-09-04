import { updateUser, upsertCycleData, addMemoryLog, getCycleData, getMemoryContext } from './db';
import { calcAverageCycleLength, predictNextPeriod, predictOvulationWindow, getCurrentPhase, phaseEmoji, phaseLabel } from './cycle';
import { generateDailyTip } from './ai';
import type { AvaUser } from '@/types';

type SendFn = (chatId: number, text: string, markdown?: boolean) => Promise<void>;

function parseDate(input: string): Date | null {
  const cleaned = input.replace(/(\d+)(st|nd|rd|th)/gi, '$1').replace(/,/g, '').trim();
  const d = new Date(cleaned);
  const now = new Date();
  if (!isNaN(d.getTime()) && d.getFullYear() >= 1990 && d <= now) return d;
  return null;
}

function isSkip(text: string): boolean {
  return ['skip', 'no', 'nope', "don't remember", "i don't know", 'idk', 'none', '-'].includes(text.toLowerCase().trim());
}

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
    const name = message.trim().split(' ')[0]; // first name only
    await updateUser(telegramId, { name, onboarding_step: 1 });
    await send(chatId, `Nice to meet you, ${name} 🌷\n\nHow old are you?`);
    return;
  }

  // Step 1: age
  if (step === 1) {
    const age = parseInt(message.trim());
    if (isNaN(age) || age < 10 || age > 65) {
      await send(chatId, 'Just a number is fine — how old are you?');
      return;
    }
    await updateUser(telegramId, { age, onboarding_step: 2 });
    await send(chatId, `Got it 💕\n\nWhen did your last period start? 🩸\n\n_Example: 15 Aug 2026_`);
    return;
  }

  // Step 2: last period date
  if (step === 2) {
    const d = parseDate(message);
    if (!d) {
      await send(chatId, `I couldn't read that date 😅\n\nTry something like: *15 Aug 2026*`);
      return;
    }
    // Store temporarily in cycle_data
    await upsertCycleData(user.id, {
      period_start_dates: [d.toISOString().split('T')[0]],
    });
    await updateUser(telegramId, { onboarding_step: 3 });
    await send(chatId, `Got it 🌸\n\nDo you remember when the period before that started?\n\n_Send the date or type *skip*_`);
    return;
  }

  // Step 3: second period date (optional)
  if (step === 3) {
    if (!isSkip(message)) {
      const d = parseDate(message);
      if (!d) {
        await send(chatId, `Hmm, I couldn't read that. Try *16 Jul 2026* or type *skip*`);
        return;
      }
      const existing = await getCycleData(user.id);
      const dates = existing?.period_start_dates || [];
      await upsertCycleData(user.id, {
        period_start_dates: [...dates, d.toISOString().split('T')[0]],
      });
    }
    await updateUser(telegramId, { onboarding_step: 4 });
    await send(chatId, `And the one before that?\n\n_Send the date or type *skip*_`);
    return;
  }

  // Step 4: third period date (optional)
  if (step === 4) {
    if (!isSkip(message)) {
      const d = parseDate(message);
      if (!d) {
        await send(chatId, `Couldn't read that one. Try *15 Jun 2026* or type *skip*`);
        return;
      }
      const existing = await getCycleData(user.id);
      const dates = existing?.period_start_dates || [];
      await upsertCycleData(user.id, {
        period_start_dates: [...dates, d.toISOString().split('T')[0]],
      });
    }
    await updateUser(telegramId, { onboarding_step: 5 });
    await send(chatId, `How long is your cycle usually? 🌙\n\n_Example: 28, 30, 32 days..._`);
    return;
  }

  // Step 5: cycle length
  if (step === 5) {
    const len = parseInt(message.replace(/\D/g, ''));
    if (isNaN(len) || len < 15 || len > 60) {
      await send(chatId, `Most cycles are between 21–45 days. What's yours usually like?`);
      return;
    }

    // Recalculate predictions with confirmed cycle length
    const existing = await getCycleData(user.id);
    const dates = (existing?.period_start_dates || []).map((d: string) => new Date(d)).sort((a: Date, b: Date) => b.getTime() - a.getTime());
    const lastPeriod = dates[0] || new Date();
    const { start: ns, end: ne, confidence } = predictNextPeriod(lastPeriod, len);
    const { start: os, end: oe } = predictOvulationWindow(ns, len);

    await upsertCycleData(user.id, {
      avg_cycle_length: len,
      next_period_start: ns.toISOString().split('T')[0],
      next_period_end: ne.toISOString().split('T')[0],
      next_ovulation_start: os.toISOString().split('T')[0],
      next_ovulation_end: oe.toISOString().split('T')[0],
      confidence_pct: confidence,
    });

    await updateUser(telegramId, { onboarding_step: 6 });
    await send(chatId, `Perfect 🌷\n\nHow many days does your period usually last?\n\n_Example: 3, 4, 5, 6... days_`);
    return;
  }

  // Step 6: period duration
  if (step === 6) {
    const dur = parseInt(message.replace(/\D/g, ''));
    if (isNaN(dur) || dur < 1 || dur > 10) {
      await send(chatId, `Usually between 2–8 days — what's yours?`);
      return;
    }
    await upsertCycleData(user.id, { period_duration: dur });
    await updateUser(telegramId, { onboarding_step: 7 });
    await send(chatId,
      `Got it 💕\n\nWhat would you like Ava to help you with the most? 🎯\n\n` +
      `1. Track my cycle\n2. Plan pregnancy\n3. Avoid pregnancy\n4. Understand my body\n\n` +
      `_You can choose more than one — just send the numbers, e.g. *1 3*_`
    );
    return;
  }

  // Step 7: goals (multi-select)
  if (step === 7) {
    const goalMap: Record<string, string> = {
      '1': 'track', '2': 'conceive', '3': 'prevent', '4': 'understand',
    };
    const nums = message.match(/[1-4]/g) || ['1'];
    const goals = Array.from(new Set(nums.map(n => goalMap[n])));
    // Primary goal is first selection
    const primaryGoal = goals[0] as any;

    await updateUser(telegramId, {
      reproductive_goal: primaryGoal,
      onboarding_step: 8,
      onboarding_complete: true,
    });
    await addMemoryLog(user.id, 'insight', `Goals: ${goals.join(', ')}`);
    await sendWelcomeInsight(chatId, telegramId, user, send, goals);
    return;
  }
}

const goalLabels: Record<string, string> = {
  track: '📅 Track your cycle',
  conceive: '👶 Plan pregnancy',
  prevent: '🛡️ Avoid pregnancy',
  understand: '💡 Understand your body',
};

async function sendWelcomeInsight(
  chatId: number,
  telegramId: number,
  user: AvaUser,
  send: SendFn,
  goals: string[]
) {
  // Refresh user to get updated name
  const { getUser } = await import('./db');
  const fresh = await getUser(telegramId);
  const name = fresh?.name || user.name || 'there';

  const cycleData = await getCycleData(user.id);
  const memoryLogs = await getMemoryContext(user.id, 'free');

  let phaseInfo = '';
  let cycleLength = cycleData?.avg_cycle_length || 28;
  let periodDuration = cycleData?.period_duration || 5;

  const dates = (cycleData?.period_start_dates || [])
    .map((d: string) => new Date(d))
    .sort((a: Date, b: Date) => b.getTime() - a.getTime());

  const lastStart = dates[0];
  if (lastStart) {
    const { phase } = getCurrentPhase(lastStart, Number(cycleLength), periodDuration);
    phaseInfo = `You're currently in your *${phase} phase* ${phaseEmoji[phase]}`;
  }

  const goalLines = goals.map(g => goalLabels[g] || '').filter(Boolean).join('\n');

  const lastPeriodStr = lastStart
    ? lastStart.toLocaleDateString('en-NG', { day: 'numeric', month: 'long' })
    : 'Not set';

  const tip = await generateDailyTip({ ...user, name } as AvaUser, 'current', memoryLogs);

  await send(chatId,
    `Thanks, ${name} 🌷\n\n` +
    `Here's what I'll help you with:\n${goalLines}\n\n` +
    `Here's what I've learned about your cycle:\n` +
    `🩸 Cycle length: ${cycleLength} days\n` +
    `🩸 Period length: ${periodDuration} days\n` +
    `📅 Last period: ${lastPeriodStr}\n\n` +
    `${phaseInfo}\n\n` +
    (tip ? `💡 ${tip}\n\n` : '') +
    `Remember — you can just talk to me naturally. I'm here whenever you need me 🌸`
  );
}
