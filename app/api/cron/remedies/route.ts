import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Find remedies due for follow-up
  const { data: due } = await supabaseAdmin
    .from('user_remedies')
    .select('*, users(telegram_id, name)')
    .lte('follow_up_at', now)
    .is('outcome', null)
    .eq('active', true);

  if (!due?.length) return NextResponse.json({ checked: 0 });

  let sent = 0;
  for (const item of due) {
    const telegramId = (item.users as any)?.telegram_id;
    const name = (item.users as any)?.name || 'there';
    if (!telegramId) continue;

    const conditionLabel = item.condition.replace(/_/g, ' ');
    const followUpMsg = item.outcome === null && item.notes === null
      ? 'Hey ' + name + ' 🌿 A week ago you saved ' + item.remedy_name + ' to try for your ' + conditionLabel + '.\n\nHave you started trying it yet? Just let me know how it is going.'
      : 'Hey ' + name + ' 🌿 How is ' + item.remedy_name + ' going for your ' + conditionLabel + '?\n\nReply: it helped, it partially helped, or it did not help and I will note it.';

    await sendMessage(telegramId, followUpMsg);

    // Push follow-up 7 more days
    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + 7);
    await supabaseAdmin
      .from('user_remedies')
      .update({ follow_up_at: nextFollowUp.toISOString() })
      .eq('id', item.id);

    sent++;
  }

  return NextResponse.json({ sent, total: due.length });
}
