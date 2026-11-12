import { describe, expect, it } from 'vitest';
import {
  assessLab, glucoseToMgdl, hba1cToPercent, hbToGdl, mgdlToMmol, pcvToPercent, percentToMmolMol, type LabInput, type LabResult,
} from '../lab-ranges';

const base: LabInput = { test: 'hb', value: 13, unit: 'g/dL', sex: 'female', pregnancy: 'no' };
const run = (i: Partial<LabInput>) => assessLab({ ...base, ...i }) as LabResult;

describe('unit conversions', () => {
  it('haemoglobin g/L to g/dL', () => expect(hbToGdl(120, 'g/L')).toBe(12));
  it('PCV fraction to percent', () => expect(pcvToPercent(0.4, 'L/L')).toBeCloseTo(40));
  it('glucose mmol/L to mg/dL and back', () => {
    expect(glucoseToMgdl(5.6, 'mmol/L')).toBeCloseTo(100.9, 1);
    expect(glucoseToMgdl(7, 'mmol/L')).toBeGreaterThanOrEqual(126);
    expect(mgdlToMmol(126)).toBeCloseTo(7.0, 1);
    expect(glucoseToMgdl(100, 'mg/dL')).toBe(100);
  });
  it('HbA1c % and mmol/mol agree at the published cut-offs', () => {
    expect(Math.round(percentToMmolMol(5.7))).toBe(39);
    expect(Math.round(percentToMmolMol(6.5))).toBe(48);
    expect(hba1cToPercent(39, 'mmol/mol')).toBeGreaterThanOrEqual(5.7);
    expect(hba1cToPercent(48, 'mmol/mol')).toBeGreaterThanOrEqual(6.5);
    expect(hba1cToPercent(38, 'mmol/mol')).toBeLessThan(5.7);
    expect(hba1cToPercent(47, 'mmol/mol')).toBeLessThan(6.5);
  });
});

describe('haemoglobin (WHO)', () => {
  it('non-pregnant women: 12.0 is normal, 11.9 is mild anaemia', () => {
    expect(run({ value: 12 }).category).toBe('normal');
    expect(run({ value: 11.9 }).headline).toMatch(/Mild/);
    expect(run({ value: 11.9 }).category).toBe('attention');
  });
  it('men: threshold is 13.0', () => {
    expect(run({ sex: 'male', value: 13 }).category).toBe('normal');
    expect(run({ sex: 'male', value: 12.9 }).headline).toMatch(/Mild/);
  });
  it('severity bands for non-pregnant adults: mild 11-11.9, moderate 8-10.9, severe below 8', () => {
    expect(run({ value: 11 }).headline).toMatch(/Mild/);
    expect(run({ value: 10.9 }).headline).toMatch(/Moderate/);
    expect(run({ value: 8 }).headline).toMatch(/Moderate/);
    expect(run({ value: 7.9 }).headline).toMatch(/Severe/);
    expect(run({ value: 7.9 }).category).toBe('urgent');
  });
  it('pregnancy: 11.0 in first/third trimester, 10.5 in the second', () => {
    expect(run({ pregnancy: 'first-third', value: 11 }).category).toBe('normal');
    expect(run({ pregnancy: 'first-third', value: 10.9 }).headline).toMatch(/Mild/);
    expect(run({ pregnancy: 'second', value: 10.5 }).category).toBe('normal');
    expect(run({ pregnancy: 'second', value: 10.4 }).headline).toMatch(/Mild/);
  });
  it('pregnancy severity: moderate 7.0-9.9, severe below 7.0', () => {
    expect(run({ pregnancy: 'first-third', value: 9.9 }).headline).toMatch(/Moderate/);
    expect(run({ pregnancy: 'first-third', value: 7 }).headline).toMatch(/Moderate/);
    expect(run({ pregnancy: 'first-third', value: 6.9 }).headline).toMatch(/Severe/);
  });
  it('accepts g/L and shows both units', () => {
    const r = run({ value: 118, unit: 'g/L' });
    expect(r.headline).toMatch(/Mild/);
    expect(r.alsoShown).toContain('g/dL');
  });
  it('rejects impossible values (likely a unit mix-up)', () => {
    expect(assessLab({ ...base, value: 120 })).toHaveProperty('error');   // 120 g/dL
    expect(assessLab({ ...base, value: 1.2, unit: 'g/L' })).toHaveProperty('error');
  });
});

describe('PCV', () => {
  const pcv = (i: Partial<LabInput>) => run({ test: 'pcv', unit: '%', value: 40, ...i });
  it('within, below and above the typical range', () => {
    expect(pcv({}).category).toBe('normal');
    expect(pcv({ value: 33 }).category).toBe('attention');
    expect(pcv({ value: 28 }).category).toBe('concern');
    expect(pcv({ value: 50 }).headline).toMatch(/Above/);
    expect(pcv({ sex: 'male', value: 40 }).headline).toMatch(/Below/);
  });
  it('accepts the fraction form', () => {
    expect(pcv({ unit: 'L/L', value: 0.4 }).category).toBe('normal');
    expect(pcv({ unit: 'L/L', value: 0.4 }).alsoShown).toContain('40');
  });
  it('does not apply the adult range in pregnancy', () => {
    expect(pcv({ pregnancy: 'second', value: 33 }).category).toBe('info');
  });
});

describe('fasting glucose (ADA)', () => {
  const g = (value: number, unit: LabInput['unit'] = 'mg/dL') => run({ test: 'glucose', value, unit });
  it('bands in mg/dL', () => {
    expect(g(69).headline).toMatch(/Low/);
    expect(g(70).category).toBe('normal');
    expect(g(99).category).toBe('normal');
    expect(g(100).category).toBe('attention');
    expect(g(125).category).toBe('attention');
    expect(g(126).headline).toMatch(/diabetes range/);
    expect(g(300).category).toBe('urgent');
  });
  it('bands in mmol/L match', () => {
    expect(g(5.5, 'mmol/L').category).toBe('normal');
    expect(g(5.6, 'mmol/L').category).toBe('attention');
    expect(g(6.9, 'mmol/L').category).toBe('attention');
    expect(g(7.0, 'mmol/L').headline).toMatch(/diabetes range/);
    expect(g(3.8, 'mmol/L').headline).toMatch(/Low/);
  });
  it('rejects a mmol/L number typed as mg/dL and vice versa', () => {
    expect(assessLab({ ...base, test: 'glucose', unit: 'mg/dL', value: 5 })).toHaveProperty('error');
    expect(assessLab({ ...base, test: 'glucose', unit: 'mmol/L', value: 200 })).toHaveProperty('error');
  });
});

describe('HbA1c (ADA)', () => {
  const a = (value: number, unit: LabInput['unit'] = '%') => run({ test: 'hba1c', value, unit });
  it('bands in %', () => {
    expect(a(5.6).category).toBe('normal');
    expect(a(5.7).headline).toMatch(/Prediabetes/);
    expect(a(6.4).category).toBe('attention');
    expect(a(6.5).headline).toMatch(/diabetes range/);
  });
  it('bands in mmol/mol', () => {
    expect(a(38, 'mmol/mol').category).toBe('normal');
    expect(a(39, 'mmol/mol').category).toBe('attention');
    expect(a(47, 'mmol/mol').category).toBe('attention');
    expect(a(48, 'mmol/mol').category).toBe('concern');
  });
  it('shows the other unit', () => {
    expect(a(6.5).alsoShown).toContain('mmol/mol');
    expect(a(48, 'mmol/mol').alsoShown).toContain('%');
  });
});

describe('validation', () => {
  it('rejects zero, negative, NaN and a unit that does not fit the test', () => {
    expect(assessLab({ ...base, value: 0 })).toHaveProperty('error');
    expect(assessLab({ ...base, value: -5 })).toHaveProperty('error');
    expect(assessLab({ ...base, value: NaN })).toHaveProperty('error');
    expect(assessLab({ ...base, test: 'glucose', unit: '%', value: 5 })).toHaveProperty('error');
  });
});
