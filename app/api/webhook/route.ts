import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Telegram update received:', JSON.stringify(body).slice(0, 200));

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = req.headers.get('x-telegram-bot-api-secret-token');

    console.log('Token present:', !!token);
    console.log('Secret match:', secret === process.env.TELEGRAM_WEBHOOK_SECRET);

    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN is missing!');
      return NextResponse.json({ ok: true }); // still 200 so Telegram doesn't retry
    }

    // Import and init bot lazily
    const { default: bot } = await import('@/lib/bot');
    await bot.init();
    await bot.handleUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true }); // always 200 to Telegram
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Ava webhook live 🌸',
    token: !!process.env.TELEGRAM_BOT_TOKEN,
    secret: !!process.env.TELEGRAM_WEBHOOK_SECRET,
  });
}
