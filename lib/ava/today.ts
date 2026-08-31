import { getCycleData, getMemoryContext } from './db';
import { getCurrentPhase, buildProbabilityBar, phaseEmoji, phaseLabel } from './cycle';
import { generateDailyTip } from './ai';
import type { AvaUser } from '@/types';

export async function buildTodaySummary(user: AvaUser): Promise<string> {
  const cycleData = await getCycleData(user.id);
  const memoryLogs = await getMemoryContext(user.id, user.plan);

  if (!cycleData?.period_start_dates?.length) {
    return `I need your period dates to show your summary.\n\nSend /start to add them.`;
  }

  const lastStart = new Date(cycleData.period_start_dates[cycleData.period_start_dates.length - 1]);
  const avg = cycleData.avg_cycle_length || 28;
  const { phase, day } = getCurrentPhase(lastStart, avg, cycleData.period_duration || 5);
  const tip = await generateDailyTip(user, phase, memoryLogs);
  const wantsToConceive = user.reproductive_goal === 'conceive';
  const bar = buildProbabilityBar(day, avg, wantsToConceive);

  let nextInfo = '';
  if (cycleData.next_period_start && cycleData.next_period_end) {
    const s = new Date(cycleData.next_period_start).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    const e = new Date(cycleData.next_period_end).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    nextInfo = `📅 Next period: *${s} – ${e}* (${cycleData.confidence_pct}% confidence)`;
  }

  return (
    `Good morning, ${user.name}! 🌸\n\n` +
    `${phaseEmoji[phase]} *${phaseLabel[phase]}* — Day ${day}\n\n` +
    `*Pregnancy probability:*\n${bar}\n\n` +
    `${nextInfo}\n\n` +
    `💡 *Today's tip:* ${tip}\n\n` +
    `Just message me anytime 🌷`
  );
}
