// Baby gender chart (Chinese gender predictor). FOLKLORE, FOR FUN: tested against real births it
// does no better than a coin toss. The simple form of the traditional method: take the mother's
// lunar age at conception and the lunar month of conception, add them, odd = boy, even = girl.
// Lunar dates come from the browser's built-in Chinese calendar (Intl), so no tables are shipped.
import { addDays } from '../calculators';

export interface Lunar { year: number; month: number; day: number; leap: boolean }
export type Guess = 'boy' | 'girl';

let formatter: Intl.DateTimeFormat | null | undefined;
function fmt(): Intl.DateTimeFormat | null {
  if (formatter !== undefined) return formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-u-ca-chinese-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' });
    // Old engines silently fall back to the Gregorian calendar: detect that (Chinese New Year 2026 = 17 Feb).
    const probe = formatter.formatToParts(new Date('2026-02-17T00:00:00Z'));
    const m = probe.find(p => p.type === 'month')?.value;
    const d = probe.find(p => p.type === 'day')?.value;
    if (m !== '1' || d !== '1') formatter = null;
  } catch { formatter = null; }
  return formatter;
}

/** Whether this browser can compute Chinese calendar dates. */
export const lunarSupported = (): boolean => fmt() !== null;

/** Chinese lunar date for a UTC calendar date (null if the browser has no Chinese calendar). */
export function toLunar(d: Date): Lunar | null {
  const f = fmt();
  if (!f) return null;
  const parts = f.formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  const monthRaw = get('month');
  const year = Number(get('relatedYear'));
  const month = parseInt(monthRaw, 10);
  const day = Number(get('day'));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { year, month, day, leap: /bis/i.test(monthRaw) };
}

/** Traditional Chinese (lunar) age: 1 at birth, +1 every Chinese New Year. */
export const lunarAge = (birth: Lunar, at: Lunar): number => at.year - birth.year + 1;

/** The chart's rule: age + lunar month, odd = boy, even = girl. */
export const predict = (age: number, month: number): Guess => ((age + month) % 2 === 0 ? 'girl' : 'boy');

/** Conception is roughly 14 days after the first day of the last period (28-day cycle). */
export const conceptionFromLmp = (lmp: Date): Date => addDays(lmp, 14);

const YEAR_DAYS = 366;

export type DateCheck = 'ok' | 'birth-in-future' | 'too-young' | 'too-old' | 'conception-too-far';
/** Mother's real age at conception must be plausible; conception may be up to ~2 years ahead (planning). */
export function checkDates(birth: Date, conception: Date, today: Date): DateCheck {
  if (birth.getTime() >= today.getTime()) return 'birth-in-future';
  const years = (conception.getTime() - birth.getTime()) / (365.25 * 86_400_000);
  if (years < 12) return 'too-young';
  if (years > 55) return 'too-old';
  if (conception.getTime() - today.getTime() > 2 * YEAR_DAYS * 86_400_000) return 'conception-too-far';
  return 'ok';
}

export interface ChartRow {
  start: Date; end: Date;
  lunarYear: number; month: number; leap: boolean;
  age: number; guess: Guess;
  /** True for the row that contains the chosen conception date. */
  current: boolean;
}

export interface GenderChart {
  lunar: Lunar; birthLunar: Lunar;
  age: number; sum: number; guess: Guess;
  /** Conception falls in a leap month: charts disagree on how to count it. */
  leapNote: boolean;
  /** This lunar month and the next 11, with the guess for each. */
  rows: ChartRow[];
}

export function buildChart(birth: Date, conception: Date): GenderChart | null {
  const birthLunar = toLunar(birth);
  const lunar = toLunar(conception);
  if (!birthLunar || !lunar) return null;
  const age = lunarAge(birthLunar, lunar);
  const rows: ChartRow[] = [];
  let start = addDays(conception, -(lunar.day - 1));
  for (let i = 0; i < 12; i++) {
    const first = toLunar(start);
    if (!first) return null;
    // Lunar months last 29 or 30 days: step to day 29 then forward until the month changes.
    let end = addDays(start, 28);
    for (;;) {
      const next = toLunar(addDays(end, 1));
      if (!next) return null;
      if (next.month !== first.month || next.leap !== first.leap || next.year !== first.year) break;
      end = addDays(end, 1);
    }
    const rowAge = lunarAge(birthLunar, first);
    rows.push({
      start, end, lunarYear: first.year, month: first.month, leap: first.leap, age: rowAge,
      guess: predict(rowAge, first.month), current: i === 0,
    });
    start = addDays(end, 1);
  }
  return { lunar, birthLunar, age, sum: age + lunar.month, guess: predict(age, lunar.month), leapNote: lunar.leap, rows };
}
