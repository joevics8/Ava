import { withFreshForecast } from './cycle';
import { logged } from '@/lib/supabase-util';
import { sendTelegram } from '@/lib/telegram';
import { useUserTimezone } from './tz-context';
import { DEFAULT_TZ } from './timezone';
import { claimSend, daysSilentFrom, inMorningWindow, isWeeklyDay, releaseSend, todayFor } from './cron-gate';
import { supabaseAdmin } from '@/lib/supabase';
import { generateWeeklyBriefing } from '@/lib/ava/insights';
import type { AvaUser } from '@/types';

async function sendMessage(chatId: number, text: string): Promise<boolean> {
  return (await sendTelegram(chatId, text, { markdown: true })).ok;
}

export async function runRemedyFollowUps(): Promise<{ sent: number; total: number }> {
  const now = new Date().toISOString();

  const { data: due } = await supabaseAdmin
    .from('user_remedies')
    .select('*, users(telegram_id, name, timezone, last_seen_at)')
    .lte('follow_up_at', now)
    .is('outcome', null)
    .eq('active', true);

  if (!due?.length) return { sent: 0, total: 0 };

  let sent = 0;
  for (const item of due) {
    try {
      const telegramId = (item.users as any)?.telegram_id;
      const name = (item.users as any)?.name || 'there';
      if (!telegramId) continue;
      // Only in her local morning (hourly cron), and not while she has gone quiet for over two weeks.
      const tz = (item.users as any)?.timezone || DEFAULT_TZ;
      if (!inMorningWindow(tz) || daysSilentFrom((item.users as any)?.last_seen_at) > 14) continue;

      const conditionLabel = item.condition.replace(/_/g, ' ');
      const followUpMsg = item.outcome === null && item.notes === null
        ? 'Hey ' + name + ' 🌿 A week ago you saved ' + item.remedy_name + ' to try for your ' + conditionLabel + '.\n\nHave you started trying it yet? Just let me know how it is going.'
        : 'Hey ' + name + ' 🌿 How is ' + item.remedy_name + ' going for your ' + conditionLabel + '?\n\nReply: it helped, it partially helped, or it did not help and I will note it.';

      if (!(await sendMessage(telegramId, followUpMsg))) { console.error('Remedy follow-up not delivered:', item.id); continue; }

      // Remember we asked (so her plain reply counts as the answer), and stop after 3 unanswered check-ins.
      const asked = (item.follow_up_count ?? 0) + 1;
      const nextFollowUp = new Date();
      nextFollowUp.setDate(nextFollowUp.getDate() + 7);
      await logged('user_remedies write', supabaseAdmin
        .from('user_remedies')
        .update({ follow_up_at: asked >= 3 ? null : nextFollowUp.toISOString(), follow_up_sent_at: new Date().toISOString(), follow_up_count: asked })
        .eq('id', item.id));

      sent++;
    } catch (err) {
      console.error('Remedy follow-up per-item error:', item.id, err);
    }
  }

  return { sent, total: due.length };
}

export async function runWeeklyBriefings(): Promise<{ sent: number; total: number }> {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('plan', 'premium')
    .eq('onboarding_complete', true);

  if (!users?.length) return { sent: 0, total: 0 };

  let sent = 0;
  for (const user of users as AvaUser[]) {
    try {
      const tz = (user as any).timezone || DEFAULT_TZ;
      useUserTimezone(tz);
      // Her Sunday morning, once a week; if she has been silent 2+ weeks, skip until she writes.
      if (!isWeeklyDay(tz) || !inMorningWindow(tz)) continue;
      if (daysSilentFrom((user as any).last_seen_at) > 14) continue;
      const day = todayFor(tz);
      if (!(await claimSend(user.id, 'weekly', day))) continue;
      const { data: cycleRow } = await supabaseAdmin
        .from('cycle_data').select('*').eq('user_id', user.id).single();
      const cycle = withFreshForecast(cycleRow); // forecast always recalculated from the period dates
      const { data: logs } = await supabaseAdmin
        .from('memory_log').select('*').eq('user_id', user.id)
        .order('logged_at', { ascending: false }).limit(60);

      const briefing = await generateWeeklyBriefing(user, logs || [], cycle);
      if (await sendMessage(user.telegram_id, `📊 *Your Weekly Briefing*\n\n${briefing}`)) sent++;
      else await releaseSend(user.id, 'weekly', day);
    } catch (err) {
      console.error(`Weekly briefing failed for ${user.telegram_id}:`, err);
    }
  }

  return { sent, total: users.length };
}
