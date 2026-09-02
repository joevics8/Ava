import { NextRequest, NextResponse } from 'next/server';
import { getUser, createUser, getMemoryContext, addMemoryLog } from '@/lib/ava/db';
import {
  classifyMessage,
  extractLogSummary,
  handleRetrieval,
  handleConversation,
  summarizeChatInsight,
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
      await sendMessage(chatId,
        `✨ *Ava Premium — ₦2,000/month*\n\n• 5 months memory (vs 2 weeks free)\n• Morning digest at 8am\n• Ovulation strip reading\n• Monthly cycle PDF\n\nLaunching soon — we'll notify you 🌸`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/help') {
      await sendMessage(chatId,
        `/today — cycle summary\n/log — track symptoms\n/premium — upgrade\n\nOr just message me anything 🌸`
      );
      return NextResponse.json({ ok: true });
    }

    // ── Onboarding ────────────────────────────────────────────────────────────
    if (!user.onboarding_complete) {
      const { handleOnboardingStep } = await import('@/lib/ava/onboarding-raw');
      await handleOnboardingStep(chatId, telegramId, user, text, sendMessage);
      return NextResponse.json({ ok: true });
    }

    // ── Main AI router ────────────────────────────────────────────────────────
    await sendTyping(chatId);
    const memoryLogs = await getMemoryContext(user.id, user.plan);
    const category = await classifyMessage(text);

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

export async function GET() {
  return NextResponse.json({ status: 'Ava webhook live 🌸' });
}
