import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { getUser, createUser, updateUser, getMemoryContext, addMemoryLog } from '@/lib/ava/db';
import {
  classifyMessage,
  extractLogSummary,
  handleRetrieval,
  handleConversation,
  summarizeChatInsight,
  shouldSuggestPremium,
  generatePremiumPitch,
} from '@/lib/ava/ai';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

function getContextualFollowUp(recentLog: string, mood: string): string {
  const lower = recentLog.toLowerCase();
  if (mood === 'good') {
    if (lower.includes('cramp') || lower.includes('pain')) return 'Glad the cramps have eased up!';
    if (lower.includes('fever') || lower.includes('sick')) return 'Good to hear you are feeling better.';
    if (lower.includes('tired') || lower.includes('fatigue')) return 'Sounds like your energy is back!';
    return 'Any symptoms worth noting today?';
  }
  if (mood === 'okay') {
    if (lower.includes('cramp')) return 'Still dealing with cramps?';
    if (lower.includes('fever')) return 'Has the feverish feeling settled?';
    if (lower.includes('tired')) return 'Still feeling tired?';
    return 'Anything on your mind today?';
  }
  return '';
}

function cleanAiText(text: string): string {
  let t = text;
  t = t.split('**').join('');
  t = t.split('*').join('');
  t = t.split('_').join('');
  t = t.split('`').join('');
  return t.trim();
}

// Telegram rejects any message over 4096 chars outright — with no splitting
// and no error check, a long AI reply would just silently fail to send
// (this is what "message gets cut off" looked like from the user's side:
// not truncation, but a dropped send with zero visibility in logs).
function splitMessage(text: string, maxLen = 4000): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf('. ', maxLen);
    if (cut === -1) cut = maxLen;
    else cut += 2;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function sendMessage(chatId: number, text: string, markdown = false) {
  const cleaned = markdown ? text : cleanAiText(text);
  const chunks = splitMessage(cleaned);
  for (const chunk of chunks) {
    const body: any = { chat_id: chatId, text: chunk };
    if (markdown) body.parse_mode = 'Markdown';
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Telegram sendMessage error:', JSON.stringify(err));
      // Markdown parse failures ("can't parse entities") are common when AI
      // text has stray * or _ — retry once as plain text so the user isn't
      // left with nothing.
      if (markdown) {
        const fallback: any = { chat_id: chatId, text: cleanAiText(chunk) };
        const retryRes = await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fallback),
        });
        if (!retryRes.ok) {
          console.error('Telegram sendMessage retry also failed:', JSON.stringify(await retryRes.json().catch(() => ({}))));
        }
      }
    }
  }
}

async function sendTyping(chatId: number) {
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  });
}

async function sendWithKeyboard(chatId: number, text: string, keyboard: any[][], markdown = false) {
  const body: any = {
    chat_id: chatId,
    text: markdown ? text : cleanAiText(text),
    reply_markup: keyboard.length ? { inline_keyboard: keyboard } : undefined,
  };
  if (markdown) body.parse_mode = 'Markdown';
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true });
    }

    const update = await req.json();

    // Respond to Telegram immediately — prevents webhook timeout
    // All processing happens in background via waitUntil
    waitUntil(processUpdate(update));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook outer error:', err);
    return NextResponse.json({ ok: true });
  }
}

// ── All processing logic moved here so we can respond to Telegram instantly ──

async function processUpdate(update: any) {
  try {
    // ── Callback queries (inline button taps) — must be before message check ─
    if (update?.callback_query) {
      const cb = update.callback_query;
      const cbChatId = cb.message?.chat?.id;
      const cbTelegramId = cb.from?.id;
      const cbData = cb.data;

      if (!cbChatId || !cbTelegramId || !cbData) return;

      // Answer Telegram immediately — required within 10s
      const answerUrl = 'https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/answerCallbackQuery';
      await fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id }),
      });

      const cbUser = await getUser(cbTelegramId);
      if (!cbUser) return;

      // ── Remedy button callbacks ──────────────────────────────────────────
      if (cbData.startsWith('rem_')) {
        try {
          const { handleRemedyCallback } = await import('@/lib/ava/remedy-engine');
          await handleRemedyCallback(cbChatId, cbUser, cbData, sendWithKeyboard, sendMessage);
        } catch (err) {
          console.error('Remedy callback error:', err);
          await sendMessage(cbChatId, 'Something went wrong — please try /remedies again 🌸');
        }
        return;
      }

      // ── Mood button callbacks ────────────────────────────────────────────
      if (cbData.startsWith('mood_')) {
        const moodMap: Record<string, string> = {
          mood_good: 'good',
          mood_okay: 'okay',
          mood_notgreat: 'not great',
        };
        const mood = moodMap[cbData] || cbData;
        await addMemoryLog(cbUser.id, 'mood', 'Morning mood: ' + mood);
        const cbLogs = await getMemoryContext(cbUser.id, cbUser.plan);
        const recentLog = cbLogs.slice(0, 5).map((l: any) => l.summary).join(', ');
        const replies: Record<string, string> = {
          mood_good: "That's great to hear 🌸 " + (recentLog ? getContextualFollowUp(recentLog, 'good') : 'Hope the day stays that way!'),
          mood_okay: 'Got it 🌷 ' + (recentLog ? getContextualFollowUp(recentLog, 'okay') : 'Let me know if anything comes up today.'),
          mood_notgreat: "I'm sorry to hear that 🌸 What's going on?",
        };
        await sendMessage(cbChatId, replies[cbData] || 'Got it 🌸');
        return;
      }

      return NextResponse.json({ ok: true });
    }

    // ── Message null check ────────────────────────────────────────────────────
    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId: number = message.chat.id;
    const telegramId: number = message.from.id;
    const text: string = message.text || '';
    // Natural-language trigger phrases below were comparing against the raw,
    // un-lowercased text — meaning any auto-capitalized first letter (the
    // mobile keyboard default) or stray punctuation silently broke every one
    // of them, including the pregnancy-mode switch. Use a normalized form.
    const normalizedText = text.toLowerCase().trim();

    // ── Photo messages ────────────────────────────────────────────────────────
    if (message.photo?.length) {
      await sendTyping(chatId);
      let user = await getUser(telegramId);
      if (!user) { user = await createUser(telegramId); }
      if (!user) {
        await sendMessage(chatId, `Something went wrong on my end — could you try again? 🌸`);
        return NextResponse.json({ ok: true });
      }

      // A brand-new or mid-onboarding user sending a photo first would
      // otherwise skip straight to test-strip analysis before Ava even
      // knows their name — finish setup first instead.
      if (!user.onboarding_complete) {
        await sendMessage(chatId,
          `I'd love to take a look at that once we're set up 🌸\n\n${user.name ? `Let's finish setting you up — send /start to continue.` : `What's your name?`}`
        );
        return NextResponse.json({ ok: true });
      }

      const {
        getTelegramPhotoBase64,
        detectImageType,
        analyseOvulationStrip,
        analysePregnancyTest,
        analyseGenericImage,
      } = await import('@/lib/ava/vision');

      // Get largest photo size
      const photo = message.photo[message.photo.length - 1];
      const caption = message.caption || '';

      const photoData = await getTelegramPhotoBase64(photo.file_id);
      if (!photoData) {
        await sendMessage(chatId, `I couldn't read that photo — could you try sending it again? 🌸`);
        return NextResponse.json({ ok: true });
      }

      const imageType = await detectImageType(photoData.base64, photoData.mimeType, caption);

      if (imageType === 'ovulation_strip') {
        const { result, isPositive, summary } = await analyseOvulationStrip(photoData.base64, photoData.mimeType);
        await sendMessage(chatId, result);
        if (user) await addMemoryLog(user.id, 'test', summary);
        if (isPositive && user) {
          await addMemoryLog(user.id, 'cycle', 'LH surge detected — ovulation likely within 12-36 hours');
        }
      } else if (imageType === 'pregnancy_test') {
        const { result, isPositive, summary } = await analysePregnancyTest(photoData.base64, photoData.mimeType);
        await sendMessage(chatId, result);
        if (user) await addMemoryLog(user.id, 'test', summary);
        if (isPositive && user) {
          await addMemoryLog(user.id, 'insight', 'Positive pregnancy test logged');
          await sendMessage(chatId,
            `If this is a positive result, I want you to know I'm here for you whatever you're feeling 🌸\n\nWould you like me to switch to pregnancy mode? I'll track your weeks and due date.\n\nJust reply *switch to pregnancy mode* or *not yet* 🌷`
          );
        }
      } else {
        const response = await analyseGenericImage(photoData.base64, photoData.mimeType, caption);
        await sendMessage(chatId, response);
      }

      return NextResponse.json({ ok: true });
    }

    // Show typing immediately
    await sendTyping(chatId);

    // ── Get or create user ───────────────────────────────────────────────────
    let user = await getUser(telegramId);
    if (!user) {
      user = await createUser(telegramId);
      await sendMessage(chatId,
        `Hi, I'm *Ava* 🌸\n\nI'm your personal cycle & wellness companion. I can help you understand your cycle, track symptoms, and answer questions about your body.\n\nLet's get you set up — it only takes a minute.\n\nWhat's your name?`, true
      );
      return NextResponse.json({ ok: true });
    }

    // ── STRICT COMMAND GATE — must be before everything else ────────────────
    if (text.startsWith('/')) {
      await handleCommand(text.split('@')[0].toLowerCase(), chatId, telegramId, user, sendMessage, sendWithKeyboard);
      return;
    }

    // ── Premium expiry check ─────────────────────────────────────────────────
    if (user.plan === 'premium' && (user as any).premium_expires_at) {
      const expires = new Date((user as any).premium_expires_at);
      const now = new Date();
      const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        // Downgrade expired user
        await updateUser(telegramId, { plan: 'free' } as any);
        await sendMessage(chatId,
          `Hey ${user.name} — your Premium subscription has expired 🌸

You're now on the free plan. Send /premium to renew and keep your 5-month memory.`
        );
        user = { ...user, plan: 'free' };
      }
    }

    // ── Commands ─────────────────────────────────────────────────────────────
    // NOTE: slash-form commands (/start, /today, /log, /premium, /report,
    // /patterns, /cancel, /settings) are handled above by the strict command
    // gate → handleCommand(). Only natural-language equivalents live here, so
    // the same features stay reachable from free-flowing conversation too.

    // ── Insights commands ─────────────────────────────────────────────────────
    if (normalizedText === 'what have you learned about me' || normalizedText === 'what do you know about me') {
      await sendTyping(chatId);
      const { generatePersonalInsights } = await import('@/lib/ava/insights');
      const { getCycleData } = await import('@/lib/ava/db');
      const [cycleData, logs] = await Promise.all([
        getCycleData(user.id),
        getMemoryContext(user.id, user.plan),
      ]);
      const response = await generatePersonalInsights(user, logs, cycleData);
      await sendMessage(chatId, response);
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === 'what has changed recently' || normalizedText === 'what changed recently') {
      await sendTyping(chatId);
      const { generateRecentChanges } = await import('@/lib/ava/insights');
      const logs = await getMemoryContext(user.id, user.plan);
      const response = await generateRecentChanges(user, logs);
      await sendMessage(chatId, response);
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === 'doctor visit prep' || normalizedText === 'prepare for my doctor') {
      await sendTyping(chatId);
      const { generateDoctorPrep } = await import('@/lib/ava/insights');
      const { getCycleData } = await import('@/lib/ava/db');
      const [cycleData, logs] = await Promise.all([
        getCycleData(user.id),
        getMemoryContext(user.id, user.plan),
      ]);
      const response = await generateDoctorPrep(user, logs, cycleData);
      await sendMessage(chatId, `📋 *Doctor Visit Summary for ${user.name}*

${response}`);
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === 'weekly briefing' || normalizedText === 'weekly update') {
      await sendTyping(chatId);
      const { generateWeeklyBriefing } = await import('@/lib/ava/insights');
      const { getCycleData } = await import('@/lib/ava/db');
      const [cycleData, logs] = await Promise.all([
        getCycleData(user.id),
        getMemoryContext(user.id, user.plan),
      ]);
      const response = await generateWeeklyBriefing(user, logs, cycleData);
      await sendMessage(chatId, `📊 *Your Weekly Briefing*

${response}`);
      return NextResponse.json({ ok: true });
    }


    if (normalizedText === 'switch to pregnancy mode' || normalizedText === 'pregnancy mode') {
      if (!user) return NextResponse.json({ ok: true });
      const existing = await import('@/lib/ava/db').then(m => m.getCycleData(user!.id));
      const lastPeriod = existing?.period_start_dates?.slice(-1)[0] || new Date().toISOString().split('T')[0];
      const { activatePregnancyMode } = await import('@/lib/ava/pregnancy');
      await activatePregnancyMode(telegramId, lastPeriod, sendMessage, chatId, user!.name || 'there');
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === 'switch to cycle mode' || normalizedText === 'cycle mode') {
      await updateUser(telegramId, { mode: 'cycle', pregnancy_start_date: null } as any);
      await sendMessage(chatId, `Switched back to cycle tracking 🌸 Send /today for your daily summary.`);
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === 'cancel premium') {
      await updateUser(telegramId, { plan: 'free', premium_expires_at: null } as any);
      await sendMessage(chatId,
        `Done — your Premium subscription has been cancelled 🌸

You're now on the free plan. If you change your mind, /premium is always there.`
      );
      return NextResponse.json({ ok: true });
    }

    // /help and /settings handled in handleCommand

    if (normalizedText === 'delete my data') {
      await sendMessage(chatId,
        `Are you sure you want to delete all your data? This cannot be undone.\n\nSend *YES DELETE* to confirm.`
      );
      await updateUser(telegramId, { onboarding_step: 99 });
      return NextResponse.json({ ok: true });
    }

    // ── Onboarding ────────────────────────────────────────────────────────────
    if (!user.onboarding_complete) {
      const { handleOnboardingStep } = await import('@/lib/ava/onboarding-raw');
      await handleOnboardingStep(chatId, telegramId, user, text, sendMessage);
      return NextResponse.json({ ok: true });
    }

    // ── Period confirmation reply ─────────────────────────────────────────────
    // IMPORTANT: this must only fire when Ava actually asked "did your
    // period start?" (set by the cron/alerts job via onboarding_step=85).
    // Previously this matched ANY "yes"/"no" the user ever sent, in any
    // context — so answering a normal conversational question with "yes"
    // would silently get hijacked into logging a period start. That was a
    // major contributor to "doesn't respond well to normal conversation".
    const awaitingPeriodConfirmation = user.onboarding_step === 85;

    if (awaitingPeriodConfirmation && ['yes', 'yes it did', 'it started', 'yep', 'yeah'].includes(normalizedText)) {
      const today = new Date().toISOString().split('T')[0];
      const { getCycleData, upsertCycleData } = await import('@/lib/ava/db');
      const { predictNextPeriod, predictOvulationWindow } = await import('@/lib/ava/cycle');
      const existing = await getCycleData(user.id);
      const avg = Number(existing?.avg_cycle_length) || 28;
      const todayDate = new Date();
      const { start: ns, end: ne } = predictNextPeriod(todayDate, avg);
      const { start: os, end: oe } = predictOvulationWindow(ns, avg);
      const existingDates = existing?.period_start_dates || [];
      await upsertCycleData(user.id, {
        period_start_dates: [...existingDates, today],
        next_period_start: ns.toISOString().split('T')[0],
        next_period_end: ne.toISOString().split('T')[0],
        next_ovulation_start: os.toISOString().split('T')[0],
        next_ovulation_end: oe.toISOString().split('T')[0],
      });
      await updateUser(telegramId, { onboarding_step: 0 } as any);
      const nextStr = ns.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
      await sendMessage(chatId,
        `Got it, ${user.name} 🩸 I've noted today as your period start.

Your next period is estimated around *${nextStr}*. How are you feeling?`
      );
      return NextResponse.json({ ok: true });
    }

    if (awaitingPeriodConfirmation && ['not yet', 'nope', 'no', 'not started', 'nothing yet'].includes(normalizedText)) {
      await updateUser(telegramId, { onboarding_step: 0 } as any);
      await sendMessage(chatId,
        `No worries — cycles can vary a few days 🌸 I'll keep an eye on it. Let me know when it starts.`
      );
      return NextResponse.json({ ok: true });
    }

    // ── Settings flow ─────────────────────────────────────────────────────────
    if (user.onboarding_step >= 90) {
      const { handleSettingsStep } = await import('@/lib/ava/settings');
      await handleSettingsStep(chatId, telegramId, user, text, sendMessage);
      return NextResponse.json({ ok: true });
    }

    // ── Main AI router ────────────────────────────────────────────────────────
    await sendTyping(chatId);
    const memoryLogs = await getMemoryContext(user.id, user.plan);

    // Check if this is a natural moment to suggest premium (free users only)
    if (user.plan === 'free') {
      const [category, upgradeSuggested] = await Promise.all([
        classifyMessage(text),
        shouldSuggestPremium(text, user.plan),
      ]);

      if (upgradeSuggested) {
        const { createPaymentLink } = await import('@/lib/ava/paystack');
        const [pitch, link] = await Promise.all([
          generatePremiumPitch(user.name || 'there', text),
          createPaymentLink(user.telegram_id, user.name || 'friend'),
        ]);
        const linkText = link ? `\n\n[Upgrade to Premium](${link.url}) ✨` : '';
        await sendMessage(chatId, pitch + linkText);
        return NextResponse.json({ ok: true });
      }

      // Route normally
      await routeMessage(category, text, chatId, user, memoryLogs);
    } else {
      const category = await classifyMessage(text);
      await routeMessage(category, text, chatId, user, memoryLogs);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}

async function handleCommand(
  text: string,
  chatId: number,
  telegramId: number,
  user: any,
  send: typeof sendMessage,
  sendKb: typeof sendWithKeyboard
) {
  const cmd = text.split(' ')[0].toLowerCase(); // handle /command@botname format

  switch (cmd) {
    case '/start': {
      if (!user) {
        await send(chatId, "Hi, I'm *Ava* 🌸\n\nI'm your personal cycle & wellness companion.\n\nLet's get you set up — what's your name?", true);
        return;
      }
      if (user.onboarding_complete) {
        await send(chatId, "Hey " + (user.name || 'there') + " 🌸\n\n/today — daily summary\n/remedies — natural remedies\n/insights — what Ava knows about you\n/settings — update your info\n/premium — upgrade\n/help — all commands\n\nOr just talk to me anytime.");
      } else {
        await send(chatId, "Hi, I'm *Ava* 🌸 Let's get you set up — what's your name?", true);
      }
      return;
    }

    case '/today': {
      if (!user?.onboarding_complete) { await send(chatId, "Finish setup first — send /start 🌸"); return; }
      await sendTyping(chatId);
      if ((user as any).mode === 'pregnant') {
        const { buildPregnancySummary } = await import('@/lib/ava/pregnancy');
        await send(chatId, await buildPregnancySummary(user));
      } else {
        const { buildTodaySummary } = await import('@/lib/ava/today');
        await send(chatId, await buildTodaySummary(user));
      }
      return;
    }

    case '/log': {
      await send(chatId, "What's going on today? 📝\n\nJust tell me naturally — \"I have cramps\", \"feeling tired\", \"light flow\", \"had sex\". I'll take it from there 🌸");
      return;
    }

    case '/remedies': {
      if (!user?.onboarding_complete) { await send(chatId, "Finish setup first — send /start 🌸"); return; }
      const { showConditionMenu } = await import('@/lib/ava/remedy-engine');
      await showConditionMenu(chatId, user, sendKb);
      return;
    }

    case '/insights': {
      if (!user?.onboarding_complete) { await send(chatId, "Finish setup first — send /start 🌸"); return; }
      await sendTyping(chatId);
      const { generatePersonalInsights } = await import('@/lib/ava/insights');
      const { getCycleData, getMemoryContext } = await import('@/lib/ava/db');
      const [cycleData, logs] = await Promise.all([getCycleData(user.id), getMemoryContext(user.id, user.plan)]);
      await send(chatId, await generatePersonalInsights(user, logs, cycleData));
      return;
    }

    case '/changes': {
      if (!user?.onboarding_complete) { await send(chatId, "Finish setup first — send /start 🌸"); return; }
      await sendTyping(chatId);
      const { generateRecentChanges } = await import('@/lib/ava/insights');
      const { getMemoryContext } = await import('@/lib/ava/db');
      await send(chatId, await generateRecentChanges(user, await getMemoryContext(user.id, user.plan)));
      return;
    }

    case '/patterns': {
      if (!user?.onboarding_complete) { await send(chatId, "Finish setup first — send /start 🌸"); return; }
      await sendTyping(chatId);
      const { detectPatterns } = await import('@/lib/ava/insights');
      const { getCycleData, getMemoryContext } = await import('@/lib/ava/db');
      const [cd, ml] = await Promise.all([getCycleData(user.id), getMemoryContext(user.id, user.plan)]);
      const patterns = await detectPatterns(user, ml, cd);
      const found = Object.entries(patterns).filter(([, v]) => v !== null).map(([, v]) => '• ' + String(v)).join('\n');
      if (!found) { await send(chatId, "I haven't spotted strong patterns yet — keep logging and I'll connect the dots 🌸"); }
      else { await send(chatId, "Here's what I've noticed 🌸\n\n" + found + "\n\nThese are observations, not diagnoses."); }
      return;
    }

    case '/docprep': {
      if (!user?.onboarding_complete) { await send(chatId, "Finish setup first — send /start 🌸"); return; }
      await sendTyping(chatId);
      const { generateDoctorPrep } = await import('@/lib/ava/insights');
      const { getCycleData, getMemoryContext } = await import('@/lib/ava/db');
      const [cd2, ml2] = await Promise.all([getCycleData(user.id), getMemoryContext(user.id, user.plan)]);
      await send(chatId, await generateDoctorPrep(user, ml2, cd2), true);
      return;
    }

    case '/weekly': {
      if (!user?.onboarding_complete) { await send(chatId, "Finish setup first — send /start 🌸"); return; }
      await sendTyping(chatId);
      const { generateWeeklyBriefing } = await import('@/lib/ava/insights');
      const { getCycleData, getMemoryContext } = await import('@/lib/ava/db');
      const [cd3, ml3] = await Promise.all([getCycleData(user.id), getMemoryContext(user.id, user.plan)]);
      await send(chatId, await generateWeeklyBriefing(user, ml3, cd3));
      return;
    }

    case '/premium': {
      if (user?.plan === 'premium') {
        const exp = (user as any).premium_expires_at
          ? new Date((user as any).premium_expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'active';
        await send(chatId, "You're already on *Ava Premium* — active until " + exp + " 🌸", true);
        return;
      }
      const { createPaymentLink } = await import('@/lib/ava/paystack');
      const link = user ? await createPaymentLink(telegramId, user.name || 'friend') : null;
      const linkText = link ? "\n\n[Upgrade to Premium](" + link.url + ") ✨" : '';
      await send(chatId, "*Ava Premium — ₦2,000/month*\n\n• All 160+ remedies across 50 conditions\n• 5 months memory\n• Morning digest at 8am\n• Ovulation strip reading\n• Monthly cycle PDF\n• Doctor visit prep" + linkText, true);
      return;
    }

    case '/report': {
      if (!user?.onboarding_complete) { await send(chatId, "Finish setup first — send /start 🌸"); return; }
      if (user.plan !== 'premium') { await send(chatId, "Monthly cycle reports are a Premium feature ✨\n\nUpgrade with /premium to unlock 🌸"); return; }
      await sendTyping(chatId);
      try {
        const { generateCycleReport } = await import('@/lib/ava/pdf');
        const { getCycleData, getMemoryContext } = await import('@/lib/ava/db');
        const [cd4, ml4] = await Promise.all([getCycleData(user.id), getMemoryContext(user.id, 'premium')]);
        const pdfBuffer = await generateCycleReport(user, cd4, ml4);
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('caption', "Your cycle report 🌸");
        formData.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), "ava-report.pdf");
        const tgUrl = "https://api.telegram.org/bot" + process.env.TELEGRAM_BOT_TOKEN + "/sendDocument";
        await fetch(tgUrl, { method: 'POST', body: formData });
      } catch (err) { console.error('PDF error:', err); await send(chatId, "Couldn't generate your report right now — please try again 🌸"); }
      return;
    }

    case '/settings': {
      if (!user) { await send(chatId, "Send /start to begin 🌸"); return; }
      await send(chatId, "What would you like to update? ⚙️\n\n1. My name\n2. Last period date\n3. Cycle length\n4. Period duration\n5. My goal\n6. Switch mode (cycle/pregnancy)\n7. Delete my data\n\nJust send the number.");
      const { updateUser } = await import('@/lib/ava/db');
      await updateUser(telegramId, { onboarding_step: 90 } as any);
      return;
    }

    case '/deletedata': {
      if (!user) { await send(chatId, "Send /start to begin 🌸"); return; }
      await send(chatId, "Are you sure you want to delete all your data? This cannot be undone.\n\nSend *YES DELETE* to confirm.", true);
      const { updateUser } = await import('@/lib/ava/db');
      await updateUser(telegramId, { onboarding_step: 99 } as any);
      return;
    }

    case '/cancel': {
      if (user?.plan !== 'premium') { await send(chatId, "You're on the free plan — nothing to cancel 🌸"); return; }
      await send(chatId, "To cancel, send *CANCEL PREMIUM*. You'll keep Premium until your current period ends.", true);
      return;
    }

    case '/help': {
      await send(chatId,
        "/today — cycle summary\n" +
        "/remedies — natural remedies\n" +
        "/insights — what Ava has learned about you\n" +
        "/changes — what changed recently\n" +
        "/patterns — recurring patterns\n" +
        "/docprep — doctor visit summary\n" +
        "/weekly — weekly briefing\n" +
        "/log — track symptoms\n" +
        "/settings — update your info\n" +
        "/premium — upgrade\n" +
        "/report — monthly PDF (Premium)\n\n" +
        "Or just talk to me naturally 🌸"
      );
      return;
    }

    default: {
      // Unknown command — let the user know
      await send(chatId, "I don't recognise that command. Send /help to see what I can do 🌸");
      return;
    }
  }
}

async function maybeSuggestRemedy(chatId: number, user: any, text: string): Promise<void> {
  const { getActiveRemedies, showRemedyList } = await import('@/lib/ava/remedy-engine');
  const { detectCondition } = await import('@/lib/ava/remedies');

  const detectedCondition = detectCondition(text);
  if (!detectedCondition) return;

  const alreadyTracking = await getActiveRemedies(user.id);
  const alreadyHasThis = alreadyTracking.some((r: any) => r.condition === detectedCondition);
  if (alreadyHasThis) return;

  await sendMessage(chatId, 'By the way — I have some natural remedies that might help with this 🌿');
  await showRemedyList(chatId, user, detectedCondition, sendWithKeyboard);
  await addMemoryLog(user.id, 'insight', 'Suggested remedies for ' + detectedCondition);
}

async function routeMessage(
  category: string,
  text: string,
  chatId: number,
  user: any,
  memoryLogs: any[]
) {
  // Check for remedy outcome update
  const { detectRemedyIntent, updateRemedyOutcome } = await import('@/lib/ava/remedy-engine');

  const { action, remedyId } = await detectRemedyIntent(text);
  if (action === 'update' && remedyId) {
    await updateRemedyOutcome(chatId, user, remedyId, text, sendMessage);
    return;
  }

  if (category === 'LOG') {
    const { category: logCat, summary } = await extractLogSummary(text);
    await addMemoryLog(user.id, logCat as any, summary);

    const followUpPrompt = `The user just said: "${text}"

Write exactly 3 sentences:
Sentence 1: Acknowledge with warmth and empathy.
Sentence 2: Give one relevant insight based on their context if available.
Sentence 3: Ask ONE caring follow-up question.

Do not write more than 3 sentences. Count them before sending.

Their recent context: ${memoryLogs.slice(0, 10).map((l: any) => l.summary).join(', ') || 'none yet'}`;

    await sendTyping(chatId);
    const response = await handleConversation(user, followUpPrompt, memoryLogs);
    await sendMessage(chatId, response || `Aww — how are you feeling overall? 🌸`, false);
    const insight = await summarizeChatInsight(text, response);
    await addMemoryLog(user.id, 'chat', insight);

    // Auto-suggest remedy list if a symptom keyword is detected and the user
    // isn't already tracking a remedy for it.
    await maybeSuggestRemedy(chatId, user, text);

  } else if (category === 'RETRIEVAL') {
    const response = await handleRetrieval(user, text, memoryLogs);
    await sendMessage(chatId, response || `I need a bit more data to spot that pattern — keep sharing and I'll connect the dots 🌸`, false);

  } else {
    const response = await handleConversation(user, text, memoryLogs);
    await sendMessage(chatId, response || `I'm here — tell me more 🌸`, false);
    const insight = await summarizeChatInsight(text, response);
    await addMemoryLog(user.id, 'chat', insight);

    // Free-flowing conversation can mention a symptom too ("ugh my back is
    // killing me today") without it being classified as a LOG entry —
    // remedy suggestions shouldn't only fire for explicit symptom logs.
    await maybeSuggestRemedy(chatId, user, text);
  }
}


export async function GET() {
  return NextResponse.json({ status: 'Ava webhook live 🌸' });
}
