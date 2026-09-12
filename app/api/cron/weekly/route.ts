import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyBriefings } from '@/lib/ava/cron-tasks';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

const ADMIN_TELEGRAM_ID = Number(process.env.ADMIN_TELEGRAM_ID || 5944321602);
async function notifyAdmin(context: string, err: unknown) {
  try {
    const detail = err instanceof Error ? err.message : String(err);
    await sendMessage(ADMIN_TELEGRAM_ID, `⚠️ Ava cron error in ${context}:\n${detail.slice(0, 500)}`);
  } catch {
    // Nothing more we can do if even the alert fails.
  }
}

// Triggered independently via cron-job.org (an external scheduler) —
// each cron route here is a standalone, self-contained endpoint.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runWeeklyBriefings();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Weekly cron error:', err);
    await notifyAdmin('cron/weekly', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
