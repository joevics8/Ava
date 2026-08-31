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

    // ── Get or create user ───────────────────────────────────────────────────
    let user = await getUser(telegramId);
    if (!user) {
      user = await createUser(telegramId);
      await sendMessage(chatId,
        `Hi, I'm *Ava* 🌸\n\nI'm your personal cycle and wellness companion. I learn your body, remember your patterns, and talk to you like a friend who actually gets it.\n\nLet's get started — what's your name?`
      );
      return NextResponse.json({ ok: true });
    }

    // ── Commands ─────────────────────────────────────────────────────────────
    if (text === '/start') {
      if (user.onboarding_complete) {
        await sendMessage(chatId,
          `Welcome back, ${user.name} 🌸\n\n• /today — your daily summary\n• /log — track symptoms\n• /premium — upgrade for more memory\n\nOr just talk to me anytime.`
        );
      } else {
        await sendMessage(chatId,
          `Hi, I'm *Ava* 🌸\n\nLet's get you set up — what's your name?`
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/today') {
      const { buildTodaySummary } = await import('@/lib/ava/today');
      const summary = await buildTodaySummary(user);
      await sendMessage(chatId, summary);
      return NextResponse.json({ ok: true });
    }

    if (text === '/log') {
      await sendMessage(chatId,
        `What would you like to log today? 📝\n\nJust tell me naturally — for example:\n• "I have cramps"\n• "Feeling tired and bloated"\n• "Had unprotected sex"\n• "Light flow today"\n• "Mood: anxious"\n\nOr type anything and I'll figure it out 🌸`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/premium') {
      await sendMessage(chatId,
        `✨ *Ava Premium — ₦2,000/month*\n\n• 5 months of memory (vs 2 weeks free)\n• Morning daily digest at 8am\n• Ovulation test strip reading\n• Monthly cycle PDF report\n\nPremium coming soon! We'll notify you when it launches. 🌸`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/help') {
      await sendMessage(chatId,
        `Here's what I can do:\n\n• /today — your daily cycle summary\n• /log — track symptoms, mood, flow\n• /premium — see premium features\n\nOr just talk to me naturally anytime — "I have cramps", "when is my next period?", "is spotting normal?" 🌸`
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
    const memoryLogs = await getMemoryContext(user.id, user.plan);
    const category = await classifyMessage(text);

    if (category === 'LOG') {
      // Save the log
      const { category: logCat, summary } = await extractLogSummary(text);
      await addMemoryLog(user.id, logCat as any, summary);

      // Always respond warmly + ask a follow-up — Ava is a friend, not a logger
      const followUpPrompt = `The user just logged: "${text}"
      
You are Ava, a warm cycle and wellness companion. 
1. Acknowledge what they logged with empathy
2. Give a brief, helpful insight based on their cycle phase or history if relevant
3. Ask ONE caring follow-up question to learn more

User memory context:
${memoryLogs.slice(0, 15).map(l => `[${l.category}] ${l.summary}`).join('\n') || 'No history yet'}

Keep it under 100 words. Warm, friendly, never clinical.`;

      const response = await handleConversation(user, followUpPrompt, memoryLogs);
      await sendMessage(chatId, response || `Got it, I've logged that 🌸 How are you feeling overall right now?`);
      const insight = await summarizeChatInsight(text, response);
      await addMemoryLog(user.id, 'chat', insight);

    } else if (category === 'RETRIEVAL') {
      const response = await handleRetrieval(user, text, memoryLogs);
      await sendMessage(chatId, response || `I don't have enough logged data yet to answer that, ${user.name}. Keep logging and I'll spot the patterns! 🌸`);

    } else {
      // CONVERSATION
      const response = await handleConversation(user, text, memoryLogs);
      await sendMessage(chatId, response || `I'm here, ${user.name}. Tell me more so I can help 🌸`);
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
