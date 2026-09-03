import { NextRequest, NextResponse } from 'next/server';
import { getUser, createUser, getMemoryContext, addMemoryLog } from '@/lib/ava/db';
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

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

async function sendTyping(chatId: number) {
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true });
    }

    const update = await req.json();
    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId: number = message.chat.id;
    const telegramId: number = message.from.id;
    const text: string = message.text || '';

    // ── Photo messages ────────────────────────────────────────────────────────
    if (message.photo?.length) {
      await sendTyping(chatId);
      let user = await getUser(telegramId);
      if (!user) { user = await createUser(telegramId); }

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
          await sendMessage(chatId, `If this is a positive result, I want you to know I'm here for you whatever you're feeling 🌸 Would you like to switch to pregnancy mode?`);
          await addMemoryLog(user.id, 'insight', 'Positive pregnancy test logged');
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
        `Hi, I'm *Ava* 🌸\n\nI'm your personal cycle & wellness companion. I can help you understand your cycle, track symptoms, and answer questions about your body.\n\nLet's get you set up — it only takes a minute.\n\nWhat's your name?`
      );
      return NextResponse.json({ ok: true });
    }

    // ── Commands ─────────────────────────────────────────────────────────────
    if (text === '/start') {
      if (user.onboarding_complete) {
        await sendMessage(chatId,
          `Hey ${user.name} 🌸\n\n/today — daily summary\n/log — track something\n/premium — upgrade\n\nOr just talk to me.`
        );
      } else {
        await sendMessage(chatId, `Hi, I'm *Ava* 🌸 What's your name?`);
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/today') {
      await sendTyping(chatId);
      const { buildTodaySummary } = await import('@/lib/ava/today');
      const summary = await buildTodaySummary(user);
      await sendMessage(chatId, summary);
      return NextResponse.json({ ok: true });
    }

    if (text === '/log') {
      await sendMessage(chatId,
        `What's going on today? 📝\n\nJust tell me naturally — "I have cramps", "feeling tired", "light flow", "had sex". I'll take it from there 🌸`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/premium') {
      if (user.plan === 'premium') {
        const expires = (user as any).premium_expires_at
          ? new Date((user as any).premium_expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'active';
        await sendMessage(chatId, `✨ You're already on *Ava Premium* — active until ${expires} 🌸`);
      } else {
        const { createPaymentLink } = await import('@/lib/ava/paystack');
        const link = await createPaymentLink(telegramId, user.name || 'friend');
        if (link) {
          await sendMessage(chatId,
            `✨ *Ava Premium — ₦2,000/month*\n\n• 5 months of memory\n• Morning digest at 8am\n• Ovulation strip reading\n• Monthly cycle PDF\n\n[Tap here to upgrade](${link.url}) 🌸`
          );
        } else {
          await sendMessage(chatId, `Something went wrong generating your payment link — please try again in a moment 🌸`);
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/report') {
      if (user.plan !== 'premium') {
        await sendMessage(chatId, `Monthly cycle reports are a Premium feature ✨\n\nUpgrade with /premium to unlock this and more 🌸`);
        return NextResponse.json({ ok: true });
      }
      await sendTyping(chatId);
      try {
        const { generateCycleReport } = await import('@/lib/ava/pdf');
        const { getCycleData, getMemoryContext } = await import('@/lib/ava/db');
        const [cycleData, memoryLogs] = await Promise.all([
          getCycleData(user.id),
          getMemoryContext(user.id, 'premium'),
        ]);
        const pdfBuffer = await generateCycleReport(user, cycleData, memoryLogs);

        // Send as Telegram document via multipart
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('caption', `Your cycle report — ${new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })} 🌸`);
        formData.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), `ava-report-${Date.now()}.pdf`);

        const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`;
        await fetch(tgUrl, {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        console.error('PDF error:', err);
        await sendMessage(chatId, `Couldn't generate your report right now — please try again in a moment 🌸`);
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/help') {
      await sendMessage(chatId,
        `/today — cycle summary\n/log — track symptoms\n/settings — update your info\n/premium — upgrade\n/report — monthly PDF (Premium)\n\nOr just talk to me naturally 🌸`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/settings') {
      await sendMessage(chatId,
        `What would you like to update? ⚙️\n\n1. My name\n2. Last period date\n3. Cycle length\n4. Period duration\n5. My goal\n6. Delete my data\n\nJust send the number.`
      );
      await updateUser(telegramId, { onboarding_step: 90 });
      return NextResponse.json({ ok: true });
    }

    if (text === 'delete my data' || text === '/deletedata') {
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
    const lowerText = text.toLowerCase().trim();
    if (['yes', 'yes it did', 'it started', 'yep', 'yeah'].includes(lowerText)) {
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
      const nextStr = ns.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
      await sendMessage(chatId,
        `Got it, ${user.name} 🩸 I've noted today as your period start.

Your next period is estimated around *${nextStr}*. How are you feeling?`
      );
      return NextResponse.json({ ok: true });
    }

    if (['not yet', 'nope', 'no', 'not started', 'nothing yet'].includes(lowerText)) {
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

    if (category === 'LOG') {
      const { category: logCat, summary } = await extractLogSummary(text);
      await addMemoryLog(user.id, logCat as any, summary);

      const followUpPrompt = `User logged: "${text}"

Acknowledge warmly (1 sentence), give a brief insight if relevant to their cycle, then ask ONE caring follow-up question. Max 3 sentences total. No lists.

Recent logs: ${memoryLogs.slice(0, 10).map(l => l.summary).join(', ') || 'none yet'}`;

      await sendTyping(chatId);
      const response = await handleConversation(user, followUpPrompt, memoryLogs);
      await sendMessage(chatId, response || `Aww, that sounds tough — how are you feeling overall? 🌸`);
      const insight = await summarizeChatInsight(text, response);
      await addMemoryLog(user.id, 'chat', insight);

    } else if (category === 'RETRIEVAL') {
      const response = await handleRetrieval(user, text, memoryLogs);
      await sendMessage(chatId, response || `I need more data to spot patterns — keep logging and I'll connect the dots 🌸`);

    } else {
      const response = await handleConversation(user, text, memoryLogs);
      await sendMessage(chatId, response || `I'm here — tell me more 🌸`);
      const insight = await summarizeChatInsight(text, response);
      await addMemoryLog(user.id, 'chat', insight);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}

async function routeMessage(
  category: string,
  text: string,
  chatId: number,
  user: any,
  memoryLogs: any[]
) {
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
    await sendMessage(chatId, response || `Aww — how are you feeling overall? 🌸`);
    const insight = await summarizeChatInsight(text, response);
    await addMemoryLog(user.id, 'chat', insight);

  } else if (category === 'RETRIEVAL') {
    const response = await handleRetrieval(user, text, memoryLogs);
    await sendMessage(chatId, response || `I need a bit more data to spot that pattern — keep sharing and I'll connect the dots 🌸`);

  } else {
    const response = await handleConversation(user, text, memoryLogs);
    await sendMessage(chatId, response || `I'm here — tell me more 🌸`);
    const insight = await summarizeChatInsight(text, response);
    await addMemoryLog(user.id, 'chat', insight);
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Ava webhook live 🌸' });
}
