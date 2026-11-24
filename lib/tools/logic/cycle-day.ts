// What day of the menstrual cycle is it, and which phase? Pure date maths.
// Day 1 is the first day of period bleeding. Ovulation is estimated 14 days before
// the next period (same rule as the site's ovulation calculator; the real gap varies
// from about 10 to 16 days), so the other phase boundaries are derived from that. These are
// estimates for general understanding, never a diagnosis or a contraception method.
import { addDays, validCycleLength, validPeriodLength } from '../calculators';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type CycleDayError = 'invalid-cycle' | 'invalid-period' | 'before-start' | 'too-far';
export type CycleStatus = 'in-cycle' | 'due' | 'late';

export interface CycleDayInput {
  lastStart: Date;
  /** Usual cycle length in days (21 to 45). */
  cycleLength: number;
  /** Usual number of bleeding days (2 to 10). */
  periodLength: number;
  /** The date to look up (usually today). */
  target: Date;
}

export interface CycleDayOk {
  ok: true;
  cycleDay: number;
  phase: CyclePhase;
  /** First and last cycle day of the current phase (the luteal phase runs on while a period is late). */
  phaseStartDay: number;
  phaseEndDay: number;
  /** 1-based day within the phase. */
  phaseDay: number;
  status: CycleStatus;
  daysLate: number;
  nextPeriod: Date;
  /** Whole days until the next expected period; 0 when it is due or late. */
  daysToNextPeriod: number;
  /** Estimated ovulation, as a cycle day and a date. */
  ovulationDay: number;
  ovulationDate: Date;
  phases: { phase: CyclePhase; startDay: number; endDay: number }[];
  headline: string;
  expect: string[];
}

export type CycleDayResult = CycleDayOk | { ok: false; error: CycleDayError };

/** A cycle day beyond this is almost certainly an old date entered by mistake. */
export const MAX_CYCLE_DAY = 120;
const DAY = 86_400_000;

/** Phase boundaries as cycle-day ranges. Ovulation phase = the day before, the day of and the day after the estimated ovulation day. */
export function phaseBoundaries(cycleLength: number, periodLength: number) {
  const ovulationDay = cycleLength - 13;
  const ovStart = Math.max(ovulationDay - 1, periodLength + 1);
  const ovEnd = Math.max(ovulationDay + 1, ovStart);
  return {
    ovulationDay: Math.max(ovulationDay, periodLength + 1),
    phases: [
      { phase: 'menstrual' as const, startDay: 1, endDay: periodLength },
      { phase: 'follicular' as const, startDay: periodLength + 1, endDay: ovStart - 1 },
      { phase: 'ovulation' as const, startDay: ovStart, endDay: ovEnd },
      { phase: 'luteal' as const, startDay: ovEnd + 1, endDay: cycleLength },
    ].filter(p => p.endDay >= p.startDay),
  };
}

export const PHASE_LABEL: Record<CyclePhase, string> = {
  menstrual: 'Menstrual phase (your period)',
  follicular: 'Follicular phase',
  ovulation: 'Ovulation phase',
  luteal: 'Luteal phase',
};

export const PHASE_EXPECT: Record<CyclePhase, string[]> = {
  menstrual: [
    'Bleeding is the lining of the womb shedding. It is often heaviest in the first 2 days.',
    'Oestrogen and progesterone are at their lowest, so tiredness, cramps, backache and a low mood are common.',
    'Gentle movement, a heat pack, iron-rich food and rest can help. Pain relief such as ibuprofen or paracetamol is fine for most people if you can take it.',
  ],
  follicular: [
    'Your period has finished and oestrogen is slowly rising as an egg follicle grows.',
    'Many people feel their energy and mood lift. Discharge is usually dry or sticky at first, then becomes creamier.',
    'This is the phase that varies most from cycle to cycle, so a late ovulation here is a common reason for a long cycle.',
  ],
  ovulation: [
    'This is your most fertile time. An egg is released about 14 days before the next period, and sperm can survive for up to 5 days before that.',
    'You may notice clear, stretchy, slippery discharge, a higher sex drive, mild one-sided pelvic twinges or a little spotting.',
    'This is an estimate. Stress, illness and travel can move ovulation by days.',
  ],
  luteal: [
    'Progesterone rises after ovulation, then falls if there is no pregnancy. Body temperature stays slightly higher.',
    'In the last week or so, premenstrual symptoms such as bloating, tender breasts, cravings, mood changes and poor sleep are common.',
    'Discharge becomes thicker and drier. Your period usually starts 10 to 16 days after ovulation.',
  ],
};

const wholeDays = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);

export function cycleDayInfo(i: CycleDayInput): CycleDayResult {
  if (!validCycleLength(i.cycleLength)) return { ok: false, error: 'invalid-cycle' };
  if (!validPeriodLength(i.periodLength)) return { ok: false, error: 'invalid-period' };
  const cycleDay = wholeDays(i.lastStart, i.target) + 1;
  if (cycleDay < 1) return { ok: false, error: 'before-start' };
  if (cycleDay > MAX_CYCLE_DAY) return { ok: false, error: 'too-far' };

  const { ovulationDay, phases } = phaseBoundaries(i.cycleLength, i.periodLength);
  const nextPeriod = addDays(i.lastStart, i.cycleLength);
  const daysLate = Math.max(0, cycleDay - i.cycleLength - 1);
  const overdue = cycleDay > i.cycleLength;
  const status: CycleStatus = !overdue ? 'in-cycle' : daysLate === 0 ? 'due' : 'late';

  const current = overdue ? phases[phases.length - 1] : phases.find(p => cycleDay >= p.startDay && cycleDay <= p.endDay)!;
  const daysToNextPeriod = overdue ? 0 : i.cycleLength + 1 - cycleDay;

  let headline: string;
  if (status === 'due') headline = `Day ${cycleDay}: your period is due today.`;
  else if (status === 'late') headline = `Day ${cycleDay}: your period is ${daysLate} ${daysLate === 1 ? 'day' : 'days'} later than usual.`;
  else headline = `You are on cycle day ${cycleDay}, in the ${current.phase} phase.`;

  return {
    ok: true,
    cycleDay,
    phase: current.phase,
    phaseStartDay: current.startDay,
    phaseEndDay: current.endDay,
    phaseDay: cycleDay - current.startDay + 1,
    status, daysLate, nextPeriod, daysToNextPeriod,
    ovulationDay,
    ovulationDate: addDays(i.lastStart, ovulationDay - 1),
    phases, headline,
    expect: PHASE_EXPECT[current.phase],
  };
}
