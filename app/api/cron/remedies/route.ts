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

    await sendMessage(telegramId,
      `Hey ${name} 🌿 A month ago you started trying *${item.remedy_name}*.\n\nHas it been helping with your ${item.condition.replace(/_/g, ' ')}?\n\nJust reply: *it helped*, *it partially helped*, or *it didn't help* and I'll note it down.`
    );

    // Push follow-up back 30 more days in case they don't respond immediately
    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + 30);
    await supabaseAdmin
      .from('user_remedies')
      .update({ follow_up_at: nextFollowUp.toISOString() })
      .eq('id', item.id);

    sent++;
  }

  return NextResponse.json({ sent, total: due.length });
}
