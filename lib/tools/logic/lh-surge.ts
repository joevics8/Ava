// Ovulation (LH) test guide: when to start testing, when ovulation is expected after a
// positive result, and what common test patterns mean. Conservative, general information.
// Ovulation is estimated 14 days before the next period; a test is more reliable
// than the calendar, and neither is contraception.
import { addDays, forecastOvulation, validCycleLength } from '../calculators';

export type LhPlanError = 'invalid-cycle' | 'invalid-range';

export interface LhPlanInput {
  lastStart: Date | null;
  cycleLength: number;
  /** Optional shortest and longest recent cycles, when cycles vary. */
  shortest?: number | null;
  longest?: number | null;
}

export interface LhPlanOk {
  ok: true;
  /** Cycle days. */
  startDay: number;
  stopDay: number;
  expectedOvulationDay: number;
  /** Best days to try for a pregnancy if you do not have a positive yet: the 2 days before and the day of ovulation. */
  bestFromDay: number;
  bestToDay: number;
  testCount: number;
  longWindow: boolean;
  varied: boolean;
  /** Dates, when the last period start was given. */
  dates: { start: Date; stop: Date; ovulation: Date; bestFrom: Date; bestTo: Date; fertileStart: Date; fertileEnd: Date } | null;
}
export type LhPlan = LhPlanOk | { ok: false; error: LhPlanError };

/** Earliest day to test: never during a typical period. */
export const MIN_START_DAY = 5;
/** Clearblue and similar kits: start testing (cycle length minus 17) days into the cycle, i.e. 4 days before expected ovulation. */
const LEAD_DAYS = 4;
/** Keep testing for 2 days after expected ovulation in case it is late. */
const TAIL_DAYS = 2;

/** Ovulation day = 14 days before the next period (same rule as the site's ovulation calculator). */
export const ovulationDayOf = (cycleLength: number) => cycleLength - 13;

export function planLhTesting(i: LhPlanInput): LhPlan {
  if (!validCycleLength(i.cycleLength)) return { ok: false, error: 'invalid-cycle' };
  const hasShort = i.shortest != null;
  const hasLong = i.longest != null;
  if (hasShort && !validCycleLength(i.shortest as number)) return { ok: false, error: 'invalid-range' };
  if (hasLong && !validCycleLength(i.longest as number)) return { ok: false, error: 'invalid-range' };
  if (hasShort && hasLong && (i.shortest as number) > (i.longest as number)) return { ok: false, error: 'invalid-range' };
  const lo = Math.min(i.shortest ?? i.cycleLength, i.cycleLength);
  const hi = Math.max(i.longest ?? i.cycleLength, i.cycleLength);
  const ov = ovulationDayOf(i.cycleLength);
  const startDay = Math.max(MIN_START_DAY, ovulationDayOf(lo) - LEAD_DAYS);
  const stopDay = Math.max(startDay, ovulationDayOf(hi) + TAIL_DAYS);
  const bestFromDay = Math.max(1, ov - 2);
  const testCount = stopDay - startDay + 1;

  let dates: LhPlanOk['dates'] = null;
  if (i.lastStart) {
    const day = (n: number) => addDays(i.lastStart!, n - 1);
    const f = forecastOvulation(i.lastStart, i.cycleLength);
    dates = { start: day(startDay), stop: day(stopDay), ovulation: f.ovulation, bestFrom: day(bestFromDay), bestTo: day(ov), fertileStart: f.fertileStart, fertileEnd: f.fertileEnd };
  }
  return {
    ok: true, startDay, stopDay, expectedOvulationDay: ov, bestFromDay, bestToDay: ov, testCount,
    longWindow: testCount > 10, varied: hi !== lo, dates,
  };
}

export interface AfterPositive {
  /** Ovulation is most likely the day after the positive test. */
  likely: Date;
  earliest: Date;
  /** Up to about 48 hours after the positive. */
  latest: Date;
  /** The positive day and the next day. */
  bestDays: [Date, Date];
}

/** Ovulation usually follows the start of the LH surge by about 24 to 36 hours (up to ~48 hours). */
export function afterPositive(positive: Date): AfterPositive {
  return { likely: addDays(positive, 1), earliest: positive, latest: addDays(positive, 2), bestDays: [positive, addDays(positive, 1)] };
}

export type LhPattern = 'positive' | 'faint' | 'continued' | 'pcos' | 'none-once' | 'none-repeated';

export interface LhInterpretation {
  headline: string;
  points: string[];
  seeClinician: boolean;
}

export const LH_PATTERNS: { value: LhPattern; label: string }[] = [
  { value: 'positive', label: 'Test line as dark as or darker than the control line' },
  { value: 'faint', label: 'A faint test line, lighter than the control line' },
  { value: 'continued', label: 'Positive or near-positive for several days in a row, or on and off' },
  { value: 'pcos', label: 'I have PCOS or very irregular cycles and my strips are confusing' },
  { value: 'none-once', label: 'No positive this cycle (test line absent or very faint every day)' },
  { value: 'none-repeated', label: 'No positive for 2 or more cycles in a row' },
];

export function interpretLhPattern(p: LhPattern): LhInterpretation {
  switch (p) {
    case 'positive':
      return {
        headline: 'A positive test means your LH surge has started.',
        points: [
          'Ovulation usually follows within about 24 to 36 hours, and sometimes up to 48 hours.',
          'If you are trying for a pregnancy, the day of the positive and the next day are your best days. Sex every day or every other day around then covers you.',
          'Follow your kit leaflet for what counts as positive: usually a test line as dark as or darker than the control line, or a smiley face on a digital test.',
          'Once you have a positive, you do not need to keep testing this cycle.',
        ],
        seeClinician: false,
      };
    case 'faint':
      return {
        headline: 'A faint line is normal: everyone makes some LH.',
        points: [
          'A faint line usually means LH is present but not yet surging. Keep testing, ideally once or twice a day around the same times.',
          'Do not count it as positive unless the line is as dark as or darker than the control line (or your kit says otherwise).',
          'Very diluted urine can make a line look lighter. Avoid drinking a lot in the 2 hours beforehand.',
          'Digital tests and strips can differ, so use one brand through a cycle.',
        ],
        seeClinician: false,
      };
    case 'continued':
      return {
        headline: 'Several positives in a row are common and have more than one cause.',
        points: [
          'LH can stay raised for 2 to 3 days in some healthy cycles, so a run of positives does not always mean a problem.',
          'With polycystic ovary syndrome (PCOS), LH is often higher than average, so strips can look positive or near-positive without ovulation following. The surge is then harder to read.',
          'Some medicines, a recent pregnancy or loss (the pregnancy hormone hCG can trigger some strips), perimenopause and some fertility treatments can also give positive strips.',
          'If this happens every cycle, or your periods are far apart, ask a clinician about checking whether you are ovulating. Tests of progesterone about a week before your period can help.',
        ],
        seeClinician: true,
      };
    case 'pcos':
      return {
        headline: 'Strips can be harder to read with PCOS, so use them as one clue, not the answer.',
        points: [
          'With polycystic ovary syndrome (PCOS), LH is often higher than average all month, so strips may look dark or positive on many days without ovulation following.',
          'A peak that rises and then falls clearly is more useful than one dark strip. Some people find digital tests that read the trend easier.',
          'Other signs of ovulation help: stretchy clear discharge, a sustained rise in waking temperature, or a blood progesterone test about a week before your next period.',
          'If your periods come more than 35 days apart, or you are trying for a pregnancy, ask a clinician about checking whether you are ovulating. Effective treatment exists.',
        ],
        seeClinician: true,
      };
    case 'none-once':
      return {
        headline: 'One cycle without a positive is common.',
        points: [
          'You may have started too late or stopped too early, tested with dilute urine, or ovulated later than the calendar predicted.',
          'Not every cycle includes ovulation. Stress, illness, travel, breastfeeding, weight change and hormones can all delay or skip it.',
          'Next cycle, start a little earlier, test through your longest recent cycle and test around the same time each day.',
          'A period arriving at roughly the usual time is reassuring that ovulation likely happened.',
        ],
        seeClinician: false,
      };
    case 'none-repeated':
      return {
        headline: 'It is worth talking to a clinician.',
        points: [
          'Two or more cycles with no surge can mean you are not ovulating regularly, or that the timing or technique needs adjusting.',
          'Common, treatable causes include PCOS, thyroid problems, high prolactin, stress, low body weight and perimenopause.',
          'Take your cycle dates and test photos. A blood test of progesterone, and other hormone tests, can check ovulation.',
          'If you are under 35 and have been trying for a year (6 months if 35 or over), or you have very irregular or absent periods, do not wait.',
        ],
        seeClinician: true,
      };
  }
}
