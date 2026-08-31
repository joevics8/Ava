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
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
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

    // Get or create user
    let user = await getUser(telegramId);
    if (!user) {
      user = await createUser(telegramId);
      await sendMessage(chatId,
        `Hi, I'm *Ava* 🌸\n\nI'm your personal cycle and wellness companion. I learn your body, remember your patterns, and talk to you like a friend who actually gets it.\n\nLet's get you set up — what's your name?`
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /start command
    if (text === '/start') {
      if (user.onboarding_complete) {
        await sendMessage(chatId,
          `Welcome back, ${user.name} 🌸\n\nWhat would you like to do?\n• /today — daily summary\n• /log — track symptoms\n• /help — all commands`
        );
      } else {
        await sendMessage(chatId,
          `Hi, I'm *Ava* 🌸\n\nI'm your personal cycle and wellness companion.\n\nLet's get you set up — what's your name?`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Still in onboarding
    if (!user.onboarding_complete) {
      const { handleOnboardingStep } = await import('@/lib/ava/onboarding-raw');
      await handleOnboardingStep(chatId, telegramId, user, text, sendMessage);
      return NextResponse.json({ ok: true });
    }

    // /today command
    if (text === '/today') {
      const { buildTodaySummary } = await import('@/lib/ava/today');
      const summary = await buildTodaySummary(user);
      await sendMessage(chatId, summary);
      return NextResponse.json({ ok: true });
    }

    // Main AI router
    const memoryLogs = await getMemoryContext(user.id, user.plan);
    const category = await classifyMessage(text);

    if (category === 'LOG') {
      const { category: logCat, summary } = await extractLogSummary(text);
      await addMemoryLog(user.id, logCat as any, summary);
      const hasQuestion = text.includes('?') || /is this|why|when|how/i.test(text);
      if (hasQuestion) {
        const response = await handleConversation(user, text, memoryLogs);
        await sendMessage(chatId, response);
        const insight = await summarizeChatInsight(text, response);
        await addMemoryLog(user.id, 'chat', insight);
      } else {
        await sendMessage(chatId, `Logged 🌸 I've noted that down.`);
      }
    } else if (category === 'RETRIEVAL') {
      const response = await handleRetrieval(user, text, memoryLogs);
      await sendMessage(chatId, response);
    } else {
      const response = await handleConversation(user, text, memoryLogs);
      await sendMessage(chatId, response);
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
