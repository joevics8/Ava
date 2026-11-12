// Small UTC calendar helpers shared by the pregnancy / baby tools.
import { addDays } from '@/lib/tools/calculators';

const DAY = 24 * 60 * 60 * 1000;
export const AVG_MONTH_DAYS = 30.4375;

/** The visitor's own calendar date, as a UTC midnight Date (matches parseDate()). */
export function todayLocal(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

export const diffDays = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / DAY);

/** Add calendar months, clamping to the end of a shorter month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(d: Date, n: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last)));
}

export const addYears = (d: Date, n: number) => addMonths(d, n * 12);

/** Whole calendar months and leftover days from `start` to `end` (end >= start). */
export function calendarAge(start: Date, end: Date): { months: number; weeks: number; days: number; totalDays: number } {
  const totalDays = diffDays(start, end);
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (addMonths(start, months).getTime() > end.getTime()) months -= 1;
  const rem = diffDays(addMonths(start, months), end);
  return { months, weeks: Math.floor(rem / 7), days: rem % 7, totalDays };
}

export { addDays };
