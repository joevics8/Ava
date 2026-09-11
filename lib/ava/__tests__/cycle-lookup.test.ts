import { describe, it, expect } from 'vitest';
import { getDayData } from '../cycle-lookup';

describe('getDayData — fertility labels', () => {
  it('never uses the word "Low" (replaced with "Minimal" per product decision)', () => {
    for (let day = 1; day <= 30; day++) {
      const data = getDayData(day, 30);
      expect(data.fertilityLabel).not.toBe('Low');
    }
  });

  it('labels ovulation day itself as Peak fertility', () => {
    // 30-day cycle: ovulation day = 30 - 14 = 16
    const data = getDayData(16, 30);
    expect(data.fertilityLabel).toBe('Peak');
  });

  it('labels days outside the fertile window as Minimal', () => {
    // Day 28 of a 30-day cycle is well outside the ~7-day fertile window
    // around ovulation day 16 (offset +12) — this is the exact scenario
    // from the production screenshot that prompted the "Low" -> "Minimal"
    // fix and the "Fertility:" -> "Fertility possibility:" wording fix.
    const data = getDayData(28, 30);
    expect(data.fertilityLabel).toBe('Minimal');
  });

  it('labels the fertile window days as Possible/Moderate/High around ovulation', () => {
    const cycleLength = 30;
    const ovulationDay = 16;
    expect(getDayData(ovulationDay - 4, cycleLength).fertilityLabel).toBe('Possible');
    expect(getDayData(ovulationDay - 2, cycleLength).fertilityLabel).toBe('Moderate');
    expect(getDayData(ovulationDay - 1, cycleLength).fertilityLabel).toBe('High');
    expect(getDayData(ovulationDay + 1, cycleLength).fertilityLabel).toBe('Possible');
  });
});

describe('getDayData — phase for the exact production screenshot scenario', () => {
  it('Day 28 of a 30-day cycle is premenstrual, matching the reported digest', () => {
    const data = getDayData(28, 30);
    expect(data.phase).toBe('premenstrual');
    expect(data.phaseLabel).toMatch(/premenstrual/i);
  });

  it('day 1 of any cycle length is menstrual', () => {
    expect(getDayData(1, 28).phase).toBe('menstrual');
    expect(getDayData(1, 35).phase).toBe('menstrual');
  });
});

describe('getDayData — clamping', () => {
  it('does not throw for cycle lengths outside the documented 21-36 range', () => {
    expect(() => getDayData(1, 10)).not.toThrow();
    expect(() => getDayData(1, 90)).not.toThrow();
  });
});
