import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { updateUser, upsertCycleData, addMemoryLog } from './db';
import {
  calcAverageCycleLength,
  predictNextPeriod,
  predictOvulationWindow,
  phaseEmoji,
  getCurrentPhase,
} from './cycle';
import { generateDailyTip } from './ai';
import type { AvaUser } from '@/types';

// Steps 0–11 matching the PRD onboarding
export async function handleOnboardingStep(
  ctx: Context,
  user: AvaUser,
  message: string
): Promise<void> {
  const step = user.onboarding_step;
  const telegramId = user.telegram_id;

  switch (step) {
    // ── Step 0: Welcome sent, waiting for name ─────────────────────────────
    case 0: {
      await updateUser(telegramId, { name: message.trim(), onboarding_step: 1 });
      await ctx.reply(
        `Beautiful name, ${message.trim()} 🌸\n\nHow old are you? (Just a number is fine)`
      );
      break;
    }

    // ── Step 1: Age ────────────────────────────────────────────────────────
    case 1: {
      const age = parseInt(message.trim());
      if (isNaN(age) || age < 10 || age > 65) {
        await ctx.reply('Please enter a valid age (e.g. 24)');
        return;
      }
      await updateUser(telegramId, { age, onboarding_step: 2 });
      await ctx.reply(
        `Got it! What's your height and weight?\n\nSend it like this: *165cm 58kg*\n_(This helps Ava give better wellness tips — you can skip by typing "skip")_`,
        { parse_mode: 'Markdown' }
      );
      break;
    }

    // ── Step 2: Height/Weight ──────────────────────────────────────────────
    case 2: {
      let height: number | null = null;
      let weight: number | null = null;

      if (message.toLowerCase() !== 'skip') {
        const heightMatch = message.match(/(\d+)\s*cm/i);
        const weightMatch = message.match(/(\d+)\s*kg/i);
        height = heightMatch ? parseFloat(heightMatch[1]) : null;
        weight = weightMatch ? parseFloat(weightMatch[1]) : null;
      }

      await updateUser(telegramId, { height, weight, onboarding_step: 3 });
      await ctx.reply(
        `When did your *last 3 periods start?* (at least 1 required)\n\nSend dates like this:\n*14 Jan 2025, 16 Feb 2025, 18 Mar 2025*\n\nOr just one: *14 Jan 2025*`,
        { parse_mode: 'Markdown' }
      );
      break;
    }

    // ── Step 3: Period dates ───────────────────────────────────────────────
    case 3: {
      const dateStrings = message.split(',').map((s) => s.trim());
      const parsed: Date[] = [];

      for (const ds of dateStrings) {
        const d = new Date(ds);
        if (!isNaN(d.getTime())) parsed.push(d);
      }

      if (parsed.length === 0) {
        await ctx.reply(
          'I couldn\'t read those dates 😅 Try this format: *14 Jan 2025*',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      const avgCycleLength = calcAverageCycleLength(parsed);
      const lastPeriod = parsed.sort((a, b) => b.getTime() - a.getTime())[0];
      const { start: nextStart, end: nextEnd, confidence } = predictNextPeriod(lastPeriod, avgCycleLength);
      const { start: ovStart, end: ovEnd } = predictOvulationWindow(nextStart, avgCycleLength);

      await upsertCycleData(user.id, {
        period_start_dates: parsed.map((d) => d.toISOString().split('T')[0]),
        avg_cycle_length: avgCycleLength,
        next_period_start: nextStart.toISOString().split('T')[0],
        next_period_end: nextEnd.toISOString().split('T')[0],
        next_ovulation_start: ovStart.toISOString().split('T')[0],
        next_ovulation_end: ovEnd.toISOString().split('T')[0],
        confidence_pct: confidence,
      });

      await updateUser(telegramId, { onboarding_step: 4 });
      await ctx.reply(
        `How long does your period usually last?\n\nSend a number of days (e.g. *5*)`,
        { parse_mode: 'Markdown' }
      );
      break;
    }

    // ── Step 4: Period duration ────────────────────────────────────────────
    case 4: {
      const duration = parseInt(message.trim());
      if (isNaN(duration) || duration < 1 || duration > 10) {
        await ctx.reply('Please enter a number between 1 and 10');
        return;
      }

      await upsertCycleData(user.id, { period_duration: duration });
      await updateUser(telegramId, { onboarding_step: 5 });

      const keyboard = new InlineKeyboard()
        .text('🩺 Track my cycle', 'goal_track').row()
        .text('🍼 Plan pregnancy', 'goal_conceive').row()
        .text('🛡️ Avoid pregnancy', 'goal_prevent').row()
        .text('💡 Understand my body', 'goal_understand');

      await ctx.reply(
        `What's your current goal? 🎯\n\nThis shapes everything Ava tells you.`,
        { reply_markup: keyboard }
      );
      break;
    }

    // ── Step 5–11 handled by callback queries (inline keyboard) ───────────
    default:
      break;
  }
}

// ─── Callback handlers for inline keyboard choices ────────────────────────────

export async function handleOnboardingCallback(
  ctx: Context,
  user: AvaUser,
  data: string
): Promise<void> {
  const telegramId = user.telegram_id;

  // Reproductive goal
  if (data.startsWith('goal_')) {
    const goal = data.replace('goal_', '') as 'track' | 'conceive' | 'prevent' | 'understand';
    await updateUser(telegramId, { reproductive_goal: goal, onboarding_step: 6 });
    await ctx.answerCallbackQuery();

    const keyboard = new InlineKeyboard()
      .text('🛋️ Not very active', 'activity_sedentary').row()
      .text('🚶 Lightly active', 'activity_light').row()
      .text('🏃 Moderately active', 'activity_moderate').row()
      .text('💪 Very active', 'activity_active');

    await ctx.reply('How active are you day to day? 🏃‍♀️', { reply_markup: keyboard });
    return;
  }

  // Activity level
  if (data.startsWith('activity_')) {
    const level = data.replace('activity_', '');
    await updateUser(telegramId, { activity_level: level as any, onboarding_step: 7 });
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `Are you on any birth control or medication?\n\nType the name(s) or send *"none"*`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Any other callback during onboarding
  await ctx.answerCallbackQuery();
}

// ─── Handle text during later onboarding steps ───────────────────────────────

export async function handleLateOnboarding(
  ctx: Context,
  user: AvaUser,
  message: string
): Promise<void> {
  const telegramId = user.telegram_id;
  const step = user.onboarding_step;

  // Step 7: Birth control
  if (step === 7) {
    const bc = message.toLowerCase() === 'none' ? null : message.trim();
    await updateUser(telegramId, { birth_control: bc, onboarding_step: 8 });
    await ctx.reply(
      `Do you have any known conditions like PCOS, endometriosis, fibroids, etc?\n\nType them or send *"none"*`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Step 8: Conditions → complete onboarding
  if (step === 8) {
    const conditions = message.toLowerCase() === 'none'
      ? []
      : message.split(',').map((s) => s.trim());

    await updateUser(telegramId, {
      conditions,
      onboarding_step: 9,
      onboarding_complete: true,
    });

    await sendWelcomeInsight(ctx, user);
    return;
  }
}

// ─── Final onboarding message + first insight ─────────────────────────────────

async function sendWelcomeInsight(ctx: Context, user: AvaUser): Promise<void> {
  const cycleData = await import('./db').then((m) => m.getCycleData(user.id));
  const memoryLogs = await import('./db').then((m) => m.getMemoryContext(user.id, user.plan));

  let phaseInfo = '';
  let nextPeriodInfo = '';

  if (cycleData?.period_start_dates?.length) {
    const lastStart = new Date(cycleData.period_start_dates[cycleData.period_start_dates.length - 1]);
    const avg = cycleData.avg_cycle_length || 28;
    const { phase } = getCurrentPhase(lastStart, avg, cycleData.period_duration || 5);
    phaseInfo = `${phaseEmoji[phase]} You're currently in your *${phase} phase*.`;

    if (cycleData.next_period_start && cycleData.next_period_end) {
      const s = new Date(cycleData.next_period_start).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
      const e = new Date(cycleData.next_period_end).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
      nextPeriodInfo = `Your next period is likely between *${s} – ${e}* (${cycleData.confidence_pct}% confidence).`;
    }
  }

  const tip = await generateDailyTip(user, 'current', memoryLogs);

  await ctx.reply(
    `Hi ${user.name}! I'm *Ava* 🌸 — think of me as the friend who actually understands your cycle.\n\n` +
    `${phaseInfo}\n${nextPeriodInfo}\n\n` +
    `💡 ${tip}\n\n` +
    `You're all set! Here's what you can do:\n` +
    `• /today — your daily summary\n` +
    `• /log — track symptoms\n` +
    `• /chat — ask me anything\n` +
    `• /settings — manage your account\n\n` +
    `Or just talk to me normally — I'm listening 🌷`,
    { parse_mode: 'Markdown' }
  );

  await addMemoryLog(user.id, 'insight', 'Completed onboarding');
}
