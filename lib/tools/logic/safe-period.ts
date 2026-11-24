// Calendar (rhythm) method: working out likely fertile days from past cycle
// lengths. This is NOT reliable contraception. The Ogino-Knaus rule: the first
// fertile day is the shortest cycle minus 18 and the last is the longest cycle
// minus 11. The Standard Days Method (CDC) uses days 8 to 19 for cycles of 26 to
// 32 days; we never show a window narrower than that for such cycles.
import { addDays, validCycleLength } from '../calculators';
const startOfUtcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export const MIN_CYCLES = 3;
export const RECOMMENDED_CYCLES = 6;
export const MAX_CYCLES = 12;
/** If cycles differ by more than this many days, they count as irregular. */
export const IRREGULAR_RANGE_DAYS = 7;
export const SDM_MIN = 26;
export const SDM_MAX = 32;

/** Typical-use pregnancies per 100 women in the first year, from published sources. */
export const FAILURE_FIGURES = {
  /** NHS: fertility awareness not followed exactly. */
  nhsFertilityAwareness: 24,
  /** CDC: Standard Days Method, typical use. */
  cdcStandardDays: 13,
  /** National Survey of Family Growth, mostly calendar rhythm users (BMJ 2019 review). */
  calendarRhythmSurvey: 15,
} as const;

export type Suitability = 'not-suitable' | 'caution' | 'possible';

export interface SafePeriodInput {
  cycleLengths: number[];
  lastPeriodStart: Date;
}

export interface FertileWindow {
  /** 0 = the cycle that began on the last period date. */
  cycleIndex: number;
  /** Earliest and latest day this cycle could start (the same day for cycle 0). */
  startEarliest: Date;
  startLatest: Date;
  fertileFrom: Date;
  fertileTo: Date;
}

export interface SafePeriodResult {
  count: number;
  shortest: number;
  longest: number;
  range: number;
  average: number;
  irregular: boolean;
  outsideStandardRange: number;
  suitability: Suitability;
  limitedHistory: boolean;
  /** Cycle days (day 1 = first day of period). */
  firstFertileDay: number;
  lastFertileDay: number;
  windows: FertileWindow[];
  warnings: string[];
}

/** Parse "28, 30 27 31" style text into numbers. Returns an error string or the numbers. */
export function parseCycleLengths(text: string): { ok: true; values: number[] } | { ok: false; error: string } {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 0) return { ok: false, error: 'Enter the length of your last few cycles in days, for example 28, 30, 27.' };
  const values: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,2}$/.test(p)) return { ok: false, error: `"${p}" is not a cycle length. Use whole numbers of days, separated by commas.` };
    values.push(Number(p));
  }
  return { ok: true, values };
}

export function validateSafePeriodInput(i: SafePeriodInput, today: Date = new Date()): string | null {
  if (i.cycleLengths.length < MIN_CYCLES) return `Enter at least ${MIN_CYCLES} cycle lengths (6 or more gives a better answer).`;
  if (i.cycleLengths.length > MAX_CYCLES) return `Enter your last ${MAX_CYCLES} cycles at most.`;
  if (i.cycleLengths.some(n => !validCycleLength(n))) return 'Each cycle should be a whole number from 21 to 45 days. If your cycles fall outside this, the calendar method will not work for you: see a clinician.';
  const ago = Math.round((startOfUtcDay(today).getTime() - i.lastPeriodStart.getTime()) / 86400000);
  if (ago < 0) return 'The first day of your last period cannot be in the future.';
  if (ago > 120) return 'That period was more than 4 months ago. Enter the first day of your most recent period.';
  return null;
}

export function analyseSafePeriod(i: SafePeriodInput, today: Date = new Date()): SafePeriodResult {
  const lens = i.cycleLengths;
  const shortest = Math.min(...lens);
  const longest = Math.max(...lens);
  const range = longest - shortest;
  const average = Math.round(lens.reduce((a, b) => a + b, 0) / lens.length);
  const outside = lens.filter(n => n < SDM_MIN || n > SDM_MAX).length;
  const irregular = range > IRREGULAR_RANGE_DAYS;
  const limitedHistory = lens.length < RECOMMENDED_CYCLES;

  let first = shortest - 18;
  let last = longest - 11;
  if (outside === 0) { first = Math.min(first, 8); last = Math.max(last, 19); }
  first = Math.max(first, 1);

  const suitability: Suitability = irregular || outside >= 2 ? 'not-suitable' : outside === 1 || limitedHistory ? 'caution' : 'possible';

  const warnings: string[] = [];
  if (irregular) warnings.push(`Your cycles vary by ${range} days. With cycles this irregular the fertile days cannot be predicted reliably, so the days shown could be wrong.`);
  if (outside >= 2) warnings.push('Two or more of your cycles were shorter than 26 or longer than 32 days. The CDC says the Standard Days Method may not be appropriate in that case.');
  else if (outside === 1) warnings.push('One of your cycles was shorter than 26 or longer than 32 days, so the risk of pregnancy is higher.');
  if (limitedHistory) warnings.push(`Only ${lens.length} cycles were entered. The method needs at least 6, ideally 12, to be a fair guide.`);
  if (shortest <= 25) warnings.push('Short cycles can mean ovulation soon after your period, so sex at the end of your period can lead to pregnancy.');

  const lastStart = startOfUtcDay(i.lastPeriodStart);
  const t = startOfUtcDay(today);
  const windows: FertileWindow[] = [];
  for (let k = 0; k < 6 && windows.length < 3; k++) {
    const early = addDays(lastStart, k === 0 ? 0 : shortest * k);
    const late = addDays(lastStart, k === 0 ? 0 : longest * k);
    const from = addDays(early, first - 1);
    const to = addDays(late, last - 1);
    if (to.getTime() < t.getTime()) continue;
    windows.push({ cycleIndex: k, startEarliest: early, startLatest: late, fertileFrom: from, fertileTo: to });
  }

  return {
    count: lens.length, shortest, longest, range, average, irregular, outsideStandardRange: outside,
    suitability, limitedHistory, firstFertileDay: first, lastFertileDay: last, windows, warnings,
  };
}
