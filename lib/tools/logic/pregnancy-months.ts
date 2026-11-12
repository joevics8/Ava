import { AVG_MONTH_DAYS, diffDays } from './pregnancy-dates';

// Converts weeks of pregnancy to months. Pregnancy is counted in weeks from the
// first day of the last period (a full term is 40 weeks = 280 days). A calendar
// month averages 30.4375 days, so 40 weeks is about 9 months and 1 week.

export interface MonthsResult {
  totalDays: number;
  weeks: number;
  days: number;
  /** Whole months completed (capped at 9 for display). */
  completedMonths: number;
  /** Whole weeks beyond the completed months. */
  extraWeeks: number;
  exactMonths: number;
  /** The month you are in, 1-9. */
  currentMonth: number;
  trimester: 1 | 2 | 3;
  weeksLeft: number;
  daysLeft: number;
  /** 40 weeks or more. */
  pastDue: boolean;
  /** 42 weeks or more. */
  veryLate: boolean;
}

export const MAX_DAYS = 42 * 7 + 6;

function build(totalDays: number): MonthsResult {
  const exactMonths = totalDays / AVG_MONTH_DAYS;
  const completedRaw = Math.floor(exactMonths);
  const completedMonths = Math.min(completedRaw, 9);
  const remDays = totalDays - completedRaw * AVG_MONTH_DAYS;
  const left = Math.max(0, 280 - totalDays);
  return {
    totalDays,
    weeks: Math.floor(totalDays / 7),
    days: totalDays % 7,
    completedMonths,
    extraWeeks: completedRaw >= 9 ? 0 : Math.floor(remDays / 7),
    exactMonths: Math.round(exactMonths * 10) / 10,
    currentMonth: Math.min(completedRaw + 1, 9),
    trimester: totalDays < 13 * 7 ? 1 : totalDays < 27 * 7 ? 2 : 3,
    weeksLeft: Math.floor(left / 7),
    daysLeft: left % 7,
    pastDue: totalDays >= 280,
    veryLate: totalDays >= 294,
  };
}

/** Weeks + days of pregnancy. Returns null for impossible values. */
export function fromWeeksDays(weeks: number, days: number): MonthsResult | null {
  if (!Number.isInteger(weeks) || !Number.isInteger(days)) return null;
  if (weeks < 0 || days < 0 || days > 6) return null;
  const total = weeks * 7 + days;
  return total > MAX_DAYS ? null : build(total);
}

/** From the first day of the last period. Null if it is in the future or too long ago. */
export function fromLmp(lmp: Date, today: Date): MonthsResult | null {
  const d = diffDays(lmp, today);
  return d < 0 || d > MAX_DAYS ? null : build(d);
}
