import { getCycleData, getMemoryContext } from './db';
import { getCurrentPhase, buildProbabilityBar, phaseEmoji, phaseLabel, predictNextPeriod, predictOvulationWindow } from './cycle';
import { upsertCycleData } from './db';
import { generateDailyTip } from './ai';
import type { AvaUser } from '@/types';

function getGreeting(): string {
  const hour = new Date().getUTCHours() + 1; // WAT = UTC+1
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export async function buildTodaySummary(user: AvaUser): Promise<string> {
  let cycleData = await getCycleData(user.id);
  const memoryLogs = await getMemoryContext(user.id, user.plan);

  if (!cycleData?.period_start_dates?.length) {
    return `I need your period dates to show your summary.\n\nJust tell me when your last period started and I'll set everything up 🌸`;
  }

  const avg = Number(cycleData.avg_cycle_length) || 28;
  const duration = cycleData.period_duration || 5;

  // Find the most recent period start date
  const sortedDates = [...cycleData.period_start_dates].sort();
  const lastStart = new Date(sortedDates[sortedDates.length - 1]);

  // Recalculate if next period prediction is stale (in the past)
  const today = new Date();
  const nextPeriodStored = cycleData.next_period_start ? new Date(cycleData.next_period_start) : null;

  if (!nextPeriodStored || nextPeriodStored < today) {
    // Roll forward cycle until next period is in the future
    let candidateStart = new Date(lastStart);
    while (candidateStart <= today) {
      candidateStart = new Date(candidateStart);
      candidateStart.setDate(candidateStart.getDate() + avg);
    }
    const { start: ns, end: ne } = predictNextPeriod(
      new Date(candidateStart.getTime() - avg * 24 * 60 * 60 * 1000),
      avg
    );
    const { start: os, end: oe } = predictOvulationWindow(ns, avg);
    await upsertCycleData(user.id, {
      next_period_start: ns.toISOString().split('T')[0],
      next_period_end: ne.toISOString().split('T')[0],
      next_ovulation_start: os.toISOString().split('T')[0],
      next_ovulation_end: oe.toISOString().split('T')[0],
    });
    cycleData = await getCycleData(user.id);
  }

  const { phase, day } = getCurrentPhase(lastStart, avg, duration);
  const tip = await generateDailyTip(user, phase, memoryLogs);
  const wantsToConceive = user.reproductive_goal === 'conceive';
  const bar = buildProbabilityBar(day, avg, wantsToConceive);
  const legend = wantsToConceive
    ? '🟢 High · 🟡 Medium · ⚪ Low · 📍 Today'
    : '🔴 High risk · 🟠 Medium · ⚪ Low · 📍 Today';

  const nextStart = cycleData?.next_period_start ? new Date(cycleData.next_period_start) : null;
  const nextEnd = cycleData?.next_period_end ? new Date(cycleData.next_period_end) : null;
  const ovStart = cycleData?.next_ovulation_start ? new Date(cycleData.next_ovulation_start) : null;
  const ovEnd = cycleData?.next_ovulation_end ? new Date(cycleData.next_ovulation_end) : null;

  const daysUntilPeriod = nextStart
    ? Math.ceil((nextStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let periodLine = '';
  if (nextStart && nextEnd) {
    periodLine = daysUntilPeriod && daysUntilPeriod <= 5
      ? `📅 Period arriving in ~${daysUntilPeriod} days (${formatDate(nextStart)} – ${formatDate(nextEnd)})`
      : `📅 Next period: ${formatDate(nextStart)} – ${formatDate(nextEnd)} (${cycleData?.confidence_pct}% confidence)`;
  }

  let ovLine = '';
  if (ovStart && ovEnd) {
    const ovIsNow = today >= ovStart && today <= ovEnd;
    ovLine = ovIsNow
      ? `✨ You're in your *ovulation window* right now (${formatDate(ovStart)} – ${formatDate(ovEnd)})`
      : `✨ Ovulation window: ${formatDate(ovStart)} – ${formatDate(ovEnd)}`;
  }

  return (
    `${getGreeting()}, ${user.name}! 🌸\n\n` +
    `${phaseEmoji[phase]} *${phaseLabel[phase]}* — Day ${day} of ${avg}\n\n` +
    `${periodLine}\n` +
    `${ovLine}\n\n` +
    `*Fertility this cycle:*\n${legend}\n${bar}\n\n` +
    `💡 ${tip || 'Stay hydrated and be gentle with yourself today.'}`
  );
}
