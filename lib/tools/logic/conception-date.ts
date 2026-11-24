// Estimating a likely conception date (really: the likely day of ovulation and
// fertilisation) from a due date, a last menstrual period (LMP) or an ultrasound
// dating. Conception is always an estimate: ovulation does not reliably fall on
// day 14, and sperm can survive up to 5 days, so the sex that led to a pregnancy
// can be several days before the estimated conception date.
import { addDays, forecastOvulation, validCycleLength } from '../calculators';

export type DatingMethod = 'due-date' | 'lmp' | 'ultrasound';

/** Pregnancy lasts about 280 days from the LMP, or 266 days from conception. */
export const DAYS_FROM_LMP = 280;
export const DAYS_FROM_CONCEPTION = 266;
/** A due date counted from LMP assumes ovulation 14 days after the LMP (28-day cycle). */
export const LMP_TO_CONCEPTION = 14;
const DAY = 24 * 60 * 60 * 1000;

export interface ConceptionInput {
  method: DatingMethod;
  /** due-date: the due date. lmp: first day of last period. ultrasound: the scan date. */
  date: Date;
  /** lmp only: usual cycle length in days (21 to 45). Defaults to 28. */
  cycleLength?: number;
  /** ultrasound only: gestational age at the scan. */
  weeks?: number;
  days?: number;
}

export interface ConceptionEstimate {
  method: DatingMethod;
  /** Best single estimate of ovulation / conception. */
  conception: Date;
  /** Realistic range around the estimate. */
  likelyStart: Date;
  likelyEnd: Date;
  marginDays: number;
  /** Sex on these days could have led to this pregnancy (5 days before to 1 day after the estimate). */
  sexWindowStart: Date;
  sexWindowEnd: Date;
  /** First day of the (assumed) last period, as counted by the dating. */
  lmp: Date;
  dueDate: Date;
  /** Implantation usually happens 6 to 12 days after ovulation. */
  implantationStart: Date;
  implantationEnd: Date;
  cycleLength: number | null;
  notes: string[];
}

export const startOfUtcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);

/** Typical +/- margin (days) for an ultrasound dating, wider as the pregnancy goes on (after ACOG Committee Opinion 700 redating thresholds). */
export function ultrasoundMargin(gaDays: number): number {
  if (gaDays <= 8 * 7 + 6) return 5;
  if (gaDays <= 15 * 7 + 6) return 7;
  if (gaDays <= 21 * 7 + 6) return 10;
  if (gaDays <= 27 * 7 + 6) return 14;
  return 21;
}

/** Returns a friendly error message, or null when the input is usable. */
export function validateConceptionInput(i: ConceptionInput, today: Date = new Date()): string | null {
  const t = startOfUtcDay(today);
  if (i.method === 'due-date') {
    const since = daysBetween(t, i.date);
    if (since < -14) return 'That due date is more than two weeks ago. Please check the date.';
    if (since > DAYS_FROM_CONCEPTION + 7) return 'That due date is too far ahead for a pregnancy. Please check the date.';
    return null;
  }
  if (i.method === 'lmp') {
    const ago = daysBetween(i.date, t);
    if (ago < 0) return 'The first day of your last period cannot be in the future.';
    if (ago > DAYS_FROM_LMP + 14) return 'That date is more than 42 weeks ago. Please check the date.';
    if (i.cycleLength !== undefined && !validCycleLength(i.cycleLength)) return 'Cycle length should be a whole number from 21 to 45 days.';
    return null;
  }
  // ultrasound
  const w = i.weeks, d = i.days;
  if (w === undefined || d === undefined || !Number.isInteger(w) || !Number.isInteger(d)) return 'Enter the weeks and days from your scan report as whole numbers.';
  if (w < 4 || w > 41) return 'Weeks at the scan should be between 4 and 41.';
  if (d < 0 || d > 6) return 'Days should be between 0 and 6.';
  if (daysBetween(i.date, t) < 0) return 'The scan date cannot be in the future.';
  const gaNow = w * 7 + d + daysBetween(i.date, t);
  if (gaNow > DAYS_FROM_LMP + 14) return 'These dates add up to more than 42 weeks of pregnancy. Please check them.';
  return null;
}

export function estimateConception(i: ConceptionInput): ConceptionEstimate {
  const notes: string[] = [];
  let conception: Date;
  let lmp: Date;
  let margin: number;
  let cycleLength: number | null = null;

  if (i.method === 'due-date') {
    conception = addDays(i.date, -DAYS_FROM_CONCEPTION);
    lmp = addDays(i.date, -DAYS_FROM_LMP);
    margin = 7;
    notes.push('A due date counted back 266 days gives the most likely conception day. If your due date came from an early scan, that scan\'s own margin of a few days applies.');
    notes.push('If you had IVF or another fertility treatment, use the date of egg retrieval or embryo transfer with your clinic\'s dating instead: it is much more exact than this estimate.');
  } else if (i.method === 'lmp') {
    cycleLength = i.cycleLength ?? 28;
    lmp = i.date;
    const f = forecastOvulation(lmp, cycleLength);
    conception = f.ovulation;
    margin = 3;
    notes.push(cycleLength === 28
      ? 'This assumes ovulation on day 14 of a 28-day cycle. If your cycles run longer or shorter, enter your usual length.'
      : `Ovulation is placed 14 days before your next expected period, which for a ${cycleLength}-day cycle is cycle day ${cycleLength - 14}.`);
    if (cycleLength < 24 || cycleLength > 35) notes.push('Cycles outside 24 to 35 days make the estimate less certain.');
    notes.push('If your cycles are irregular, widen the range yourself: ovulation can move by a week or more from cycle to cycle.');
  } else {
    const ga = (i.weeks as number) * 7 + (i.days as number);
    lmp = addDays(i.date, -ga);
    conception = addDays(lmp, LMP_TO_CONCEPTION);
    margin = ultrasoundMargin(ga);
    notes.push('Ultrasound dating treats the pregnancy as if you ovulated on day 14, so this is the age of the baby, not proof of the exact day you conceived.');
    if (ga > 13 * 7 + 6) notes.push('Scans after the first trimester date a pregnancy less precisely, so the range is wider.');
  }

  return {
    method: i.method,
    conception,
    likelyStart: addDays(conception, -margin),
    likelyEnd: addDays(conception, margin),
    marginDays: margin,
    sexWindowStart: addDays(conception, -5),
    sexWindowEnd: addDays(conception, 1),
    lmp,
    dueDate: addDays(conception, DAYS_FROM_CONCEPTION),
    implantationStart: addDays(conception, 6),
    implantationEnd: addDays(conception, 12),
    cycleLength,
    notes,
  };
}
