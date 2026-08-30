import { NextRequest, NextResponse } from 'next/server';
import bot from '@/lib/bot';
import { webhookCallback } from 'grammy';

const handleUpdate = webhookCallback(bot, 'std/http');

export async function POST(req: NextRequest) {
  // Verify secret token from Telegram
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return await handleUpdate(req);
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Telegram only sends POST
export async function GET() {
  return NextResponse.json({ status: 'Ava webhook is live 🌸' });
}
