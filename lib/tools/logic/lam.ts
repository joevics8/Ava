// Lactational amenorrhea method (LAM) checker and the earliest date fertility
// can return after birth. LAM is about 98% effective when ALL three criteria are met.
import { addDays } from '../calculators';

export type Feeding = 'exclusive' | 'mostly' | 'no';

export interface LamInput { birthDate: Date; feeding: Feeding; periodReturned: boolean; today: Date }

export interface LamCriterion { id: 'under-6-months' | 'exclusive-feeding' | 'no-period'; label: string; met: boolean }

export interface LamResult {
  valid: boolean;
  ageDays: number;
  ageWeeks: number;
  sixMonthsDate: Date;
  criteria: LamCriterion[];
  lamApplies: boolean;
  /** Day 21 after birth: have contraception in place for sex from here on. */
  contraceptionByDate: Date;
  /** Days from today until contraceptionByDate (negative once it has passed). */
  daysToContraception: number;
}

const DAY = 86_400_000;
const utcMidnight = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/** Calendar months, clamping to the end of a shorter month (31 Aug + 6 months = 28/29 Feb). */
export function addMonths(d: Date, n: number): Date {
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, last)));
}

export const MAX_BABY_MONTHS = 24;

export function checkLam(input: LamInput): LamResult {
  const ageDays = Math.floor((utcMidnight(input.today) - utcMidnight(input.birthDate)) / DAY);
  const sixMonthsDate = addMonths(input.birthDate, 6);
  const valid = ageDays >= 0 && utcMidnight(input.today) <= utcMidnight(addMonths(input.birthDate, MAX_BABY_MONTHS));
  const under6 = ageDays >= 0 && utcMidnight(input.today) < utcMidnight(sixMonthsDate);
  const criteria: LamCriterion[] = [
    { id: 'under-6-months', label: 'Your baby is under 6 months old', met: under6 },
    { id: 'exclusive-feeding', label: 'You are feeding only breast milk, day and night, with no long gaps and no regular formula or food', met: input.feeding === 'exclusive' },
    { id: 'no-period', label: 'Your periods have not returned (bleeding in the first 8 weeks after birth does not count)', met: !input.periodReturned },
  ];
  const contraceptionByDate = addDays(input.birthDate, 21);
  return {
    valid, ageDays, ageWeeks: Math.floor(ageDays / 7), sixMonthsDate, criteria,
    lamApplies: valid && criteria.every(c => c.met),
    contraceptionByDate,
    daysToContraception: Math.floor((utcMidnight(contraceptionByDate) - utcMidnight(input.today)) / DAY),
  };
}

export const BREASTFEEDING_COMPATIBLE = [
  'Condoms',
  'Progestogen-only pill',
  'Contraceptive implant',
  'Contraceptive injection',
  'Copper IUD or hormonal IUS (coil)',
];
