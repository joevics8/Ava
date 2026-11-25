import { describe, expect, it } from 'vitest';
import {
  assessWeightGain, bmi, bmiCategory, classifyGain, expectedGainAtWeek, ftInToCm, kgToLb, lbToKg,
  validateWeightGainInput, type WeightGainInput, type WeightGainResult,
} from '../pregnancy-weight-gain';

const base: WeightGainInput = { heightCm: 165, startKg: 62, currentKg: 66, week: 24, fetuses: 'single' };
const ok = (o: Partial<WeightGainInput> = {}) => {
  const r = assessWeightGain({ ...base, ...o });
  if ('error' in r) throw new Error(r.error);
  return r as WeightGainResult;
};

describe('BMI and conversions', () => {
  it('computes BMI', () => expect(bmi(62, 165)).toBeCloseTo(22.77, 1));
  it('category boundaries', () => {
    expect(bmiCategory(18.4)).toBe('underweight');
    expect(bmiCategory(18.5)).toBe('normal');
    expect(bmiCategory(24.9)).toBe('normal');
    expect(bmiCategory(25)).toBe('overweight');
    expect(bmiCategory(29.9)).toBe('overweight');
    expect(bmiCategory(30)).toBe('obese');
  });
  it('converts units', () => {
    expect(lbToKg(220.462)).toBeCloseTo(100, 2);
    expect(kgToLb(100)).toBeCloseTo(220.462, 2);
    expect(ftInToCm(5, 5)).toBeCloseTo(165.1, 1);
  });
});

describe('total recommended gain (IOM 2009)', () => {
  it('singleton ranges by category', () => {
    expect(ok({ startKg: 50 }).total).toEqual({ min: 12.5, max: 18 }); // BMI 18.4
    expect(ok({ startKg: 62 }).total).toEqual({ min: 11.5, max: 16 });
    expect(ok({ startKg: 75 }).total).toEqual({ min: 7, max: 11.5 });
    expect(ok({ startKg: 90 }).total).toEqual({ min: 5, max: 9 });
  });
  it('twin ranges by category and none for underweight', () => {
    expect(ok({ fetuses: 'twins' }).total).toEqual({ min: 16.8, max: 24.5 });
    expect(ok({ fetuses: 'twins', startKg: 75 }).total).toEqual({ min: 14.1, max: 22.7 });
    expect(ok({ fetuses: 'twins', startKg: 90 }).total).toEqual({ min: 11.3, max: 19.1 });
    const u = ok({ fetuses: 'twins', startKg: 50, currentKg: 55 });
    expect(u.total).toBeNull();
    expect(u.expected).toBeNull();
    expect(u.status).toBeNull();
    expect(u.mentionToClinician).toBe(true);
  });
});

describe('expected gain by week', () => {
  it('end of first trimester is 0.5 to 2 kg', () => {
    expect(expectedGainAtWeek('normal', 'single', 13)).toEqual({ min: 0.5, max: 2 });
  });
  it('is proportionally lower earlier in the first trimester', () => {
    expect(expectedGainAtWeek('normal', 'single', 6.5)).toEqual({ min: 0.3, max: 1 });
  });
  it('normal BMI at week 24 uses 0.35 to 0.5 kg a week after week 13', () => {
    expect(expectedGainAtWeek('normal', 'single', 24)).toEqual({ min: 4.4, max: 7.5 });
  });
  it('week 40 lands near the total', () => {
    const e = expectedGainAtWeek('normal', 'single', 40)!;
    expect(e.min).toBeGreaterThan(9);
    expect(e.max).toBeLessThanOrEqual(16);
  });
  it('does not go past week 40', () => {
    expect(expectedGainAtWeek('obese', 'single', 42)).toEqual(expectedGainAtWeek('obese', 'single', 40));
  });
  it('twins reach the total at 37 weeks', () => {
    expect(expectedGainAtWeek('normal', 'twins', 37)).toEqual({ min: 16.8, max: 24.5 });
    expect(expectedGainAtWeek('normal', 'twins', 40)).toEqual({ min: 16.8, max: 24.5 });
  });
  it('lower BMI categories gain faster than higher ones', () => {
    const lo = expectedGainAtWeek('underweight', 'single', 30)!;
    const hi = expectedGainAtWeek('obese', 'single', 30)!;
    expect(lo.min).toBeGreaterThan(hi.max - 0.01);
  });
});

describe('classification', () => {
  const range = { min: 4.4, max: 7.5 };
  it('inside, near and outside the range', () => {
    expect(classifyGain(4.4, range)).toBe('on-track');
    expect(classifyGain(7.5, range)).toBe('on-track');
    expect(classifyGain(3.5, range)).toBe('slightly-low');
    expect(classifyGain(3.3, range)).toBe('low');
    expect(classifyGain(8.4, range)).toBe('slightly-high');
    expect(classifyGain(9, range)).toBe('high');
  });
  it('assess week 24 normal BMI gain of 4 kg is slightly low', () => {
    const r = ok();
    expect(r.gainKg).toBe(4);
    expect(r.status).toBe('slightly-low');
    expect(r.category).toBe('normal');
  });
  it('first trimester loss is reassuring in tone but low', () => {
    const r = ok({ week: 9, currentKg: 60.5 });
    expect(r.status).toBe('low');
    expect(r.message).toMatch(/morning sickness/);
  });
  it('weight loss after the first trimester prompts contact', () => {
    const r = ok({ week: 20, currentKg: 60 });
    expect(r.mentionToClinician).toBe(true);
    expect(r.message).toMatch(/contact your midwife or doctor/);
  });
  it('high gain tells her not to diet', () => {
    const r = ok({ currentKg: 80 });
    expect(r.status).toBe('high');
    expect(r.message).toMatch(/Do not start a diet/);
  });
});

describe('validation', () => {
  it('rejects bad input', () => {
    expect(validateWeightGainInput({ ...base, heightCm: 100 }).ok).toBe(false);
    expect(validateWeightGainInput({ ...base, startKg: 20 }).ok).toBe(false);
    expect(validateWeightGainInput({ ...base, currentKg: NaN }).ok).toBe(false);
    expect(validateWeightGainInput({ ...base, week: 2 }).ok).toBe(false);
    expect(validateWeightGainInput({ ...base, week: 43 }).ok).toBe(false);
    expect(validateWeightGainInput({ ...base, week: 20.5 }).ok).toBe(false);
    expect('error' in assessWeightGain({ ...base, heightCm: 300 })).toBe(true);
  });
  it('accepts good input', () => expect(validateWeightGainInput(base).ok).toBe(true));
});
