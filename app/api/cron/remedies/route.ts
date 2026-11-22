import { NextRequest, NextResponse } from 'next/server';
import { sendTelegram } from '@/lib/telegram';
import { runRemedyFollowUps } from '@/lib/ava/cron-tasks';

async function sendMessage(chatId: number, text: string): Promise<boolean> {
  return (await sendTelegram(chatId, text, { markdown: true })).ok;
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
    const result = await runRemedyFollowUps();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Remedies cron error:', err);
    await notifyAdmin('cron/remedies', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
