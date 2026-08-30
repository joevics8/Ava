import { Bot, InlineKeyboard } from 'grammy';
import { getUser, createUser, getMemoryContext, addMemoryLog } from './ava/db';
import {
  handleOnboardingStep,
  handleOnboardingCallback,
  handleLateOnboarding,
} from './ava/onboarding';
import {
  classifyMessage,
  extractLogSummary,
  handleRetrieval,
  handleConversation,
  summarizeChatInsight,
  generateDailyTip,
} from './ava/ai';
import {
  getCurrentPhase,
  buildProbabilityBar,
  phaseEmoji,
  phaseLabel,
} from './ava/cycle';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// ─── /start ───────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  let user = await getUser(telegramId);

  if (!user) {
    user = await createUser(telegramId);
  }

  if (user?.onboarding_complete) {
    await ctx.reply(
      `Welcome back, ${user.name} 🌸\n\nWhat would you like to do?\n• /today — daily summary\n• /log — track symptoms\n• /chat — ask me anything`
    );
    return;
  }

  // Fresh start — begin onboarding
  await ctx.reply(
    `Hi, I'm *Ava* 🌸\n\nI'm your personal cycle and wellness companion. I learn your body, remember your patterns, and talk to you like a friend who actually gets it.\n\nYour data stays private and secure.\n\nLet's get you set up — what's your name?`,
    { parse_mode: 'Markdown' }
  );

  if (user) {
    await import('./ava/db').then((m) =>
      m.updateUser(telegramId, { onboarding_step: 0 })
    );
  }
});

// ─── /today ───────────────────────────────────────────────────────────────────

bot.command('today', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  const user = await getUser(telegramId);
  if (!user?.onboarding_complete) {
    await ctx.reply('Let\'s finish setting you up first! Send /start');
    return;
  }

  const cycleData = await import('./ava/db').then((m) => m.getCycleData(user.id));
  const memoryLogs = await getMemoryContext(user.id, user.plan);

  if (!cycleData?.period_start_dates?.length) {
    await ctx.reply('I need your period dates to show your summary. Send /settings to add them.');
    return;
  }

  const lastStart = new Date(
    cycleData.period_start_dates[cycleData.period_start_dates.length - 1]
  );
  const avg = cycleData.avg_cycle_length || 28;
  const { phase, day } = getCurrentPhase(lastStart, avg, cycleData.period_duration || 5);
  const tip = await generateDailyTip(user, phase, memoryLogs);

  const wantsToConceive = user.reproductive_goal === 'conceive';
  const probabilityBar = buildProbabilityBar(day, avg, wantsToConceive);

  let nextInfo = '';
  if (cycleData.next_period_start && cycleData.next_period_end) {
    const s = new Date(cycleData.next_period_start).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    const e = new Date(cycleData.next_period_end).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    nextInfo = `📅 Next period: *${s} – ${e}* (${cycleData.confidence_pct}% confidence)`;
  }

  await ctx.reply(
    `Good morning, ${user.name}! 🌸\n\n` +
    `${phaseEmoji[phase]} *${phaseLabel[phase]}* — Day ${day}\n\n` +
    `*Pregnancy probability today:*\n${probabilityBar}\n\n` +
    `${nextInfo}\n\n` +
    `💡 *Today's tip:* ${tip}\n\n` +
    `Use /log to track symptoms or just message me anything 🌷`,
    { parse_mode: 'Markdown' }
  );
});

// ─── /log ─────────────────────────────────────────────────────────────────────

bot.command('log', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  const user = await getUser(telegramId);
  if (!user?.onboarding_complete) return;

  const keyboard = new InlineKeyboard()
    .text('😊 Happy', 'log_mood_happy').text('😢 Sad', 'log_mood_sad').text('😠 Irritable', 'log_mood_irritable').row()
    .text('😌 Calm', 'log_mood_calm').text('😴 Tired', 'log_mood_tired').text('⚡ Energetic', 'log_mood_energetic').row()
    .text('🔴 Cramps', 'log_symptom_cramps').text('🤕 Headache', 'log_symptom_headache').text('🫃 Bloating', 'log_symptom_bloating').row()
    .text('💧 Light flow', 'log_flow_light').text('🩸 Heavy flow', 'log_flow_heavy').text('🔴 Spotting', 'log_flow_spotting').row()
    .text('🧴 Acne', 'log_symptom_acne').text('💕 Tender breasts', 'log_symptom_breast').text('🌡️ BBT', 'log_bbt').row()
    .text('💦 Cervical mucus', 'log_mucus').text('🛡️ Protected sex', 'log_sex_protected').text('❤️ Unprotected sex', 'log_sex_unprotected');

  await ctx.reply('What would you like to log today? 📝\n\n_(You can also just type it naturally)_', {
    reply_markup: keyboard,
    parse_mode: 'Markdown',
  });
});

// ─── /chat ────────────────────────────────────────────────────────────────────

bot.command('chat', async (ctx) => {
  await ctx.reply('I\'m here, go ahead and ask me anything 💬\n\nYou can also just send a message anytime without a command.');
});

// ─── Callback queries (inline keyboard taps) ──────────────────────────────────

bot.on('callback_query:data', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const data = ctx.callbackQuery.data;
  const user = await getUser(telegramId);
  if (!user) return;

  // Onboarding callbacks
  if (!user.onboarding_complete) {
    await handleOnboardingCallback(ctx, user, data);
    return;
  }

  // Log callbacks
  if (data.startsWith('log_')) {
    const parts = data.replace('log_', '').split('_');
    const category = parts[0] as any;
    const value = parts.slice(1).join(' ');

    const summary = value
      ? `${category}: ${value}`
      : category === 'bbt'
      ? 'BBT logged'
      : category === 'mucus'
      ? 'Cervical mucus check'
      : category;

    await addMemoryLog(user.id, category, summary);
    await ctx.answerCallbackQuery({ text: '✅ Logged!' });
    await ctx.reply(`Got it — I've logged *${summary}* 🌸\n\nAnything else you'd like to add?`, {
      parse_mode: 'Markdown',
    });
    return;
  }

  await ctx.answerCallbackQuery();
});

// ─── All text messages ────────────────────────────────────────────────────────

bot.on('message:text', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  let user = await getUser(telegramId);

  // Create user if missing (edge case)
  if (!user) {
    user = await createUser(telegramId);
    await ctx.reply('Hi! I\'m Ava 🌸 Send /start to begin.');
    return;
  }

  const message = ctx.message.text;

  // Route through onboarding if not complete
  if (!user.onboarding_complete) {
    if (user.onboarding_step <= 4) {
      await handleOnboardingStep(ctx, user, message);
    } else {
      await handleLateOnboarding(ctx, user, message);
    }
    return;
  }

  // ── Main message router ──────────────────────────────────────────────────
  const memoryLogs = await getMemoryContext(user.id, user.plan);

  // Classify the message
  const category = await classifyMessage(message);

  if (category === 'LOG') {
    // Extract and save the log
    const { category: logCat, summary } = await extractLogSummary(message);
    await addMemoryLog(user.id, logCat as any, summary);

    // Also check if there's a question embedded — if so, answer it too
    const hasQuestion = message.includes('?') || message.toLowerCase().includes('is this') || message.toLowerCase().includes('why');

    if (hasQuestion) {
      const response = await handleConversation(user, message, memoryLogs);
      await ctx.reply(response);
      const insight = await summarizeChatInsight(message, response);
      await addMemoryLog(user.id, 'chat', insight);
    } else {
      await ctx.reply(`Logged 🌸 I've noted that down. Your patterns are getting clearer every day.`);
    }
    return;
  }

  if (category === 'RETRIEVAL') {
    const response = await handleRetrieval(user, message, memoryLogs);
    await ctx.reply(response);
    return;
  }

  // CONVERSATION — use Pro model
  const response = await handleConversation(user, message, memoryLogs);
  await ctx.reply(response);

  // Save conversation insight to memory
  const insight = await summarizeChatInsight(message, response);
  await addMemoryLog(user.id, 'chat', insight);
});

// ─── Photo/image messages ─────────────────────────────────────────────────────

bot.on('message:photo', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  const user = await getUser(telegramId);
  if (!user?.onboarding_complete) return;

  await ctx.reply(
    '📸 I can see your image! Image analysis (ovulation/pregnancy test reading) is coming very soon.\n\nFor now, tell me what the test shows and I\'ll help you interpret it. 🌸'
  );
});

// ─── Error handler ────────────────────────────────────────────────────────────

bot.catch((err) => {
  console.error('Bot error:', err);
});

export default bot;
