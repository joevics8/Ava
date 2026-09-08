import { getCycleData, getMemoryContext } from './db';
import { getCurrentPhase, phaseEmoji, predictNextPeriod, predictOvulationWindow } from './cycle';
import { upsertCycleData } from './db';
import { getDayData, getConfidenceLevel, personaliseSymptomLine } from './cycle-lookup';
import type { AvaUser } from '@/types';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function getGreeting(): string {
  const hour = new Date().getUTCHours() + 1;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export async function buildTodaySummary(user: AvaUser): Promise<string> {
  let cycleData = await getCycleData(user.id);
  const memoryLogs = await getMemoryContext(user.id, user.plan);

  if (!cycleData?.period_start_dates?.length) {
    return `I need your period dates to show your summary.\n\nJust tell me when your last period started and I'll set everything up 🌸`;
  }

  const avg = Number(cycleData.avg_cycle_length) || 28;
  const duration = cycleData.period_duration || 5;
  const sortedDates = [...cycleData.period_start_dates].sort();
  const lastStart = new Date(sortedDates[sortedDates.length - 1]);
  const today = new Date();

  // Recalculate if next period prediction is stale
  const nextPeriodStored = cycleData.next_period_start ? new Date(cycleData.next_period_start) : null;
  if (!nextPeriodStored || nextPeriodStored < today) {
    let candidateStart = new Date(lastStart);
    while (candidateStart <= today) {
      candidateStart = new Date(candidateStart);
      candidateStart.setDate(candidateStart.getDate() + avg);
    }
    const { start: ns, end: ne } = predictNextPeriod(
      new Date(candidateStart.getTime() - avg * 24 * 60 * 60 * 1000), avg
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

  // ── Research-based lookup ─────────────────────────────────────────────────
  const dayData = getDayData(day, avg, duration);

  // ── Personalise symptom line ──────────────────────────────────────────────
  const symptomLine = personaliseSymptomLine(
    dayData.phase,
    dayData.symptomsGeneric,
    memoryLogs,
    day
  );

  // ── Confidence ────────────────────────────────────────────────────────────
  const numCycles = cycleData?.period_start_dates?.length || 1;
  const recentText = memoryLogs.slice(0, 30).map(l => l.summary).join(' ').toLowerCase();
  const hasLH = recentText.includes('lh') || recentText.includes('ovulation test');
  const hasBBT = recentText.includes('bbt') || recentText.includes('temperature');
  const hasMucus = recentText.includes('mucus') || recentText.includes('discharge');
  const { label: confidence } = getConfidenceLevel(numCycles, hasLH, hasBBT, hasMucus);

  // ── Period and ovulation dates ────────────────────────────────────────────
  const nextStart = cycleData?.next_period_start ? new Date(cycleData.next_period_start) : null;
  const nextEnd = cycleData?.next_period_end ? new Date(cycleData.next_period_end) : null;
  const ovStart = cycleData?.next_ovulation_start ? new Date(cycleData.next_ovulation_start) : null;
  const ovEnd = cycleData?.next_ovulation_end ? new Date(cycleData.next_ovulation_end) : null;

  const daysUntilPeriod = nextStart
    ? Math.ceil((nextStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let periodLine = '';
  if (nextStart && nextEnd) {
    periodLine = daysUntilPeriod !== null && daysUntilPeriod <= 5
      ? `📅 Period in ~${daysUntilPeriod} days (${formatDate(nextStart)} – ${formatDate(nextEnd)})`
      : `📅 Next period: ${formatDate(nextStart)} – ${formatDate(nextEnd)} (${cycleData?.confidence_pct || 70}% confidence)`;
  }

  let ovLine = '';
  if (ovStart && ovEnd) {
    const ovIsNow = today >= ovStart && today <= ovEnd;
    ovLine = ovIsNow
      ? `✨ You are in your *ovulation window* right now`
      : `✨ Ovulation window: ${formatDate(ovStart)} – ${formatDate(ovEnd)}`;
  }

  return (
    `${getGreeting()}, ${user.name}! 🌸\n\n` +
    `${phaseEmoji[phase]} *${dayData.phaseLabel}* — Day ${day} of ${avg}\n` +
    `Prediction confidence: ${confidence}\n\n` +
    `${dayData.fertilityEmoji} *Fertility: ${dayData.fertilityLabel}*\n\n` +
    `${periodLine}\n` +
    `${ovLine}\n\n` +
    `🌡️ *Today:* ${symptomLine}\n\n` +
    `💡 ${dayData.tipGeneric}`
  );
}
