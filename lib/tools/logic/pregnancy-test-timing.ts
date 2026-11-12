import { addDays } from '@/lib/tools/calculators';
import { diffDays } from './pregnancy-dates';

// When can a home pregnancy test be trusted? Pregnancy tests detect the hormone
// hCG, which only starts to rise after the embryo implants in the womb lining.
// Implantation usually happens 6 to 12 days after ovulation (most often 8 to 10).

export type TestMode = 'sex' | 'period';

export interface TestTiming {
  mode: TestMode;
  /** The earliest day a very sensitive test might show a positive. Negative results before this mean nothing. */
  earliest: Date;
  /** The day a negative result can be trusted. */
  reliable: Date;
  /** Retest window if the first test is negative but a period has not arrived. */
  retestFrom: Date;
  retestTo: Date;
  /** Where today falls. */
  today: 'too-early' | 'early' | 'reliable';
  /** The expected period date, when worked out from the cycle. */
  expectedPeriod?: Date;
}

function placeToday(today: Date, earliest: Date, reliable: Date): TestTiming['today'] {
  if (today.getTime() < earliest.getTime()) return 'too-early';
  return today.getTime() < reliable.getTime() ? 'early' : 'reliable';
}

/**
 * From a date of unprotected sex. Sperm can live up to 5 days, so conception can
 * happen the same day or days later. The earliest possible positive is about 10
 * days after sex (conception the same day, implantation about day 6 to 8, then
 * hCG rising). The NHS advises waiting 3 weeks (21 days) after unprotected sex
 * for a reliable result.
 */
export function timingFromSex(sex: Date, today: Date): TestTiming | null {
  if (diffDays(sex, today) < 0) return null;
  const earliest = addDays(sex, 10);
  const reliable = addDays(sex, 21);
  return { mode: 'sex', earliest, reliable, retestFrom: addDays(reliable, 3), retestTo: addDays(reliable, 7), today: placeToday(today, earliest, reliable) };
}

export const MIN_CYCLE = 21;
export const MAX_CYCLE = 60;

/**
 * From the first day of the last period and cycle length. Ovulation is about 14
 * days before the next period. A sensitive test might pick up a pregnancy about 10
 * days after ovulation (about 4 days before the period is due), but most tests are
 * reliable from the first day of a missed period. With irregular cycles, use your
 * LONGEST recent cycle so a period is not wrongly called late.
 */
export function timingFromPeriod(lastPeriod: Date, cycleLength: number, today: Date): TestTiming | null {
  if (!Number.isInteger(cycleLength) || cycleLength < MIN_CYCLE || cycleLength > MAX_CYCLE) return null;
  if (diffDays(lastPeriod, today) < 0) return null;
  const expectedPeriod = addDays(lastPeriod, cycleLength);
  const ovulation = addDays(expectedPeriod, -14);
  const earliest = addDays(ovulation, 10);
  const reliable = expectedPeriod;
  return { mode: 'period', earliest, reliable, retestFrom: addDays(reliable, 3), retestTo: addDays(reliable, 7), today: placeToday(today, earliest, reliable), expectedPeriod };
}
