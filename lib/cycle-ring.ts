// Pure helpers behind the cycle ring graphic (home hero, logo, dashboard).
// Illustrative, not diagnostic: it uses the same rule as the calculators —
// ovulation lands about 14 days before the next period.

export type PhaseKey = 'period' | 'follicular' | 'ovulation' | 'luteal';

export interface PhaseSpan {
  key: PhaseKey;
  /** 1-based first day of the phase. */
  start: number;
  /** 1-based last day of the phase (inclusive). */
  end: number;
  days: number;
}

export const PHASE_LABEL: Record<PhaseKey, string> = {
  period: 'Period',
  follicular: 'Follicular phase',
  ovulation: 'Ovulation window',
  luteal: 'Luteal phase',
};

/**
 * Split a cycle into its four phases. For a 28-day cycle with a 5-day period:
 * period 1–5, follicular 6–12, ovulation 13–15, luteal 16–28.
 * Defensive about odd inputs: spans never overlap and always cover 1..cycleLength.
 */
export function cyclePhases(cycleLength = 28, periodLength = 5): PhaseSpan[] {
  const total = Math.max(15, Math.round(cycleLength) || 28);
  const pEnd = Math.min(Math.max(1, Math.round(periodLength) || 5), total - 3);
  const ovulationDay = total - 14;
  const oStart = Math.max(pEnd + 1, ovulationDay - 1);
  const oEnd = Math.min(total - 1, Math.max(oStart, ovulationDay + 1));

  const raw: [PhaseKey, number, number][] = [
    ['period', 1, pEnd],
    ['follicular', pEnd + 1, oStart - 1],
    ['ovulation', oStart, oEnd],
    ['luteal', oEnd + 1, total],
  ];
  return raw
    .filter(([, s, e]) => e >= s)
    .map(([key, start, end]) => ({ key, start, end, days: end - start + 1 }));
}

export function phaseOfDay(day: number, spans: PhaseSpan[]): PhaseKey | null {
  return spans.find(s => day >= s.start && day <= s.end)?.key ?? null;
}

/**
 * Cycle day (1 = first day of the last period) from a YYYY-MM-DD date.
 * Returns null for a missing/invalid date or one in the future.
 * Uses the viewer's local calendar date for "today".
 */
export function cycleDayFrom(lastPeriod: string | null | undefined, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(lastPeriod ?? '');
  if (!m) return null;
  const start = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (Number.isNaN(start)) return null;
  const diff = Math.round((now - start) / 86_400_000);
  return diff < 0 ? null : diff + 1;
}
