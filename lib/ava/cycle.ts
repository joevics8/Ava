import type { CyclePhase } from '@/types';

// ─── Cycle Calculations ───────────────────────────────────────────────────────

export function calcAverageCycleLength(startDates: Date[]): number {
  if (startDates.length < 2) return 28; // default
  const sorted = [...startDates].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(diff);
  }
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function predictNextPeriod(
  lastStart: Date,
  avgCycleLength: number,
  variation: number = 2
): { start: Date; end: Date; confidence: number } {
  const start = new Date(lastStart);
  start.setDate(start.getDate() + avgCycleLength - variation);

  const end = new Date(lastStart);
  end.setDate(end.getDate() + avgCycleLength + variation);

  // More dates = higher confidence
  const confidence = avgCycleLength === 28 ? 60 : 75;

  return { start, end, confidence };
}

export function predictOvulationWindow(
  nextPeriodStart: Date,
  avgCycleLength: number
): { start: Date; end: Date } {
  // Ovulation typically 14 days before next period
  const ovulationDay = new Date(nextPeriodStart);
  ovulationDay.setDate(ovulationDay.getDate() - 14);

  const start = new Date(ovulationDay);
  start.setDate(start.getDate() - 2); // fertile window starts 2 days before

  const end = new Date(ovulationDay);
  end.setDate(end.getDate() + 1); // and ends 1 day after

  return { start, end };
}

export function getCurrentPhase(
  lastPeriodStart: Date,
  avgCycleLength: number,
  periodDuration: number = 5
): { phase: CyclePhase; day: number; daysLeft: number } {
  const today = new Date();
  const dayOfCycle = Math.floor(
    (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const normalizedDay = ((dayOfCycle - 1) % avgCycleLength) + 1;

  let phase: CyclePhase;
  if (normalizedDay <= periodDuration) {
    phase = 'menstrual';
  } else if (normalizedDay <= 13) {
    phase = 'follicular';
  } else if (normalizedDay <= 16) {
    phase = 'ovulation';
  } else {
    phase = 'luteal';
  }

  const daysLeft = avgCycleLength - normalizedDay + 1;
  return { phase, day: normalizedDay, daysLeft };
}

export const phaseEmoji: Record<CyclePhase, string> = {
  menstrual: '🔴',
  follicular: '🌱',
  ovulation: '✨',
  luteal: '🌙',
};

export const phaseLabel: Record<CyclePhase, string> = {
  menstrual: 'Menstrual Phase',
  follicular: 'Follicular Phase',
  ovulation: 'Ovulation Window',
  luteal: 'Luteal Phase',
};

// ─── Pregnancy Probability Bar ────────────────────────────────────────────────

export function buildProbabilityBar(
  dayOfCycle: number,
  avgCycleLength: number,
  wantsToConceive: boolean
): string {
  const ovulationDay = avgCycleLength - 14;
  const days = Math.min(avgCycleLength, 30);

  const bars = Array.from({ length: days }, (_, i) => {
    const d = i + 1;
    const dist = Math.abs(d - ovulationDay);
    let prob: number;

    if (dist === 0) prob = 98;
    else if (dist === 1) prob = 80;
    else if (dist === 2) prob = 50;
    else if (dist === 3) prob = 20;
    else prob = 2;

    let emoji: string;
    if (d === dayOfCycle) {
      emoji = '📍'; // today marker
    } else if (prob >= 80) {
      emoji = wantsToConceive ? '🟢' : '🔴';
    } else if (prob >= 40) {
      emoji = wantsToConceive ? '🟡' : '🟠';
    } else {
      emoji = '⚪';
    }

    return emoji;
  });

  // Show in rows of 10
  const rows: string[] = [];
  for (let i = 0; i < bars.length; i += 10) {
    const chunk = bars.slice(i, i + 10);
    const dayLabels = `Day ${i + 1}–${Math.min(i + 10, days)}`;
    rows.push(`${dayLabels}\n${chunk.join('')}`);
  }

  return rows.join('\n\n');
}
