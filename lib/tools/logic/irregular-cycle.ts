import { addDays } from '@/lib/tools/calculators';

// Cycle statistics and the standard "calendar method" estimate of the fertile
// window: first fertile day = shortest cycle - 18, last fertile day = longest
// cycle - 11 (day 1 is the first day of the period). A rough guide, not
// contraception.

export const MIN_CYCLES = 3;
export const MAX_CYCLES = 12;
export const MIN_LENGTH = 15;
export const MAX_LENGTH = 90;

/** Parse "28, 31 27 35" (commas, spaces or new lines). */
export function parseCycleLengths(text: string): { values: number[]; error?: string } {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (parts.length < MIN_CYCLES) return { values: [], error: `Enter at least ${MIN_CYCLES} cycle lengths, separated by commas.` };
  if (parts.length > MAX_CYCLES) return { values: [], error: `Enter no more than ${MAX_CYCLES} cycle lengths (your most recent).` };
  const values: number[] = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return { values: [], error: `"${p}" is not a whole number of days.` };
    const n = Number(p);
    if (n < MIN_LENGTH || n > MAX_LENGTH) return { values: [], error: `Each cycle should be between ${MIN_LENGTH} and ${MAX_LENGTH} days. Count from the first day of one period to the first day of the next.` };
    values.push(n);
  }
  return { values };
}

export type Regularity = 'regular' | 'borderline' | 'irregular';

export interface CycleAnalysis {
  count: number;
  average: number;          // 1 decimal
  shortest: number;
  longest: number;
  variation: number;        // longest - shortest
  regularity: Regularity;
  hasShortCycle: boolean;   // any cycle under 21 days
  hasLongCycle: boolean;    // any cycle over 35 days
  nextEarliest: Date;
  nextLikely: Date;
  nextLatest: Date;
  /** Calendar-method fertile window; null when the shortest cycle is too short for the rule to give a sensible start. */
  fertileStart: Date | null;
  fertileEnd: Date | null;
  fertileStartDay: number;
  fertileEndDay: number;
  /** True when the window is wide because cycles vary a lot (over 10 days wide of variation). */
  wideWindow: boolean;
  /** Reasons to mention seeing a clinician. */
  clinicNotes: string[];
}

export function analyseCycles(lengths: number[], lastStart: Date): CycleAnalysis {
  const count = lengths.length;
  const sum = lengths.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / count) * 10) / 10;
  const shortest = Math.min(...lengths);
  const longest = Math.max(...lengths);
  const variation = longest - shortest;
  const regularity: Regularity = variation <= 7 ? 'regular' : variation <= 9 ? 'borderline' : 'irregular';
  const hasShortCycle = shortest < 21;
  const hasLongCycle = longest > 35;

  const fertileStartDay = shortest - 18;
  const fertileEndDay = longest - 11;
  const sensible = fertileStartDay >= 1;

  const clinicNotes: string[] = [];
  if (hasShortCycle) clinicNotes.push('One or more of your cycles was shorter than 21 days.');
  if (hasLongCycle) clinicNotes.push('One or more of your cycles was longer than 35 days.');
  if (regularity === 'irregular') clinicNotes.push('Your cycle length varies by 10 days or more.');

  return {
    count, average, shortest, longest, variation, regularity, hasShortCycle, hasLongCycle,
    nextEarliest: addDays(lastStart, shortest),
    nextLikely: addDays(lastStart, Math.round(average)),
    nextLatest: addDays(lastStart, longest),
    fertileStart: sensible ? addDays(lastStart, fertileStartDay - 1) : null,
    fertileEnd: sensible ? addDays(lastStart, fertileEndDay - 1) : null,
    fertileStartDay, fertileEndDay,
    wideWindow: variation >= 10,
    clinicNotes,
  };
}
