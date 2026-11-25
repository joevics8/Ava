// Pregnancy weight gain guide. Uses the 2009 US Institute of Medicine / National
// Academies ranges, which ACOG (Committee Opinion 548, reaffirmed) also uses.
// Conservative by design: these are population guides, not individual targets,
// and no twin guidance is given for an underweight starting BMI (IOM has none).

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export type Fetuses = 'single' | 'twins';
export type GainStatus = 'on-track' | 'slightly-low' | 'slightly-high' | 'low' | 'high';

export const LB_PER_KG = 2.20462;
export const FIRST_TRIMESTER_END_WEEK = 13;
export const FIRST_TRIMESTER_GAIN = { min: 0.5, max: 2 } as const;
/** Gestation at which the twin total is assumed reached (twins commonly arrive at 36 to 38 weeks). */
export const TWIN_TERM_WEEK = 37;
/** Weights wobble by about a kilo day to day, so a 1 kg margin counts as "close". */
export const MARGIN_KG = 1;

interface Range { min: number; max: number }

/** Total gain over a singleton pregnancy and weekly rate from week 13 (IOM 2009, kg). */
export const SINGLETON: Record<BmiCategory, { total: Range; weekly: Range }> = {
  underweight: { total: { min: 12.5, max: 18 }, weekly: { min: 0.44, max: 0.58 } },
  normal: { total: { min: 11.5, max: 16 }, weekly: { min: 0.35, max: 0.5 } },
  overweight: { total: { min: 7, max: 11.5 }, weekly: { min: 0.23, max: 0.33 } },
  obese: { total: { min: 5, max: 9 }, weekly: { min: 0.17, max: 0.27 } },
};

/** Provisional IOM totals for twins (kg). Underweight: no guidance exists. */
export const TWINS: Record<Exclude<BmiCategory, 'underweight'>, Range> = {
  normal: { min: 16.8, max: 24.5 },
  overweight: { min: 14.1, max: 22.7 },
  obese: { min: 11.3, max: 19.1 },
};

export const BMI_LABEL: Record<BmiCategory, string> = {
  underweight: 'Underweight (BMI under 18.5)',
  normal: 'Healthy weight (BMI 18.5 to 24.9)',
  overweight: 'Overweight (BMI 25 to 29.9)',
  obese: 'Obese (BMI 30 or more)',
};

export const lbToKg = (lb: number) => lb / LB_PER_KG;
export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const ftInToCm = (ft: number, inches: number) => (ft * 12 + inches) * 2.54;

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'normal';
  if (value < 30) return 'overweight';
  return 'obese';
}

export interface WeightGainInput {
  heightCm: number;
  /** Weight before pregnancy, kg. */
  startKg: number;
  /** Weight now, kg. */
  currentKg: number;
  /** Completed weeks of pregnancy. */
  week: number;
  fetuses: Fetuses;
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateWeightGainInput(i: WeightGainInput): ValidationResult {
  const finite = [i.heightCm, i.startKg, i.currentKg, i.week].every(Number.isFinite);
  if (!finite) return { ok: false, error: 'Please fill in every box with a number.' };
  if (i.heightCm < 120 || i.heightCm > 220) return { ok: false, error: 'Please check your height. This tool accepts 120 to 220 cm (about 3 ft 11 in to 7 ft 3 in).' };
  if (i.startKg < 30 || i.startKg > 250) return { ok: false, error: 'Please check your pre-pregnancy weight. This tool accepts 30 to 250 kg (66 to 551 lb).' };
  if (i.currentKg < 30 || i.currentKg > 300) return { ok: false, error: 'Please check your current weight. This tool accepts 30 to 300 kg (66 to 661 lb).' };
  if (i.week < 4 || i.week > 42 || !Number.isInteger(i.week)) return { ok: false, error: 'Please enter whole weeks of pregnancy, from 4 to 42.' };
  return { ok: true };
}

/** Expected gain range (kg) at a given week, or null when no guidance exists. */
export function expectedGainAtWeek(category: BmiCategory, fetuses: Fetuses, week: number): Range | null {
  const w = Math.max(0, Math.min(week, 42));
  if (fetuses === 'single') {
    const s = SINGLETON[category];
    if (w <= FIRST_TRIMESTER_END_WEEK) {
      const f = w / FIRST_TRIMESTER_END_WEEK;
      return { min: round1(FIRST_TRIMESTER_GAIN.min * f), max: round1(FIRST_TRIMESTER_GAIN.max * f) };
    }
    const later = Math.min(w, 40) - FIRST_TRIMESTER_END_WEEK;
    return {
      min: round1(FIRST_TRIMESTER_GAIN.min + s.weekly.min * later),
      max: round1(FIRST_TRIMESTER_GAIN.max + s.weekly.max * later),
    };
  }
  if (category === 'underweight') return null;
  const t = TWINS[category];
  if (w <= FIRST_TRIMESTER_END_WEEK) {
    const f = w / FIRST_TRIMESTER_END_WEEK;
    return { min: round1(FIRST_TRIMESTER_GAIN.min * f), max: round1(FIRST_TRIMESTER_GAIN.max * f) };
  }
  const span = TWIN_TERM_WEEK - FIRST_TRIMESTER_END_WEEK;
  const f = Math.min(w - FIRST_TRIMESTER_END_WEEK, span) / span;
  return {
    min: round1(FIRST_TRIMESTER_GAIN.min + (t.min - FIRST_TRIMESTER_GAIN.min) * f),
    max: round1(FIRST_TRIMESTER_GAIN.max + (t.max - FIRST_TRIMESTER_GAIN.max) * f),
  };
}

export function classifyGain(gainKg: number, expected: Range): GainStatus {
  if (gainKg >= expected.min && gainKg <= expected.max) return 'on-track';
  if (gainKg < expected.min) return gainKg >= expected.min - MARGIN_KG ? 'slightly-low' : 'low';
  return gainKg <= expected.max + MARGIN_KG ? 'slightly-high' : 'high';
}

export interface WeightGainResult {
  bmi: number;
  category: BmiCategory;
  fetuses: Fetuses;
  week: number;
  gainKg: number;
  /** Recommended total gain by the end of pregnancy, kg. Null when there is no guidance. */
  total: Range | null;
  /** Weekly rate in the 2nd and 3rd trimesters, kg per week (singleton only). */
  weekly: Range | null;
  /** Gain expected by this week, kg. Null when there is no guidance. */
  expected: Range | null;
  status: GainStatus | null;
  headline: string;
  message: string;
  notes: string[];
  /** True when she should be encouraged to mention it to her midwife or doctor. */
  mentionToClinician: boolean;
}

export function assessWeightGain(i: WeightGainInput): WeightGainResult | { error: string } {
  const v = validateWeightGainInput(i);
  if (!v.ok) return { error: v.error };

  const value = bmi(i.startKg, i.heightCm);
  const category = bmiCategory(value);
  const gainKg = round1(i.currentKg - i.startKg);
  const total = i.fetuses === 'single' ? SINGLETON[category].total : category === 'underweight' ? null : TWINS[category];
  const weekly = i.fetuses === 'single' ? SINGLETON[category].weekly : null;
  const expected = expectedGainAtWeek(category, i.fetuses, i.week);
  const status = expected ? classifyGain(gainKg, expected) : null;

  const notes: string[] = [
    'BMI is a rough screen. It does not account for muscle, body shape or ethnic differences, and the pregnancy ranges use the same cut-offs for everyone.',
    'These are population guides. Your midwife or doctor may set a different goal for you, for example if you have diabetes, high blood pressure, or have had a lot of nausea.',
  ];
  if (value < 18.5 || value >= 40) notes.push('Your BMI is at one end of the range. Ask your midwife or doctor for a plan that suits you.');
  if (i.fetuses === 'twins') notes.push('Twin ranges are provisional. Gain depends on when your babies are expected to arrive, so ask your care team what is right for you.');
  if (i.week < 8) notes.push('Very early in pregnancy, weight changes tell you little. Weight often stays level or dips slightly in the first trimester.');

  let headline: string;
  let message: string;
  let mention = false;

  if (!expected || !status) {
    headline = 'No standard twin range for an underweight start';
    message = 'Guidelines do not give a twin weight gain range when you start pregnancy underweight. Your care team will advise a goal for you.';
    mention = true;
  } else {
    const early = i.week <= FIRST_TRIMESTER_END_WEEK;
    switch (status) {
      case 'on-track':
        headline = 'Your gain looks on track';
        message = 'Your weight gain so far is within the usual range for this stage of pregnancy.';
        break;
      case 'slightly-low':
        headline = 'A little below the usual range';
        message = early
          ? 'Weight is often slow or even dips in the first trimester, especially with nausea. This is usually nothing to worry about. Mention it at your next check.'
          : 'You are slightly under the usual range. Scales vary by about a kilo, so check again in a week or two and mention it at your next antenatal visit.';
        mention = !early;
        break;
      case 'slightly-high':
        headline = 'A little above the usual range';
        message = 'You are slightly over the usual range. This is common and not harmful in itself. Weights vary, so recheck in a week or two and mention it at your next antenatal visit.';
        break;
      case 'low':
        headline = 'Below the usual range';
        message = early
          ? 'Weight loss or slow gain can happen with morning sickness. Tell your midwife or doctor, especially if you cannot keep food or fluids down.'
          : 'Your gain is below the usual range for this stage. Please tell your midwife or doctor, who can check how you and your baby are doing and offer practical help.';
        mention = true;
        break;
      case 'high':
        headline = 'Above the usual range';
        message = 'Your gain is above the usual range for this stage. Please mention it at your next antenatal visit. Do not start a diet while pregnant. Your care team can talk through balanced eating and activity with you.';
        mention = true;
        break;
    }
  }

  if (i.week > FIRST_TRIMESTER_END_WEEK && gainKg < 0) {
    mention = true;
    message += ' You are lighter than before pregnancy, so please contact your midwife or doctor soon.';
  }

  return { bmi: round1(value), category, fetuses: i.fetuses, week: i.week, gainKg, total, weekly, expected, status, headline, message, notes, mentionToClinician: mention };
}

export function fmtKgLb(kg: number): string {
  return `${round1(kg)} kg (${round1(kgToLb(kg))} lb)`;
}
