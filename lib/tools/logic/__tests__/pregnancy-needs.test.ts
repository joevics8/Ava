import { describe, expect, it } from 'vitest';
import { EXTRA_KCAL, FLUID, kcalLabel, pregnancyNeeds, trimesterOf, validateNeedsInput, type NeedsResult } from '../pregnancy-needs';

const get = (week: number, o = {}) => {
  const r = pregnancyNeeds({ week, fetuses: 'single', extraFluidFactors: false, ...o });
  if ('error' in r) throw new Error(r.error);
  return r as NeedsResult;
};

describe('trimester boundaries', () => {
  it('maps weeks to trimesters', () => {
    expect(trimesterOf(1)).toBe(1);
    expect(trimesterOf(13)).toBe(1);
    expect(trimesterOf(14)).toBe(2);
    expect(trimesterOf(27)).toBe(2);
    expect(trimesterOf(28)).toBe(3);
    expect(trimesterOf(42)).toBe(3);
  });
});

describe('extra energy', () => {
  it('uses 0 / 340 / 450 kcal (US) by trimester', () => {
    expect(EXTRA_KCAL[1].us).toBe(0);
    expect(EXTRA_KCAL[2].us).toBe(340);
    expect(EXTRA_KCAL[3].us).toBe(450);
  });
  it('first trimester needs none', () => {
    const r = get(8);
    expect(r.extraKcal.high).toBe(0);
    expect(kcalLabel(r.extraKcal)).toBe('No extra calories needed');
  });
  it('second trimester is up to 340 and third 200 to 450 (UK to US)', () => {
    expect(kcalLabel(get(20).extraKcal)).toBe('Up to 340 extra calories a day');
    expect(kcalLabel(get(34).extraKcal)).toBe('About 200 to 450 extra calories a day');
  });
  it('never exceeds the US figure', () => {
    for (let w = 1; w <= 42; w++) expect(get(w).extraKcal.high).toBeLessThanOrEqual(450);
  });
  it('twins get a no-exact-figure note', () => {
    expect(get(30, { fetuses: 'twins' }).twinNote).toMatch(/dietitian/);
    expect(get(30).twinNote).toBeNull();
  });
});

describe('fluids', () => {
  it('about 1.6 to 2.3 litres of drinks', () => {
    const d = get(20).drinks;
    expect(d.lowL).toBe(1.6);
    expect(d.highL).toBe(2.3);
    expect(d.lowCups).toBe(6);
    expect(d.highCups).toBe(9);
    expect(FLUID.totalIomL).toBe(3);
  });
  it('hot weather or vomiting raises the upper figure', () => {
    expect(get(20, { extraFluidFactors: true }).drinks.highL).toBeCloseTo(2.8, 5);
  });
});

describe('content', () => {
  it('folic acid only advised up to 12 weeks', () => {
    expect(get(12).folicAcidStillAdvised).toBe(true);
    expect(get(13).folicAcidStillAdvised).toBe(false);
  });
  it('has the five key nutrients and key foods to avoid', () => {
    const r = get(20);
    expect(r.nutrients.map(n => n.name.toLowerCase()).join(' ')).toMatch(/folic.*vitamin d.*iron.*iodine.*protein/);
    const a = r.avoid.map(x => x.title).join(' ').toLowerCase();
    expect(a).toContain('alcohol');
    expect(a).toContain('liver');
    expect(a).toContain('unpasteurised');
  });
  it('gives meal ideas for every trimester', () => {
    for (const w of [5, 20, 35]) expect(get(w).mealIdeas.length).toBeGreaterThan(0);
  });
});

describe('validation', () => {
  it('rejects bad weeks', () => {
    expect(validateNeedsInput({ week: 0, fetuses: 'single', extraFluidFactors: false })).not.toBeNull();
    expect(validateNeedsInput({ week: 43, fetuses: 'single', extraFluidFactors: false })).not.toBeNull();
    expect(validateNeedsInput({ week: 10.5, fetuses: 'single', extraFluidFactors: false })).not.toBeNull();
    expect(validateNeedsInput({ week: NaN, fetuses: 'single', extraFluidFactors: false })).not.toBeNull();
    expect('error' in pregnancyNeeds({ week: 50, fetuses: 'single', extraFluidFactors: false })).toBe(true);
  });
  it('accepts 1 to 42', () => expect(validateNeedsInput({ week: 42, fetuses: 'single', extraFluidFactors: false })).toBeNull());
});
