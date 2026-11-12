import { describe, expect, it } from 'vitest';
import { assessEmergencyContraception as assess, hoursBetween } from '../emergency-contraception';

const ids = (h: number, extra = {}) => assess({ hoursSince: h, ...extra }).options.filter(o => o.available).map(o => o.id);

describe('emergency contraception windows', () => {
  it('within 72 hours: all three options', () => {
    expect(ids(1)).toEqual(['copper-iud', 'ulipristal', 'levonorgestrel']);
    expect(ids(72)).toEqual(['copper-iud', 'ulipristal', 'levonorgestrel']);
  });
  it('72-120 hours: copper IUD and ulipristal only', () => {
    expect(ids(72.5)).toEqual(['copper-iud', 'ulipristal']);
    expect(ids(120)).toEqual(['copper-iud', 'ulipristal']);
  });
  it('after 120 hours: no standard option, but advice to call a clinic', () => {
    const r = assess({ hoursSince: 121 });
    expect(r.anyAvailable).toBe(false);
    expect(r.headline).toMatch(/speak to a clinic/);
  });
  it('hours left counts down and never goes negative', () => {
    const r = assess({ hoursSince: 100 });
    expect(r.options.find(o => o.id === 'ulipristal')!.hoursLeft).toBe(20);
    expect(r.options.find(o => o.id === 'levonorgestrel')!.hoursLeft).toBe(0);
  });
  it('higher weight flags levonorgestrel', () => {
    for (const x of [{ weightKg: 71 }, { bmi: 27 }]) {
      const r = assess({ hoursSince: 10, ...x });
      expect(r.higherWeight).toBe(true);
      expect(r.options.find(o => o.id === 'levonorgestrel')!.notes.join(' ')).toMatch(/70 kg or a BMI above 26/);
    }
  });
  it('70 kg or BMI 26 exactly is not flagged; missing values are not flagged', () => {
    expect(assess({ hoursSince: 10, weightKg: 70, bmi: 26 }).higherWeight).toBe(false);
    expect(assess({ hoursSince: 10 }).higherWeight).toBe(false);
    expect(assess({ hoursSince: 10, weightKg: null, bmi: null }).higherWeight).toBe(false);
  });
  it('rejects invalid time', () => {
    for (const h of [-1, NaN, Infinity]) expect(assess({ hoursSince: h }).valid).toBe(false);
    expect(assess({ hoursSince: NaN }).anyAvailable).toBe(false);
  });
  it('general advice covers the 3-week test, interacting medicines and ulipristal timing', () => {
    const r = assess({ hoursSince: 5 });
    const text = r.general.join(' ') + r.options.flatMap(o => o.notes).join(' ');
    expect(text).toMatch(/3 weeks/);
    expect(text).toMatch(/rifampicin/);
    expect(text).toMatch(/wait 5 days/);
  });
  it('hoursBetween', () => {
    expect(hoursBetween(0, 3_600_000 * 30)).toBe(30);
  });
});
