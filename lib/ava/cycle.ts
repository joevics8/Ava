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

// ─── Cycle status (late-aware) ────────────────────────────────────────────────
// getCurrentPhase() wraps the day count with modulo, which is right for a
// projection but WRONG for someone whose period is late: on day 33 of a
// 30-day cycle it reports "day 3, menstrual phase", telling a person who
// hasn't bled that she's on her period. getCycleStatus() never wraps while a
// period is plausibly just late, and says so explicitly.

export interface CycleStatus {
  /** Real days since last period start (1 = first day of bleeding). Wrapped only when `stale`. */
  day: number;
  phase: CyclePhase;
  /** Days relative to the most likely date (lastStart + avg): negative = days to go, positive = days past. */
  daysPastExpected: number;
  /** Past the end of the expected window (most likely date + 2 days). */
  isLate: boolean;
  /** So far past expected (14+ days) that missing data is likelier than a late period — ask, don't assume. */
  stale: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from a to b, ignoring time of day (both treated as UTC calendar dates). */
export function wholeDaysBetween(a: Date, b: Date): number {
  const au = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bu = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((bu - au) / DAY_MS);
}

export function getCycleStatus(
  lastPeriodStart: Date,
  avgCycleLength: number,
  periodDuration: number = 5,
  now: Date = new Date()
): CycleStatus {
  // The app's day math runs on UTC calendar dates shifted +1h (West Africa),
  // matching getGreeting() elsewhere, so the day flips at local midnight.
  const local = new Date(now.getTime() + 60 * 60 * 1000);
  const rawDay = wholeDaysBetween(lastPeriodStart, local) + 1;
  const daysPastExpected = rawDay - (avgCycleLength + 1);
  const isLate = daysPastExpected > 2;
  const stale = daysPastExpected > 14;

  const day = stale ? ((rawDay - 1) % avgCycleLength) + 1 : Math.max(1, rawDay);

  let phase: CyclePhase;
  if (!stale && rawDay > avgCycleLength) {
    // Period hasn't arrived yet — still the luteal stretch (or ovulation was delayed).
    phase = 'luteal';
  } else if (day <= periodDuration) {
    phase = 'menstrual';
  } else if (day <= 13) {
    phase = 'follicular';
  } else if (day <= 16) {
    phase = 'ovulation';
  } else {
    phase = 'luteal';
  }

  return { day, phase, daysPastExpected, isLate, stale };
}

// ─── Learning the user's real cycle length ────────────────────────────────────
// avg_cycle_length used to be whatever she typed at onboarding, forever, even
// after several real period dates showed otherwise. Learn it from observed
// gaps. Gaps outside 21–45 days are almost always a missed log or a one-off
// (illness, stress, a forgotten entry), so they don't count toward the average.

export function learnCycleLength(
  startDates: string[],
  fallback: number
): { avg: number; samples: number; variability: number } {
  const sorted = Array.from(new Set(startDates)).sort();
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const g = wholeDaysBetween(new Date(sorted[i - 1]), new Date(sorted[i]));
    if (g >= 21 && g <= 45) gaps.push(g);
  }
  const recent = gaps.slice(-6);
  if (recent.length < 2) {
    return { avg: fallback, samples: recent.length, variability: 0 };
  }
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length;
  return { avg: Math.round(mean), samples: recent.length, variability: Math.sqrt(variance) };
}

export function predictionConfidence(samples: number, variability: number): number {
  const base = samples >= 3 ? 85 : samples === 2 ? 78 : samples === 1 ? 70 : 60;
  return Math.max(40, base - (variability > 3 ? 10 : 0));
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
