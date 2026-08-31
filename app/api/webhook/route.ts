import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import bot from '@/lib/bot';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = await req.json();

    // Grammy requires bot.init() in serverless/webhook mode
    // This calls getMe once per cold start to get bot info
    await bot.init();

    // Respond to Telegram immediately, process in background
    waitUntil(bot.handleUpdate(update));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Ava webhook is live 🌸' });
}
