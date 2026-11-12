import { addDays } from '@/lib/tools/calculators';
import { calendarAge, diffDays } from './pregnancy-dates';

// Corrected (adjusted) age: a baby born early is measured from the day they were
// due, not the day they were born. Usually used until about 2 years old.

export type PretermCategory = 'extremely preterm' | 'very preterm' | 'moderately preterm' | 'late preterm' | 'early term' | 'full term' | 'late term' | 'post term';

/** WHO-style groups from completed weeks of gestation. */
export function categoryFor(gaWeeks: number): PretermCategory {
  if (gaWeeks < 28) return 'extremely preterm';
  if (gaWeeks < 32) return 'very preterm';
  if (gaWeeks < 34) return 'moderately preterm';
  if (gaWeeks < 37) return 'late preterm';
  if (gaWeeks < 39) return 'early term';
  if (gaWeeks < 41) return 'full term';
  if (gaWeeks < 42) return 'late term';
  return 'post term';
}

export interface CorrectedAgeResult {
  category: PretermCategory;
  preterm: boolean;
  /** Days born before 40 weeks (0 when not preterm). */
  earlyDays: number;
  earlyWeeks: number;
  earlyExtraDays: number;
  dueDate: Date;
  chronological: { months: number; weeks: number; days: number; totalDays: number };
  corrected: { months: number; weeks: number; days: number; totalDays: number } | null;
  /** True while the baby has not yet reached their due date. */
  beforeDueDate: boolean;
  daysToDueDate: number;
  /** Chronological age is past ~2 years, when correction is normally dropped. */
  pastTwoYears: boolean;
}

export const MAX_AGE_YEARS = 6;

/** Returns null for impossible input. `today` is injectable for tests. */
export function correctedAge(dob: Date, gaWeeks: number, gaDays: number, today: Date): CorrectedAgeResult | null {
  if (!Number.isInteger(gaWeeks) || !Number.isInteger(gaDays) || gaWeeks < 22 || gaWeeks > 42 || gaDays < 0 || gaDays > 6) return null;
  const age = diffDays(dob, today);
  if (age < 0 || age > MAX_AGE_YEARS * 366) return null;

  const gaTotal = gaWeeks * 7 + gaDays;
  const preterm = gaWeeks < 37;
  const earlyDays = preterm ? 280 - gaTotal : 0;
  const dueDate = addDays(dob, earlyDays);
  const beforeDueDate = preterm && today.getTime() < dueDate.getTime();
  return {
    category: categoryFor(gaWeeks),
    preterm,
    earlyDays,
    earlyWeeks: Math.floor(earlyDays / 7),
    earlyExtraDays: earlyDays % 7,
    dueDate,
    chronological: calendarAge(dob, today),
    corrected: beforeDueDate ? null : calendarAge(preterm ? dueDate : dob, today),
    beforeDueDate,
    daysToDueDate: beforeDueDate ? diffDays(today, dueDate) : 0,
    pastTwoYears: calendarAge(dob, today).months >= 24,
  };
}
