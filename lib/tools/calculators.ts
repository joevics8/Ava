// Pure date maths for the public calculators. Everything runs in the browser;
// nothing the visitor types is sent anywhere or put in a URL.

const DAY = 24 * 60 * 60 * 1000;

/** Parse YYYY-MM-DD as a UTC calendar date. Returns null if invalid. */
export function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
export const iso = (d: Date) => d.toISOString().slice(0, 10);

export interface PeriodForecast { start: Date; windowStart: Date; windowEnd: Date; end: Date }

/** Next N periods. Window is ±2 days around the most likely start. */
export function forecastPeriods(lastStart: Date, cycleLength: number, periodLength: number, count = 3): PeriodForecast[] {
  return Array.from({ length: count }, (_, i) => {
    const start = addDays(lastStart, cycleLength * (i + 1));
    return { start, windowStart: addDays(start, -2), windowEnd: addDays(start, 2), end: addDays(start, periodLength - 1) };
  });
}

export interface OvulationForecast { ovulation: Date; fertileStart: Date; fertileEnd: Date; nextPeriod: Date; testFrom: Date }

/**
 * Ovulation ≈ 14 days before the next period. Fertile window = the 5 days
 * before ovulation plus ovulation day and the day after (sperm survive up to
 * ~5 days). Pregnancy test is reliable from the first day of a missed period.
 */
export function forecastOvulation(lastStart: Date, cycleLength: number): OvulationForecast {
  const nextPeriod = addDays(lastStart, cycleLength);
  const ovulation = addDays(nextPeriod, -14);
  return { ovulation, fertileStart: addDays(ovulation, -5), fertileEnd: addDays(ovulation, 1), nextPeriod, testFrom: nextPeriod };
}

export interface DueDate { dueDate: Date; weeks: number; days: number; trimester: 1 | 2 | 3 | null; secondTrimesterStart: Date; thirdTrimesterStart: Date }

/** Naegele's rule: LMP + 280 days. `today` is injectable for tests. */
export function forecastDueDate(lmp: Date, today: Date = new Date()): DueDate {
  const dueDate = addDays(lmp, 280);
  const since = Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - lmp.getTime()) / DAY);
  const weeks = Math.floor(since / 7);
  const days = since % 7;
  const trimester = since < 0 || since > 294 ? null : since < 13 * 7 ? 1 : since < 27 * 7 ? 2 : 3;
  return { dueDate, weeks, days, trimester, secondTrimesterStart: addDays(lmp, 13 * 7), thirdTrimesterStart: addDays(lmp, 27 * 7) };
}

export const validCycleLength = (n: number) => Number.isInteger(n) && n >= 21 && n <= 45;
export const validPeriodLength = (n: number) => Number.isInteger(n) && n >= 2 && n <= 10;
